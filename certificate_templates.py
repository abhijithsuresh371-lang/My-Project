"""
DIVA Master Templates - Unified Academic Auditor
Modules: Kerala State (10/12) & CBSE (10/12)
"""

def get_template(ocr_text, level_hint=None):
    """
    Unified Router: Detects Board and Class to return the correct prompt.
    """
    text = ocr_text.upper()
    
    # --- [DETECTION] SIGNATURES ---
    # Fix: Avoid "KERALA" in address triggering State Board (e.g. CBSE schools in Kerala)
    is_kerala = "PAREEKSHA BHAVAN" in text or "GOVERNMENT OF KERALA" in text or "BOARD OF PUBLIC EXAMINATIONS" in text
    is_cbse = "CENTRAL BOARD" in text or "CBSE" in text or "ALL INDIA" in text
    
    # Keywords for Class levels
    is_12th = any(x in text for x in ["SENIOR SCHOOL", "HIGHER SECONDARY", "AISSCE", "HSE", "PLUS TWO", "CLASS XII"])
    is_10th = any(x in text for x in ["SECONDARY SCHOOL", "SSLC", "AISSE", "CLASS X"])

    # --- [ROUTING] LOGIC ---
    if is_cbse:
        if str(level_hint) == '12' or is_12th:
            return "CBSE_12", get_cbse_12_prompt()
        elif str(level_hint) == '10' or is_10th:
            return "CBSE_10", get_cbse_10_prompt()
            
    elif is_kerala:
        if str(level_hint) == '12' or is_12th:
            return "KERALA_HSE", get_kerala_hse_prompt()
        elif str(level_hint) == '10' or is_10th:
            return "KERALA_SSLC", get_kerala_sslc_prompt()

    # Default fallback if detection fails but hint is provided
    if str(level_hint) == '12': return "CBSE_12", get_cbse_12_prompt()
    if str(level_hint) == '10': return "CBSE_10", get_cbse_10_prompt()

    return "DETECTION_FAILED", "Could not identify the board or class level."

# ======================================================
# [MODULE] 1: KERALA HSE (12th State)
# ======================================================
def get_kerala_hse_prompt():
    return """
    ROLE: Kerala State 12th Grade (HSE) Auditor.
    
    *** [MATH] MATH AUDIT & TOTALS ***
    - **STRUCTURE MAPPING (CRITICAL)**: The table has 4 main vertical sections:
      1. **Subject Name** (Far Left)
      2. **First Year** columns (IGNORE THESE NUMBERS)
      3. **Second Year** columns (IGNORE THESE NUMBERS)
      4. **GRAND TOTAL** columns (TARGET) -> [CE | PE | TE | Total]
    
    - **ACTION**: 
      - Reads rows from Left to Right.
      - **KSIP** the first two clusters of numbers (First Year & Second Year).
      - **FOCUS** only on the cluster near the **GRADE**.

    - **STRICT ROW ALIGNMENT**: 
      - **Subject Match**: For each subject, read *only* the single horizontal line containing that subject's name.
      - **Sequence**: English is Row 1. Second Language is Row 2. Science subjects follow.
      - **CRITICAL**: Do NOT duplicate values from the row above. Each row is unique.

    - **MARK SELECTION (PRIMARY: LEFT-OF-GRADE)**:
      - **Positional Rule**: The "Total" column is located **IMMEDIATELY TO THE LEFT** of the Grade column.
      - **Visual**: [ ... | TE | Total | Grade ]
      - **Action**: Locate the Grade (e.g., "A+"). The number *directly* to its left is the Total.
      - *Example*: If row is "... 20 75 ... 40 153 193 A+", the number left of A+ is 193. (153 is TE - IGNORE).

    - **MARK SELECTION (SECONDARY: LARGEST NUMBER)**:
      - The Total is also typically the **LARGEST** number in the row.
      - Use this to verify the "Left of Grade" selection.
      - *Example*: If candidates are 153 and 193, pick 193.

    
    - **STRICT IGNORE**: 
      - NEVER extract 'CE' (Continuous), 'PE' (Practical), or 'TE' (Terminal) as the main mark.

    - **VERIFICATION**: 
      - The correct "Total" is usually adjacent to the "Grade" column.
      - Check "Total in Words" if available.
    - **GRAND TOTAL**: Locate the "Grand Total" at the bottom (written in WORDS).

    *** [GRADES] GRADE DUAL-CHECK (STRICT ROW ALIGNMENT) ***
    - **CRITICAL**: Grades must strictly correspond to the Subject Row.
    - **NO DUPLICATION**: Do NOT copy the Grade from the row above. 
      - *Example*: If Row 1 is 'B' and Row 2 is 'A', output 'A' for Row 2.
    - **Column Logic**: Extract 'Letter Grade' (Col 1) and 'Grade in Words' (Col 2).
    - **Normalization**:
      - If OCR reads "A Only", output "A". 
      - If OCR reads "A Plus" or "A+", output "A+".
      - Use "Grade in Words" (e.g., "B plus") to fix the letter grade (e.g., "B" -> "B+").

    *** [IDENTITY] IDENTITY & EXAM ***
    - **Register Number**: This is the primary ID. Labelled "Reg. No".
    - Name, Father's Name, Mother's Name.
    - Result: Pass/Fail. Total Marks Obtained (Max usually 1200).
    """

