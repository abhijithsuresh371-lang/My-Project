import os
import time
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ✅ 1. Import SocketIO
from flask_socketio import SocketIO, emit

# --- IMPORTS ---
from controllers.verification_controller import verify_certificate, admin_verify_certificate
from controllers.db_controller import get_history_controller, save_certificate_controller
from services import db_services

# ✅ 2. Import Services
from services.ai_service import analyze_document
from services.bot_service import bot_service
from services.ocr_service import extract_text_from_image

# Initialize App
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads' 
CORS(app)

# ✅ 3. Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def home():
    return "DIVA Verification API is Running!"

# --- VERIFICATION ROUTES ---

@app.route('/api/verify-slot', methods=['POST'])
def verify_route():
    return verify_certificate(request)

@app.route('/api/admin/verify', methods=['POST'])
def admin_route():
    # The controller handles file saving, OCR, and AI logic internally.
    return admin_verify_certificate(request)

# --- DATABASE ROUTES ---

@app.route('/api/db/save', methods=['POST'])
def manual_save_route():
    return save_certificate_controller()

@app.route('/api/admin/history', methods=['GET'])
def history_route():
    return get_history_controller()

# Route to fetch details for ONE student
@app.route('/api/admin/history/<int:admno>', methods=['GET'])
def get_student_details_route(admno):
    result = db_services.get_student_full_details(admno)
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 200

# --- ADMIN ROUTES ---

@app.route('/api/admin/history/clear', methods=['DELETE'])
def clear_history():
    result = db_services.clear_all_history()
    if 'error' in result:
        return jsonify(result), 500
    return jsonify(result), 200

# ==========================================
# 🚀 STUDENT REQUEST ROUTES
# ==========================================

@app.route('/api/student/submit', methods=['POST'])
def student_submit_route():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        level = request.form.get('level') 
        image = request.files.get('image')
        
        if not (name and email and level and image):
            return jsonify({"error": "Missing required fields"}), 400

        save_dir = os.path.join("uploads", "requests")
        if not os.path.exists(save_dir): os.makedirs(save_dir)
        
        img_name = f"{int(time.time())}_{secure_filename(image.filename)}"
        img_path = os.path.join(save_dir, img_name)
        image.save(img_path)

        conn = db_services.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO verification_requests 
            (candidate_name, email, phone, level, image_path, status)
            VALUES (%s, %s, %s, %s, %s, 'PENDING')
        """, (name, email, phone, level, img_name))
        conn.commit()
        conn.close()

        return jsonify({"message": "Request submitted successfully!"}), 200

    except Exception as e:
        print(f"Student Submit Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/requests', methods=['GET'])
def get_pending_requests():
    conn = db_services.get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM verification_requests WHERE status='PENDING' ORDER BY created_at DESC")
    requests = cursor.fetchall()
    conn.close()
    return jsonify(requests), 200

@app.route('/api/uploads/requests/<path:filename>')
def serve_request_file(filename):
    return send_from_directory(os.path.join("uploads", "requests"), filename)

@app.route('/api/admin/requests/clear/<int:request_id>', methods=['POST'])
def clear_request(request_id):
    try:
        conn = db_services.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE verification_requests SET status = 'VERIFIED' WHERE id = %s", (request_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Request cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 

# ==========================================
# 💬 CHATBOT SOCKET LISTENERS
# ==========================================

@socketio.on('connect')
def handle_connect():
    print('✅ Client connected to Chat')

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Client disconnected from Chat')

@socketio.on('send_message')
def handle_chat_message(data):
    user_msg = data.get('message')
    user_type = data.get('userType', 'student')
    user_name = data.get('userName', 'User')
    user_email = data.get('userEmail') 

    print(f"📩 Chat from {user_name} ({user_type}): {user_msg}")

    ai_reply_text = bot_service.generate_response(user_msg, user_type, user_email)

    emit('receive_message', {
        'id': f"ai_{int(time.time())}",
        'text': ai_reply_text,
        'sender': 'system'
    })

@app.route('/api/student/status/<email>', methods=['GET'])
def get_student_status(email):
    try:
        conn = db_services.get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT created_at, level, status, result_status, updated_at 
            FROM verification_requests 
            WHERE email = %s 
            ORDER BY created_at DESC 
            LIMIT 1
        """
        cursor.execute(query, (email,))
        record = cursor.fetchone()
        conn.close()

        if record:
            return jsonify(record)
        else:
            return jsonify({"status": "NOT_FOUND"}), 404

    except Exception as e:
        print(f"Status Fetch Error: {e}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)