import requests
import cv2
import os
import json
import time
import numpy as np
import pikepdf
import fitz 

# [WARNING] FREE API KEY (Make sure this is valid!)
API_KEY = 'K81663785688957'

# ==========================================
# 0. LOGGING HELPER
# ==========================================
def save_ocr_log(content, filename="latest_ocr_output.txt"):
    try:
        if not os.path.exists("logs"): os.makedirs("logs")
        with open(f"logs/{filename}", "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[LOG] Log saved: logs/{filename}")
    except: pass

# ==========================================
# 1. RUTHLESS COMPRESSOR (The Fix)
# ==========================================
def force_compress_under_1mb(img_data, quality=90, resize_factor=1.0):
    """
    Recursively compresses an image until it is strictly under 1000KB.
    Strategy: Lower Quality -> If that fails, Resize Dimensions.
    """
    try:
        # Decode bytes to image
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None: return None

        # Resize if factor is not 1.0 (Used in recursion)
        if resize_factor < 1.0:
            width = int(img.shape[1] * resize_factor)
            height = int(img.shape[0] * resize_factor)
            img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)

        # Encode with current quality
        success, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, quality])
        if not success: return None
        
        current_size_kb = len(buffer) / 1024

        # [SUCCESS] It fits!
        if current_size_kb < 980: # Safety margin (980KB < 1024KB)
            print(f"[SUCCESS] Compressed to {current_size_kb:.0f} KB (Q={quality}, Scale={resize_factor:.2f})")
            return buffer.tobytes()

        # [RETRY] RECURSION: File still too big? Crunch harder.
        # Strategy A: Lower Quality (down to 30)
        if quality > 30:
            return force_compress_under_1mb(img_data, quality - 15, resize_factor)
        
        # Strategy B: Shrink Dimensions (if quality is already low)
        # This is the "Nuclear Option" that guarantees we pass the 1MB limit
        if resize_factor > 0.2:
            print(f"[INFO] Still big ({current_size_kb:.0f} KB). Resizing dimensions...")
            return force_compress_under_1mb(img_data, quality=70, resize_factor=resize_factor * 0.7)
            
        print("[ERROR] Could not compress image safely.")
        return None

    except Exception as e:
        print(f"[WARNING] Compression Crash: {e}")
        return None

# ==========================================
# 2. IMAGE ENHANCER (Updated to use Ruthless Compressor)
# ==========================================
def preprocess_and_enhance(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        print("[INFO] Enhancing image for OCR...")

        # A. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # B. Upscale (Only if small)
        if gray.shape[1] < 1500:
            gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

        # C. Binarize (High Contrast)
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15)
        denoised = cv2.fastNlMeansDenoising(binary, None, 10, 7, 21)

        # D. Encode & Force Compress Result
        success, buffer = cv2.imencode('.jpg', denoised)
        if success:
            # Send the enhanced image to the ruthless compressor to ensure limits
            return force_compress_under_1mb(buffer.tobytes())
            
        return image_bytes
    except: return image_bytes

# ==========================================
# 3. PDF UTILS (ENHANCED WITH FALLBACK)
# ==========================================
def extract_text_from_pdf(pdf_path):
    """
    Extracts text from PDF. 
    1. Tries NATIVE extraction (fast, PyMuPDF).
    2. If empty (Scanned PDF), falls back to CLOUD OCR (slow but robust).
    """
    try:
        if not os.path.exists(pdf_path): return ""
        
        # Method A: Native Text (PyMuPDF)
        text = ""
        try:
            with fitz.open(pdf_path) as doc:
                for page in doc: text += page.get_text()
        except: pass
        
        # Validation: If text is substantial, return it
        if len(text.strip()) > 50:
            t = text.upper()
            save_ocr_log(t, "latest_pdf_text_log_native.txt")
            return t
        
        # Method B: Fallback to Cloud OCR (Scanned PDF)
        print("[INFO] PDF seems scanned (No native text). Falling back to Cloud OCR...")
        cloud_text = extract_text(pdf_path, log_file="latest_pdf_text_log_cloud.txt")
        return cloud_text.upper()

    except Exception as e: 
        print(f"[ERROR] PDF Extraction failed: {e}")
        return ""