# ======================================================
# [MODULE] 2: KERALA SSLC (10th State)
# ======================================================
def get_kerala_sslc_prompt():
    return """
    ROLE: Kerala State 10th Grade (SSLC) Auditor.
    
    *** [CRITICAL] IDENTITY LOCK ***
    - **Register Number**: Look for "Register No". It is the primary ID.
    - **Certificate Type**: Ensure this is "SSLC" / "Secondary School Leaving Certificate".
    
    *** [DETAILS] 18-FIELD IDENTITY BLOCK ***
    - Extract: Name, Reg No, Admission No, DOB (DD/MM/YYYY), Sex, Religion/Caste, 
      Category, Nationality, Place of Birth, Father's Name, Mother's Name, 
      Guardian, Home Address, ID Marks, School, Month/Year, Chances, Result Date.
    - **Correction**: If Father's Name appears under School Name, look for the specific label "Name of Father".

    *** [ACADEMIC] ACADEMIC RECORD (GRADES ONLY) ***
    - SSLC usually has NO MARKS, only GRADES.
    - Extract Subject and Grade. Set 'marks' to "N/A".
    - **Normalization**: Extract the LETTER GRADE (A+, A, B+). NOT the words. 
      - If "A Plus" is present, output "A+".
      - If "A Only" is present, output "A".
    - **Noise**: Ignore "A+" printed in the subject column. Look at the designated distinct Grade column.
    
    *** [RESULT] RESULT ***
    - Status: "Eligible for Higher Studies" = PASS.
    """

# ======================================================
# [MODULE] 3: CBSE CLASS 12
# ======================================================
def get_cbse_12_prompt():
    return """
    ROLE: CBSE 12th Grade Auditor.
    
    *** [CRITICAL] CRITICAL IDENTITY RULE (ROLL NO) ***
    - **TARGET**: strict 7 or 8-digit Integer (e.g., 26645321).
    - **FORBIDDEN PATTERN**: 
      1. Numbers with slashes '/' (e.g., 75217/00045 -> School Code). IGNORE.
      2. Numbers starting with "SR" or "Reg" (e.g., SR555...).
    - **LOCATION**: It is usually located **immediately below** the Candidate's Name.
    - **LABEL**: Look for "Roll No." or "Roll Number".
    - **Rule**: Return ONLY the digits. No prefixes.
    
    *** [CRITICAL] REGISTRATION NUMBER RULES ***
    - **FORBIDDEN PATTERN**: Do NOT extract School/Center Codes (e.g., "75217/00045") as Register Number.
    - **Format**: Real CBSE Reg Nos are typically long alphanumeric strings (e.g., "A/1/22/75217/...").
    - **Rule**: If the only candidate is "75217/00045", set "reg_no": "N/A".
    
    *** [IDENTITY] PERSONAL DETAILS (REQUIRED FIELDS) ***
    - **ROLL NUMBER**: Look for "Roll No". It is distinct from "Registration No". Use Roll No as primary.
    - **REQUIRED**: Name of Candidate, Roll Number, Mother's Name, Father's Name/Guardian's Name, Date of Birth, School Name.
    - **RESULT INFO**: Result (Pass/Fail), Date of Result.
    - **DO NOT EXTRACT**: Exam Month/Year, Examination Month, or any exam date information.
    - **Father's Name**: 
      - Look clearly for "Father's / Guardian's Name".
      - **CRITICAL**: Extract ONLY the actual name (e.g., "UNNI K").
      - **IGNORE NOISE**: Do NOT extract "Fate", "Father's Name", "Guardian's Name".
      - Ensure the output is a valid person's name.

    *** [ACADEMIC] ACADEMIC TABLE (REQUIRED FORMAT: Subject Name | Marks | Grade) ***
    - **Columns**: Subject | Theory | Practical | TOTAL | Total in Words | Grade.
    - **Marks Extraction**: Extract ONLY the 'TOTAL' column for marks.
      - If 'TOTAL' is ambiguous, use 'TOTAL IN WORDS' to verify (e.g., "085" vs "Eighty Five").

    - **INTERNAL SUBJECTS (Work Exp, General Studies, HPE, Health & Physical Education)**:
      - These subjects (Codes usually 500+) have NO MARKS.
      - **RULE**: For these specific subjects, set "marks": "N/A" and extract ONLY the Grade (A1, B1, etc.).
      - Ignore any marks if present in these rows, they are often misread.

    *** [RESULT] RESULT ***
    - Result: Pass/Fail. Date of Result.
    """

