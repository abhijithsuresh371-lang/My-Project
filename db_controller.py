from flask import jsonify, request
from services.db_services import save_certificate_data, fetch_all_history # 👈 Import new service

def save_certificate_controller():
    # ... (Keep your existing save logic here if you want a manual API) ...
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        result = save_certificate_data(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ NEW: History Controller
def get_history_controller():
    try:
        records = fetch_all_history()
        return jsonify(records), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500