def compress_pdf_to_light(pdf_path):
    try:
        if os.path.getsize(pdf_path) < 1e6: return pdf_path
        out = pdf_path.replace(".pdf", "_compressed.pdf")
        with pikepdf.open(pdf_path) as p: p.save(out, linearize=True)
        return out
    except: return pdf_path

# ==========================================
# 4. MAIN EXTRACTOR
# ==========================================
def extract_text(file_input, log_file="latest_ocr_scan_log.txt"):
    print("\n[INFO] --- STARTING CLOUD OCR ---")
    file_bytes = None
    file_type = 'jpg'
    
    if file_input.lower().endswith('.pdf'):
        p = compress_pdf_to_light(file_input)
        with open(p, 'rb') as f: file_bytes = f.read()
        file_type = 'pdf'
    else:
        # Load raw bytes
        with open(file_input, "rb") as f: raw = f.read()
        if len(raw) > 1024 * 1024:
            print(f"[WARNING] Image size {len(raw)/1024:.0f}KB > 1MB. compressing...")
            file_bytes = force_compress_under_1mb(raw)
        else:
            file_bytes = raw
        file_type = 'jpg'

    if not file_bytes: return ""

    def send_to_api(engine, image_data):
        print(f"[INFO] Sending to OCR Engine {engine} (Size: {len(image_data)/1024:.1f} KB)...")
        
        # RETRY LOOP (2 Attempts: Try -> Retry once)
        for attempt in range(2):
            try:
                payload = {'apikey': API_KEY, 'language': 'eng', 'scale': True, 'OCREngine': engine}
                files = {'file': (f"img.{file_type}", image_data, 'application/pdf' if file_type=='pdf' else 'image/jpeg')}
                
                # Optimized Timeout: 20s is enough for a good connection. Anything more is likely a hang.
                r = requests.post('https://api.ocr.space/parse/image', data=payload, files=files, timeout=20)
                
                # Check if we got a valid JSON response
                try:
                    res = r.json()
                except:
                    print(f"[WARNING] Attempt {attempt+1}: Invalid JSON response.")
                    continue

                if type(res) is dict and res.get('IsErroredOnProcessing'):
                    err_msg = res.get('ErrorMessage')
                    print(f"[ERROR] Attempt {attempt+1} API Error: {err_msg}")
                    time.sleep(1)
                    continue
                    
                if res.get('ParsedResults'):
                    return "\n".join([p.get('ParsedText', "") for p in res.get('ParsedResults')])
                
                return "" # Valid response but no text

            except requests.exceptions.RequestException as e:
                print(f"[WARNING] Attempt {attempt+1} Net Error: {e}")
                if attempt < 1:
                    print("[RETRY] Retrying in 1 second...")
                    time.sleep(1)
                else:
                    return "" # Failed after 2 tries
            except Exception as e:
                print(f"[WARNING] Critical Error: {str(e)}")
                return ""
        
        return ""

    # Attempt 1: Compressed Original
    text = send_to_api('2', file_bytes)

    # Attempt 2: Enhanced Version (If Attempt 1 failed)
    if not text.strip() and file_type == 'jpg':
        print("[WARNING] OCR failed. Enhancing...")
        enhanced_bytes = preprocess_and_enhance(file_bytes)
        if enhanced_bytes:
            text = send_to_api('1', enhanced_bytes)

    if text.strip():
        print(f"[SUCCESS] OCR Success! ({len(text)} chars)")
        save_ocr_log(text, log_file)
        return text
    else:
        print("[CRITICAL] Image Unreadable.")
        return ""

extract_text_from_image = extract_text