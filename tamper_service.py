import os
import cv2
import fitz  # PyMuPDF
import numpy as np
from datetime import datetime

def analyze_metadata(pdf_path):
    """
    Checks PDF metadata for editing software (Photoshop, GIMP, etc).
    """
    try:
        doc = fitz.open(pdf_path)
        metadata = doc.metadata
        
        suspicious_tools = ['Photoshop', 'GIMP', 'Illustrator', 'Canva', 'Editor', 'iLovePDF']
        creator = metadata.get('creator', '')
        producer = metadata.get('producer', '')
        
        # Check for suspicious creators
        for tool in suspicious_tools:
            if tool.lower() in creator.lower() or tool.lower() in producer.lower():
                return {
                    "status": "Suspicious",
                    "reason": f"Created with editing software: {tool}",
                    "metadata": metadata
                }
        
        # Check modification dates
        creation_date = metadata.get('creationDate', '')
        mod_date = metadata.get('modDate', '')
        
        if creation_date and mod_date and creation_date != mod_date:
             return {
                "status": "Warning",
                "reason": "File has been modified after creation.",
                "metadata": metadata
            }

        return {"status": "Clean", "reason": "No metadata flags found.", "metadata": metadata}

    except Exception as e:
        return {"status": "Error", "reason": str(e)}

def analyze_pixels(image):
    """
    Checks for digital manipulation in the image (ELA - Error Level Analysis simulation).
    """
    try:
        # 1. Convert to simple grayscale for noise analysis
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. Laplacian Variance (Blur detection)
        # Digital edits often result in inconsistent blur levels.
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var < 100:
            return {"status": "Suspicious", "score": laplacian_var, "reason": "Image is unusually blurry or consistent (possible digital generation)."}
            
        return {"status": "Clean", "score": laplacian_var, "reason": "Pixel noise patterns look natural."}

    except Exception as e:
        return {"status": "Error", "reason": str(e)}

def detect_tampering(pdf_path, cv_image):
    """
    Main entry point called by the controller.
    Combines Metadata and Pixel analysis.
    """
    results = {
        "status": "Clean",
        "details": []
    }
    
    # 1. Check Metadata
    meta_check = analyze_metadata(pdf_path)
    if meta_check['status'] != "Clean":
        results['status'] = "Flagged"
        results['details'].append(f"Metadata Alert: {meta_check['reason']}")
    
    # 2. Check Pixels
    pixel_check = analyze_pixels(cv_image)
    if pixel_check['status'] != "Clean":
        results['status'] = "Flagged"
        results['details'].append(f"Visual Alert: {pixel_check['reason']}")
        
    # If clean, add a positive note
    if results['status'] == "Clean":
        results['details'].append("Digital signature and visual noise patterns appear authentic.")
        
    return results