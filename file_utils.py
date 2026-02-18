import numpy as np
import cv2
from pdf2image import convert_from_bytes

# ⚠️ Your Poppler Path - UPDATE THIS!
POPPLER_PATH = r"C:\Users\VIGNESH J\Downloads\Release-25.12.0-0\poppler-25.12.0\Library\bin"

# --- HELPER 1: Force any image to be 3-Channel Color (BGR) ---
def force_to_bgr(image):
    """
    Accepts an image of ANY format (Gray, BGR, BGRA) and forces it to BGR.
    Prevents 'scn is 1' errors when passing Grayscale to Color functions.
    """
    if image is None:
        return None
    
    # Case 1: Grayscale (2 Dimensions: Height, Width) -> Convert to BGR
    if len(image.shape) == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    
    # Case 2: Color (3 Dimensions: Height, Width, Channels)
    if len(image.shape) == 3:
        channels = image.shape[2]
        if channels == 1:
            # It has 3 dims but 1 channel (rare, but happens)
            return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        elif channels == 4:
            # It is BGRA (has alpha transparency) -> Convert to BGR
            return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
            
    # Default: It is already BGR (3 channels)
    return image

# --- HELPER 2: Force any image to be 1-Channel Grayscale ---
def force_to_gray(image):
    """
    Accepts an image of ANY format and forces it to Grayscale.
    Prevents errors when trying to threshold an already-gray image.
    """
    if image is None:
        return None

    # Case 1: Already Grayscale (2 Dimensions)
    if len(image.shape) == 2:
        return image
        
    # Case 2: Color (3 Dimensions)
    if len(image.shape) == 3:
        if image.shape[2] == 1:
            return image[:, :, 0]  # Squeeze to 2D
        else:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
    return image

# --- MAIN FUNCTION 1: Load File ---
def convert_file_to_image(file):
    try:
        image = None
        
        # 1. Handle PDF
        if file.filename.lower().endswith('.pdf'):
            images = convert_from_bytes(file.read(), dpi=300, poppler_path=POPPLER_PATH)
            if images:
                # Convert PIL to NumPy
                image = np.array(images[0])
                # PIL is RGB, OpenCV needs BGR.
                # Check if PIL gave us Grayscale (L mode) or RGB
                if len(image.shape) == 3:
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                else:
                    # PIL gave Grayscale. We handled this in force_to_bgr later,
                    # but let's make it BGR now to be safe.
                    image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

        # 2. Handle Images (JPG, PNG)
        else:
            file_bytes = np.frombuffer(file.read(), np.uint8)
            # IMREAD_UNCHANGED loads it exactly as is (could be Gray, BGR, or BGRA)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_UNCHANGED)

        # 3. SAFETY NET: Always return a Standard BGR Image
        return force_to_bgr(image)

    except Exception as e:
        print(f"File Conversion Error: {e}")
        return None

# --- MAIN FUNCTION 2: Pre-process ---
def preprocess_image_for_ocr(image):
    try:
        if image is None:
            return None
        
        # 1. Safely Convert to Grayscale
        # We use our helper so it NEVER crashes regardless of input
        gray = force_to_gray(image)
        
        # 2. Rescale (Zoom in 2x)
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        # 3. Adaptive Threshold
        processed = cv2.adaptiveThreshold(
            gray, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 31, 15
        )
        
        return processed
    except Exception as e:
        print(f"Preprocessing Error: {e}")
        return None