# ======================================================
# [MODULE] 4: CBSE CLASS 10
# ======================================================
def get_cbse_10_prompt():
    return """
    ROLE: CBSE 10th Grade Auditor.
    
    *** [CRITICAL] CRITICAL IDENTITY RULE (ROLL NO) ***
    - **PRIMARY TARGET**: Look for the field explicitly labeled **"Roll No."** or **"Roll Number"**.
    - **LOCATION**: It is usually located **immediately below** the Candidate's Name.
    - **Visual Check**: [Candidate Name] -> [Roll No. (8 digits)]
    
    *** [CRITICAL] REGISTRATION NUMBER RULES ***
    - **FORBIDDEN PATTERN**: Do NOT extract School/Center Codes (e.g., "75048/00006") as Register Number.
    - **Format**: Real CBSE Reg Nos are typically long alphanumeric strings (e.g. "P/1/21/75048/0006").
    - **Rule**: If the only candidate is "75048/00006", set "reg_no": "N/A".
    - **Conflict**: Never replace Roll No with Reg No.
    - **REQUIRED**: Name of Candidate, Roll Number, Mother's Name, Father's Name/Guardian's Name, Date of Birth, School Name.
    - **RESULT INFO**: Result (Pass/Fail), Date of Result.
    - **DO NOT EXTRACT**: Exam Month/Year, Examination Month, or any exam date information.
    - **Father's Name**: 
      - Look clearly for "Father's / Guardian's Name".
      - **CRITICAL**: Extract ONLY the actual name (e.g., "MOHANDAS K P").
      - **IGNORE NOISE**: Do NOT extract "Get Pare", "Guardian's Name", or lines containing only "Name".
      - Ensure the output is a valid person's name.

    *** [ACADEMIC] ACADEMIC TABLE Parsing (COLUMNAR BLOCKS) ***
    - **OCR BEHAVIOR**: The OCR often reads columns vertically. Not row-by-row.
    - **STRUCTURE**: You will see blocks of data in this order:
      1. **Codes Block**: (e.g. 184, 012, 041, 086...) -> **IGNORE THESE**.
      2. **Subjects Block**: (e.g. ENGLISH, MALAYALAM, SCIENCE...)
      3. **Theory Marks Block**
      4. **IA/Internal Marks Block**
      5. **TOTAL MARKS Block** (Target)
      6. **Total in Words Block** (Verification)
      7. **Grade Block**
    
    - **MATCHING STRATEGY (STRICT SEQUENTIAL MAPPING)**:
      - **CRITICAL**: The OCR lists are **PERFECTLY ORDERED**.
      - **Result**: [S1, S2, S3, S4, S5] maps EXACTLY to [T1, T2, T3, T4, T5].
      - **Subject 1** (Top of List) -> **Total 1** (Top of Total Block).
      - **Subject 5** (Bottom of List) -> **Total 5** (Bottom of Total Block).
      - **Example**: 
        - If Subjects are: English, Hindi, Math, Science, Social.
        - And Totals are: 051, 079, 039, 047, 066.
        - **THEN**: English=051, Hindi=079, ... Social=066.
      - **ANTI-ROTATION RULE**: Never assign the last mark to the first subject.
      - **Verification**: S1 (English) usually has Code 184. T1 (e.g. 051) matches Words1 ("Fifty One").
    
    - **CRITICAL ANTI-HALLUCINATION**:
      - **Do NOT** pick numbers from the "Codes" block (e.g., 086) just because they are near the Subject name.
      - **Do NOT** pick Theory or Internal marks. Look for the **Total** block (usually larger numbers).
    
    - **VERIFICATION (THE "TOTAL IN WORDS" SUPREMACY)**:
      - **CRITICAL**: The "Total in Words" column (e.g., "SIXTY SIX") is the **ULTIMATE TRUTH**.
      - **Tie-Breaker**: If "Theory" is 086 and "Total" is 066, and Words say "SIXTY SIX" -> The Mark is **66**.
      - **Extraction Strategy**:
        - If the "Total" digit block is messy or misaligned, **READ THE WORDS** directly.
        - valid pairs: ("SIXTY SIX" -> 66), ("EIGHTY THREE" -> 83).
        - **Override Rule**: If the Digit and Word mismatch, TRUST THE WORD.
    
    - **Grade Repair**:
      - Match Grade by index too. (1st Subject -> 1st Grade).
    
    *** [RESULT] RESULT ***
    - Result: Pass/Fail. Date of Result.
    """