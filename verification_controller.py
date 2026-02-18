import os
import cv2
import json
import uuid  # Added to prevent file name collisions
from werkzeug.utils import secure_filename
from flask import jsonify
from services import ocr_service, ai_service, tamper_service, grading_service 
from thefuzz import fuzz

# --- HELPER: Save Debug File ---
def save_debug_log(filename, content):
    debug_dir = "debug_logs"
    if not os.path.exists(debug_dir): os.makedirs(debug_dir)
    path = os.path.join(debug_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        if isinstance(content, (dict, list)):
            json.dump(content, f, indent=4)
        else:
            f.write(str(content))

def normalize_text(text):
    if not text: return ""
    return "".join(filter(str.isalnum, text.lower()))

def verify_identity(user_input_name, extracted_name):
    if not user_input_name: return "SKIPPED", "No name provided."
    if not extracted_name: return "UNKNOWN", "Name not found in document."
    norm_user = normalize_text(user_input_name)
    norm_extracted = normalize_text(extracted_name)
    if norm_user == norm_extracted: return "MATCH", "Exact Match"
    similarity = fuzz.ratio(norm_user, norm_extracted)
    if similarity > 85: return "MATCH", f"Fuzzy Match ({similarity}%)"
    return "MISMATCH", f"Name mismatch ({similarity}%)"

# --- MAIN LOGIC ---
def process_verification(request, level_hint=None):
    pdf_path = None
    img_path = None
    try:
        print("\n--- DIVA SYSTEM: STARTING VERIFICATION ---")
        
        # 1. INPUT CAPTURE
        candidate_name = request.form.get('candidate_name', request.form.get('student_name', "")).strip()
        category = request.form.get('category', "Unknown")

        file_obj = None
        for key in ['original_pdf', 'mark_10', 'mark_12']:
            if key in request.files:
                file_obj = request.files[key]
                break
            
        image = request.files.get('scanned_image')

        if not file_obj or not image:
            return jsonify({"error": "Missing PDF or Scanned Image"}), 400

        # 2. UNIQUE FILE SAVING (Crucial to prevent result caching)
        upload_folder = "uploads"
        if not os.path.exists(upload_folder): os.makedirs(upload_folder)

        # Generate a unique session ID for this specific upload
        session_id = str(uuid.uuid4())[:8]
        
        # Prefix filenames with session_id
        pdf_name = f"{session_id}_{secure_filename(file_obj.filename)}"
        img_name = f"{session_id}_{secure_filename(image.filename)}"

        pdf_path = os.path.join(upload_folder, pdf_name)
        img_path = os.path.join(upload_folder, img_name)
        
        file_obj.save(pdf_path)
        image.save(img_path)

        # 3. SERVICE CHAIN 
        cv_image = cv2.imread(img_path)

        # A. OCR (Safe Execution)
        ocr_text = ocr_service.extract_text(img_path)
        
        # 🛑 SAFETY CHECK: If OCR returns nothing, STOP immediately.
        if not ocr_text or not ocr_text.strip(): 
            return jsonify({
                "error": "OCR Failed: The image was too blurry or contained no readable text. Please upload a clearer scan."
            }), 400  # Return 400 Bad Request instead of crashing with 500

        save_debug_log(f"{session_id}_1_ocr_raw.txt", ocr_text) # Only one log needed
        
        # REMOVED REDUNDANT 2nd CALL HERE
        
        # B. AI EXTRACTION

        # B. AI EXTRACTION
        extracted_data = ai_service.analyze_document(ocr_text, level_hint=level_hint) 
        save_debug_log(f"{session_id}_2_ai_response.json", extracted_data)

        if not extracted_data or 'error' in extracted_data: 
            return jsonify({"error": "AI Extraction Failed"}), 500

        # C. GRADING SERVICE
        try:
            grading_result = grading_service.calculate_grading(extracted_data) 
            extracted_data['details']['grading'] = grading_result
        except Exception:
            extracted_data['details']['grading'] = {"score_display": "N/A", "percentage": "N/A"}

        # D. TAMPER SERVICE
        tamper_result = tamper_service.detect_tampering(pdf_path, cv_image)
        save_debug_log(f"{session_id}_3_tamper_check.json", tamper_result)

        # E. CROSS-CHECK (Image vs PDF Metadata/Content)
        # This is where we verify if the Image matches the PDF data
        pdf_text = ocr_service.extract_text_from_pdf(pdf_path) 
        
        is_document_mismatch = False
        mismatch_reason = ""

        # Only perform check if we actually have PDF text (Native PDF)
        if pdf_text and len(pdf_text) > 50:
            # 1. Check Roll Number
            img_roll = str(extracted_data.get('details', {}).get('roll_no', "")).strip()
            # Handle N/A or empty
            if img_roll and len(img_roll) > 4 and img_roll != "N/A":
                # Normalize PDF text for search
                norm_pdf = pdf_text.replace(" ", "").upper()
                if img_roll not in norm_pdf:
                    is_document_mismatch = True
                    mismatch_reason = f"Roll No {img_roll} found in Image but NOT in PDF."
            
            # 2. Check Name (if Roll No check didn't already fail)
            if not is_document_mismatch:
                img_name = str(extracted_data.get('details', {}).get('name', "")).strip()
                if img_name and len(img_name) > 3:
                     # Simple fuzzy check for name in PDF
                     # We use a broad search because PDF text might be messy
                     if fuzz.partial_ratio(img_name.upper(), pdf_text.upper()) < 60:
                         is_document_mismatch = True
                         mismatch_reason = f"Name '{img_name}' mismatch between Image and PDF."

        if is_document_mismatch:
            tamper_result['details'].append(f"CRITICAL: {mismatch_reason}")
            tamper_result['status'] = "Tampered" # Force tamper status on mismatch

        # F. IDENTITY CHECK
        cert_name = extracted_data.get('details', {}).get('name', "")
        identity_status, identity_msg = verify_identity(candidate_name, cert_name)
        
        layout = "LAYOUT_GRADES_ONLY" if "KERALA_SSLC" in extracted_data.get('type', '') else "STANDARD"

        # 4. FINAL VERDICT
        # Verdict Priority: MISMATCH > FLAGGED > PASSED
        if is_document_mismatch:
            final_verdict = "MISMATCH"
        elif (tamper_result.get('status') == "Clean") and (identity_status == "MATCH"):
            final_verdict = "PASSED"
        else:
            final_verdict = "FLAGGED"

        return jsonify({
            "status": "success",
            "session_id": session_id, 
            "extracted_data": extracted_data,
            "display_meta": { "layout": layout, "category": category },
            "verification_report": {
                "final_verdict": final_verdict,
                "document_mismatch": is_document_mismatch, # 👈 New Frontend Flag
                "mismatch_reason": mismatch_reason,
                "identity_status": identity_status,
                "identity_msg": identity_msg,
                "tamper_check": tamper_result,
                "issues": tamper_result.get('details', [])
            }
        }), 200

    except Exception as e:
        print(f"SYSTEM ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if pdf_path and os.path.exists(pdf_path): os.remove(pdf_path)
        if img_path and os.path.exists(img_path): os.remove(img_path)

# --- ROUTE HANDLERS ---
def verify_certificate(request):
    level = request.form.get('level') 
    return process_verification(request, level_hint=level)

def admin_verify_certificate(request):
    level = request.form.get('level') 
    return process_verification(request, level_hint=level)