import requests
import json
import re
# from config import SARVAM_API_KEY, SARVAM_URL # [ERROR] File does not exist
from difflib import SequenceMatcher
from services.certificate_templates import get_template
from services import db_services 

# [CONFIG] CONFIGURATION
SARVAM_API_KEY = "Your API Key"  
SARVAM_URL = "https://api.sarvam.ai/v1/chat/completions"

# [INFO] PRESERVED CONTEXT: YUVAKSHETRA COLLEGE
COLLEGE_CONTEXT = """
You are DIVA, the AI Verification Assistant, exclusively assigned to Yuvakshetra Institute of Management Studies (YIMS).
Here is the official information about the college:
NAME: Yuvakshetra Institute of Management Studies (YIMS)
LOCATION: Ezhakkad (PO), Mundur, Palakkad - 678 631, Kerala, India.
AFFILIATION: Affiliated to the University of Calicut and managed by the Catholic Diocese of Palghat.
ESTABLISHED: 2005.

ABOUT US:
"Yuvakshetra" means a holy gathering place for the youth. The college is a centre for higher education in the Palakkad District, known for imparting professionalism and discipline. It recently won the "Pride of Nations Award 2025" for Best College of Kerala.

COURSES OFFERED:
1. Hotel Management: B.Sc. Hotel Management & Catering Science, B.Sc. Hotel Management & Culinary Arts.
2. Computer Science: B.Sc. Computer Science, BCA (Bachelor of Computer Applications), M.Sc. Computer Science.
3. Commerce: B.Com Finance, B.Com Computer Application, B.Com Taxation, B.B.A (Bachelor of Business Administration), M.Com Finance.
4. Science: B.Sc. Mathematics, B.Sc. Physics, B.Sc. Chemistry, B.Sc. Geography, B.Sc. Psychology, M.Sc. Geography, M.Sc. Psychology.
5. English: B.A. English Language & Literature, M.A. English Language & Literature.

ADMISSION PROCESS:
- Merit Quota: Candidates must register through the University of Calicut's Centralised Admission Process (CAP).
- Management Quota: Apply online via the college website (www.yuvakshetra.org) or visit the campus office.
- Selection: Admission is based on Merit (Qualifying Exam Marks) + Interview.

CONTACT:
- Admissions & Office: 9961233888, 9400012368, 0491-2846426
- Email: admission@yuvakshetra.org
- Website: www.yuvakshetra.org
"""

# ==========================================
# 0. HELPER: CLEANING FUNCTIONS (NEW)
# ==========================================
WORD_TO_NUM = {
    'ZERO': 0, 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5,
    'SIX': 6, 'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
    'ELEVEN': 11, 'TWELVE': 12, 'THIRTEEN': 13, 'FOURTEEN': 14,
    'FIFTEEN': 15, 'SIXTEEN': 16, 'SEVENTEEN': 17, 'EIGHTEEN': 18,
    'NINETEEN': 19, 'TWENTY': 20, 'THIRTY': 30, 'FORTY': 40,
    'FIFTY': 50, 'SIXTY': 60, 'SEVENTY': 70, 'EIGHTY': 80,
    'NINETY': 90, 'HUNDRED': 100
}

def convert_to_number(text):
    """
    Converts number words to digits.
    e.g., "SIXTY ONE" -> "61", "FORTY EIGHT" -> "48"
    """
    if not text: return "N/A"
    
    # If it's already a number, return it
    text_str = str(text).strip().upper()
    if text_str.replace('.', '', 1).isdigit():
        return text_str
        
    # Split by space or hyphen
    words = re.split(r'[\s\-]+', text_str)
    total = 0
    current = 0
    
    found_number = False
    
    for w in words:
        if w in WORD_TO_NUM:
            found_number = True
            val = WORD_TO_NUM[w]
            if val == 100:
                current = current * 100 if current != 0 else 100
            else:
                current += val
        elif w == "AND":
            continue
        else:
            # If we hit a non-number word, stop unless we haven't found any numbers yet
            # This prevents parsing mixed text like "Rank One" -> 1 incorrectly if "Rank" is ignored? 
            # Actually for marks, it's usually just "SIXTY ONE", so let's be strict.
            pass

    if found_number:
        return str(total + current)
    
    return text  # Return original if no conversion possible

