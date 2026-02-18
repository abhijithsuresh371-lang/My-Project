import re

def calculate_grading(extracted_data):
    """
    Calculates Grading details (Score & Percentage) based on strict user rules.
    Returns: { "score_display": "450 / 500", "percentage": "90.00%" }
    """
    try:
        cert_type = extracted_data.get('type', 'UNKNOWN')
        details = extracted_data.get('details', {})
        subjects = extracted_data.get('subjects', [])

        # ==========================================================
        # 1. CBSE (10th & 12th) - Max 500, Sum Subjects
        # ==========================================================
        if "CBSE" in cert_type:
            valid_marks = []
            
            for sub in subjects:
                # Extract number from marks string (e.g. "095" -> 95)
                raw_mark = str(sub.get('marks', '0'))
                clean_mark = re.sub(r'[^0-9]', '', raw_mark)
                
                if clean_mark:
                    mark = int(clean_mark)
                    # Ignore impossible marks (like year 2023 or code 041)
                    if mark <= 100: 
                        valid_marks.append(mark)
            
            # Sort marks High -> Low to get "Best of 5" if they have 6 subjects
            valid_marks.sort(reverse=True)
            
            if len(valid_marks) >= 5:
                # Take top 5
                obtained = sum(valid_marks[:5])
                maximum = 500
                percent = (obtained / maximum) * 100
                
                return {
                    "score_display": f"{obtained} / {maximum}",
                    "percentage": f"{percent:.2f}%"
                }
            
            elif len(valid_marks) > 0:
                # Fallback: Less than 5 subjects found
                obtained = sum(valid_marks)
                return {
                    "score_display": f"{obtained} / 500 (Incomplete)",
                    "percentage": "N/A"
                }

        # ==========================================================
        # 2. KERALA STATE 12TH - Max 1200, Extracted Total
        # ==========================================================
        # ==========================================================
        # 2. KERALA STATE 12TH - Max 1200, Extracted Total + Fallback
        # ==========================================================
        elif cert_type == "KERALA_HSE":
            maximum = 1200
            
            # 1. CALCULATE SUBJECT SUM (Robust Base)
            subject_sum = 0
            for sub in subjects:
                try:
                    m_str = str(sub.get('marks', '0')).split('/')[0]
                    m_val = float(re.sub(r'[^0-9.]', '', m_str))
                    # Sanity: Subject max ~200
                    if m_val > 0 and m_val <= 200: subject_sum += m_val
                except: continue

            # 2. EXTRACT GRAND TOTAL (May have OCR errors e.g. "127")
            extracted_total = 0
            grand_total_str = details.get('grand_total', "")
            if grand_total_str and grand_total_str != "N/A":
                try:
                    clean_str = str(grand_total_str).split('/')[0]
                    extracted_total = float(re.sub(r'[^0-9.]', '', clean_str))
                except: pass

            # 3. LOGIC: FIX "127" ERROR
            # If Extracted Total is suspiciously low (< Sum), trust the Sum.
            final_score = extracted_total
            if final_score < subject_sum:
                final_score = subject_sum
            
            if final_score == 0:
                 return {"score_display": "Not Found", "percentage": "N/A"}
            
            if final_score > maximum: final_score = maximum

            percent = (final_score / maximum) * 100
            return {
                "score_display": f"{int(final_score)} / {maximum}",
                "percentage": f"{percent:.2f}%"
            }

        # ==========================================================
        # 3. SSLC (10th State) - GRADES ONLY (Example)
        # ==========================================================
        elif cert_type == "KERALA_SSLC":
             # SSLC usually has no marks, so we return N/A for %
             return {"score_display": "Grades Only", "percentage": "N/A"}

    except Exception as e:
        print(f" Calculation Error: {e}")
        return {"score_display": "Error", "percentage": "Error"} # Fallback

    # ==========================================================
    # 4. DEFAULT RETURN (Safety Net)
    # ==========================================================
    return {"score_display": "N/A", "percentage": "N/A"}