def clean_grade(grade_text):
    """Fixes 'A Plus' -> 'A+', 'B Only' -> 'B'."""
    if not grade_text: return "N/A"
    g = str(grade_text).strip().upper()
    replacements = {"PLUS": "+", "MINUS": "-", "ONLY": "", "ONE": "", "ZERO": "", "GRADE": ""}
    for word, sym in replacements.items():
        g = g.replace(word, sym)
    return "".join([c for c in g if c in "ABCDEF+12"])

def clean_internal_marks(subjects, template_name):
    """Forces N/A marks for CBSE internal subjects."""
    if "CBSE" not in template_name: return subjects
    
    internal_keywords = ["WORK EXP", "GENERAL STUD", "PHYSICAL ED", "HEALTH AND PHYSICAL"]
    cleaned_subjects = []
    
    for sub in subjects:
        name_upper = sub.get("subject", "").upper()
        # If it's an internal subject, force marks to N/A
        if any(k in name_upper for k in internal_keywords):
            sub["marks"] = "N/A"
        # [NEW] Convert marks to number if they are words
        elif sub.get("marks"):
             sub["marks"] = convert_to_number(sub["marks"])
             
        cleaned_subjects.append(sub)
    return cleaned_subjects

def clean_kerala_subjects(subjects, template_name):
    """
    Filters out header rows like "PART I", "PART II", "PART III (Optionals)" 
    which are mistakenly identified as subjects in Kerala 12th.
    """
    if "KERALA_HSE" not in template_name: return subjects

    noise_keywords = ["PART I", "PART II", "PART III", "OPTIONALS", "FIRST YEAR", "SECOND YEAR", "GRAND TOTAL",
                      "PARTI", "PARTII", "PARTIII"]
    valid_subjects = []

    for sub in subjects:
        name_upper = str(sub.get("subject", "")).upper().strip()
        
        # If the subject name contains any noise keyword, skip it (filter out)
        # using exact match or strong partial match might be safer
        is_noise = any(k in name_upper for k in noise_keywords)
        
        # "PART I ENGLISH" is valid? No, usually "ENGLISH" is the subject logic below "PART I"
        # But user says: "PARTI 134 A". The subject name is "PARTI". 
        
        # Let's clean stricter: "PART I" is definitely noise. 
        # But if it is "PART I ENGLISH" (rare, but possible if OCR merges), we might lose it?
        # User example shows it on separate lines.
        
        if is_noise:
            continue
            
        valid_subjects.append(sub)

    return valid_subjects

def clean_roll_number(roll_no):
    """
    Sanitizes roll numbers. 
    1. Removes all non-digit characters (slashes, letters, hyphens).
    2. Enforces length check (must be 6-9 digits).
    3. Rejects concatenated codes (e.g., T123/75217/0052 -> 123752170052 [Too Long]).
    """
    if not roll_no or roll_no == "N/A": 
        return "N/A"
    
    roll_str = str(roll_no).strip()
    
    # STRIP EVERYTHING except digits
    cleaned = re.sub(r'\D', '', roll_str)
    
    # CRITICAL LENGTH CHECK
    # Roll numbers are typically 7 or 8 digits. 
    # We allow 6-9 to be safe, but reject 10+ (like concatenated school codes).
    if not (6 <= len(cleaned) <= 9):
        return "N/A"
        
    return cleaned

def clean_reg_no(reg_no):
    """
    Sanitizes Registration Number.
    Specifically removes School Code patterns (e.g., 75048/00006) commonly mistaken for Reg Nos.
    """
    if not reg_no or reg_no == "N/A": 
        return "N/A"
    
    reg_str = str(reg_no).strip()
    
    # BLOCK SCHOOL CODES (Format: 5 digits / 4-6 digits)
    # e.g., 75048/00006 or 75217/00045
    if re.match(r'^\d{5}\/\d{4,6}$', reg_str):
        return "N/A"
        
    return reg_str

# ==========================================
# 1. DOCUMENT ANALYSIS (The "Eyes" of DIVA)
# ==========================================
def analyze_document(ocr_text, level_hint=None):
    """
    Analyzes OCR text to extract structured JSON data.
    Uses 'level_hint' to strictly route between Class 10 and 12 logic.
    """
    if not ocr_text: return {"error": "OCR text empty"}

    # 1. GET THE CORRECT PROMPT (Using your new optimized templates)
    template_name, extraction_rules = get_template(ocr_text, level_hint=level_hint)
    print(f"[INFO] AI Service: Detected Template '{template_name}' (Hint: {level_hint})")

    # 2. CONSTRUCT THE SYSTEM PROMPT
    prompt = f"""
    You are an expert Academic Auditor for DIVA Systems.
    
    --- EXTRACTION RULES ---
    {extraction_rules}

    --- CRITICAL OUTPUT FORMAT ---
    Return ONLY valid JSON. Do not include markdown formatting (like ```json).
    Use "N/A" for missing fields. Do not invent data.

    {{
        "type": "{template_name}",
        "details": {{
            "name": "", 
            "reg_no": "", 
            "roll_no": "",
            "father": "", 
            "mother": "", 
            "guardian": "",
            "dob": "", 
            "sex": "", 
            "caste_religion": "", 
            "category": "",
            "nationality": "", 
            "place_of_birth": "", 
            "address": "",
            "school": "", 
            "school_code": "", 
            "admission_no": "",
            "exam_month_year": "", 
            "chances": "", 
            "date_of_result": "",
            "result_status": "", 
            "stream": "",
            "identification_marks": "", 
            "grand_total": "" 
        }},
        "subjects": [
            {{ "subject": "Subject Name", "marks": "85", "grade": "A" }}
        ]
    }}

    --- INPUT TEXT ---
    {ocr_text}
    """

    try:
        # 3. CALL SARVAM AI API
        payload = {
            "model": "sarvam-m",  
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1, # Low temp for strict data extraction
            "max_tokens": 1500
        }
        headers = { "Content-Type": "application/json", "api-subscription-key": SARVAM_API_KEY }
        
        print("[INFO] Sending request to Sarvam AI...")
        response = requests.post(SARVAM_URL, json=payload, headers=headers, timeout=60)
        
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            data = extract_json(content)
            
            # 4. POST-PROCESSING FIXES (The Safety Net)
            if "details" in data:
                 # Clean Roll Number (Reject slash patterns, length checks)
                 data['details']['roll_no'] = clean_roll_number(data['details'].get('roll_no', 'N/A'))
                 
                 # Clean Registration Number (Block School Codes)
                 data['details']['reg_no'] = clean_reg_no(data['details'].get('reg_no', 'N/A'))

                 # [WARNING] UI HACK: CBSE Primary ID is Roll Number
                 # If Reg No is "N/A" (common for CBSE), use Roll No so it shows in the UI.
                 if "CBSE" in template_name and data['details']['reg_no'] == "N/A":
                     data['details']['reg_no'] = data['details']['roll_no']

            if "subjects" in data:
                # Fix Grades (A Plus -> A+)
                for sub in data["subjects"]:
                    sub["grade"] = clean_grade(sub.get("grade", "N/A"))
                
                # Fix Internal Subjects (Force N/A marks)
                data["subjects"] = clean_internal_marks(data["subjects"], template_name)
                
                # [NEW] Fix Kerala Header Noise ("Part I", "Part II")
                data["subjects"] = clean_kerala_subjects(data["subjects"], template_name)

            return data
        
        print(f"[ERROR] AI API Failed: {response.status_code} - {response.text}")
        return {"error": f"AI API Error {response.status_code}"}

    except Exception as e:
        print(f"[ERROR] AI Service Exception: {e}")
        return {"error": str(e)}

def extract_json(text):
    """
    Robust JSON extractor that handles code blocks and raw text.
    """
    try:
        # Case A: JSON wrapped in markdown code blocks
        match = re.search(r'```json\s*(\{[\s\S]*\})\s*```', text)
        if match: return json.loads(match.group(1))
        
        # Case B: Raw JSON object
        match = re.search(r'(\{[\s\S]*\})', text)
        if match: return json.loads(match.group(1))
        
    except json.JSONDecodeError:
        print("[ERROR] JSON Decode Error: AI returned invalid JSON.")
    except Exception as e:
        print(f"[ERROR] JSON Parsing Exception: {e}")
        
    return {"error": "Could not parse JSON from AI response"}
    
