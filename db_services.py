import json
import re
from db_config import get_db_connection

def extract_year(date_str):
    if not date_str: return None
    match = re.search(r'\b(19|20)\d{2}\b', str(date_str))
    return match.group(0) if match else None

def fetch_all_history():
    print("[DEBUG] Fetching History...") 
    conn = get_db_connection()
    if not conn: return []
    
    cursor = conn.cursor(dictionary=True)
    try:
        # [UPDATE] Added s.email and s.phone
        query = """
            SELECT 
                s.admno, s.name, s.email, s.phone, s.category, 
                DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') as created_at, 
                COALESCE(m10.result_status, m12.result_status, 'UNKNOWN') as status,
                COALESCE(m10.percentage, m12.percentage, 'N/A') as score
            FROM students s
            LEFT JOIN marks_10th m10 ON s.admno = m10.student_admno
            LEFT JOIN marks_12th m12 ON s.admno = m12.student_admno
            ORDER BY s.created_at DESC
        """
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"[DEBUG] Found {len(results)} records.")
        return results
    except Exception as e:
        print(f"[ERROR] History Fetch Failed: {e}")
        return []
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def save_certificate_data(data):
    print("[DEBUG] save_certificate_data() called...") 
    conn = get_db_connection()
    if not conn: return {"error": "Database connection failed"}
    cursor = conn.cursor()

    try:
        details = data.get('details', {})
        cert_type = data.get('type', 'UNKNOWN')
        
        # [UPDATE] Get Email and Phone from payload
        email = data.get('email', '')
        phone = data.get('phone', '')

        print(f"[DEBUG] Saving Candidate: {details.get('name')} | {email} | {phone}") 

        # 1. INSERT STUDENT (Added email & phone)
        student_sql = """
            INSERT INTO students (name, email, phone, dob, father_name, mother_name, guardian_name, 
                                  sex, caste_religion, category, identification_marks) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        student_vals = (
            details.get('name', ''),
            email, # Inserted
            phone, # Inserted
            details.get('dob', ''),
            details.get('father', ''),
            details.get('mother', ''),
            details.get('guardian', ''),
            details.get('sex', ''),
            details.get('caste_religion', ''),
            details.get('category', ''),
            details.get('identification_marks', '')
        )
        cursor.execute(student_sql, student_vals)
        student_admno = cursor.lastrowid
        print(f"[DEBUG] Student Inserted. ID: {student_admno}") 

        # 2. DETERMINE TABLE
        table_name = "marks_10th"
        if "12" in cert_type or "HSE" in cert_type or "INTER" in cert_type:
            table_name = "marks_12th"

        # 3. INSERT MARKS
        if table_name == "marks_10th":
            marks_sql = """
                INSERT INTO marks_10th (student_admno, roll_no, school_name, board_name, 
                                        passing_year, overall_score, percentage, 
                                        result_status, ai_raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            marks_vals = (
                student_admno, details.get('roll_no', ''), details.get('school', ''), "DETECTED_BOARD",
                extract_year(details.get('exam_month_year', '')), details.get('grand_total', ''),
                data.get('details', {}).get('grading', {}).get('percentage', ''),
                details.get('result_status', 'UNKNOWN'), json.dumps(data)
            )
        else:
            marks_sql = """
                INSERT INTO marks_12th (student_admno, roll_no, stream, school_name, board_name, 
                                        passing_year, overall_score, percentage, 
                                        result_status, ai_raw_data)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            marks_vals = (
                student_admno, details.get('roll_no', ''), details.get('stream', ''), details.get('school', ''),
                "DETECTED_BOARD", extract_year(details.get('exam_month_year', '')), details.get('grand_total', ''),
                data.get('details', {}).get('grading', {}).get('percentage', ''),
                details.get('result_status', 'UNKNOWN'), json.dumps(data)
            )

        cursor.execute(marks_sql, marks_vals)
        conn.commit()
        return {"status": "success", "admno": student_admno, "table": table_name}

    except Exception as e:
        conn.rollback()
        print(f"[CRITICAL ERROR] Save Failed: {e}")
        return {"error": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def clear_all_history():
    conn = get_db_connection()
    if not conn: return {"error": "Connection failed"}
    cursor = conn.cursor()
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE marks_10th;")
        cursor.execute("TRUNCATE TABLE marks_12th;")
        cursor.execute("TRUNCATE TABLE students;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_student_full_details(admno):
    """ Fetches full JSON AND contact info. """
    conn = get_db_connection()
    if not conn: return {"error": "Connection failed"}
    cursor = conn.cursor(dictionary=True)
    try:
        # [UPDATE] Fetch contact info too
        cursor.execute("SELECT email, phone FROM students WHERE admno = %s", (admno,))
        student_info = cursor.fetchone()

        cursor.execute("SELECT ai_raw_data FROM marks_10th WHERE student_admno = %s", (admno,))
        row_10 = cursor.fetchone()
        
        cursor.execute("SELECT ai_raw_data FROM marks_12th WHERE student_admno = %s", (admno,))
        row_12 = cursor.fetchone()
        
        data_10 = json.loads(row_10['ai_raw_data']) if row_10 and row_10['ai_raw_data'] else None
        data_12 = json.loads(row_12['ai_raw_data']) if row_12 and row_12['ai_raw_data'] else None
        
        return {
            "status": "success", 
            "contact": student_info, # New Contact Info
            "data_10": data_10, 
            "data_12": data_12
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_admin_stats():
    """ Fetches dashboard stats for the Admin Chatbot context. """
    conn = get_db_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Counts
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'VERIFIED' THEN 1 ELSE 0 END) as verified
            FROM verification_requests
        """)
        counts = cursor.fetchone()

        # 2. Recent Activity (Last 5)
        cursor.execute("""
            SELECT candidate_name, level, status, created_at 
            FROM verification_requests 
            ORDER BY created_at DESC LIMIT 5
        """)
        recent = cursor.fetchall()

        return {
            "counts": counts,
            "recent": recent
        }
    except Exception as e:
        print(f"Stats Error: {e}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def search_student_by_name(name_query):
    """ Searches for students by name (partial match) for Chatbot Context. """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(dictionary=True)
    try:
        # Search in verification_requests to get latest status
        query = """
            SELECT candidate_name, email, level, status, created_at, id 
            FROM verification_requests 
            WHERE candidate_name LIKE %s 
            ORDER BY created_at DESC LIMIT 3
        """
        cursor.execute(query, (f"%{name_query}%",))
        results = cursor.fetchall()
        
        # Enhance with specific details if VERIFIED
        enhanced_results = []
        for r in results:
            full_data = None
            details_str = "Status: " + r['status']
            
            if r['status'] == 'VERIFIED':
                # Try to fetch marks summary
                level = str(r['level'])
                table = "marks_12th" if "12" in level else "marks_10th"
                
                # Fetch full raw data
                mk_query = f"""
                    SELECT overall_score, percentage, ai_raw_data
                    FROM {table} m 
                    JOIN students s ON m.student_admno = s.admno 
                    WHERE s.email = %s 
                    ORDER BY m.id DESC LIMIT 1
                """
                cursor.execute(mk_query, (r['email'],))
                marks = cursor.fetchone()
                
                if marks:
                    details_str = f" | Score: {marks.get('overall_score', 'N/A')} ({marks.get('percentage', 'N/A')})"
                    if marks.get('ai_raw_data'):
                        try:
                            full_data = json.loads(marks['ai_raw_data'])
                            # Add subjects summary to details_str for immediate context
                            sub_summary = ", ".join([f"{s.get('subject')}:{s.get('marks')}" for s in full_data.get('subjects', [])[:5]])
                            details_str += f" | Subs: {sub_summary}..."
                        except:
                            pass
            
            enhanced_results.append({
                "name": r['candidate_name'],
                "level": r['level'],
                "status": r['status'],
                "date": f"{r['created_at']}",
                "summary": details_str,
                "full_data": full_data # Return full JSON for AI to parse if needed
            })
            
        return enhanced_results

    except Exception as e:
        print(f"Search Error: {e}")
        return []
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_history_logs(limit=10):
    """ Fetches a concise history log for the Chatbot. """
    conn = get_db_connection()
    if not conn: return []
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT
                s.name, s.email,
                COALESCE(m10.result_status, m12.result_status, 'PENDING') as status,
                COALESCE(m10.percentage, m12.percentage, 'N/A') as score,
                DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i') as date
            FROM students s
            LEFT JOIN marks_10th m10 ON s.admno = m10.student_admno
            LEFT JOIN marks_12th m12 ON s.admno = m12.student_admno
            ORDER BY s.created_at DESC
            LIMIT %s
        """
        cursor.execute(query, (limit,))
        return cursor.fetchall()
    except Exception as e:
        print(f"History Log Error: {e}")
        return []
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def search_student_by_admno(admno):
    """ Searches for a student by admission number for Chatbot Context. """
    conn = get_db_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch student info
        cursor.execute("SELECT * FROM students WHERE admno = %s", (admno,))
        student = cursor.fetchone()

        if not student:
            return None

        # Fetch marks data
        cursor.execute("SELECT ai_raw_data FROM marks_10th WHERE student_admno = %s", (admno,))
        row_10 = cursor.fetchone()

        cursor.execute("SELECT ai_raw_data FROM marks_12th WHERE student_admno = %s", (admno,))
        row_12 = cursor.fetchone()

        data_10 = json.loads(row_10['ai_raw_data']) if row_10 and row_10['ai_raw_data'] else None
        data_12 = json.loads(row_12['ai_raw_data']) if row_12 and row_12['ai_raw_data'] else None

        return {
            "student": student,
            "data_10": data_10,
            "data_12": data_12
        }
    except Exception as e:
        print(f"Search by Admno Error: {e}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def search_student_by_email(email):
    """ Searches for a student by email for Chatbot Context. """
    conn = get_db_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch student info
        cursor.execute("SELECT * FROM students WHERE email = %s", (email,))
        student = cursor.fetchone()

        if not student:
            return None

        admno = student['admno']

        # Fetch marks data
        cursor.execute("SELECT ai_raw_data FROM marks_10th WHERE student_admno = %s", (admno,))
        row_10 = cursor.fetchone()

        cursor.execute("SELECT ai_raw_data FROM marks_12th WHERE student_admno = %s", (admno,))
        row_12 = cursor.fetchone()

        data_10 = json.loads(row_10['ai_raw_data']) if row_10 and row_10['ai_raw_data'] else None
        data_12 = json.loads(row_12['ai_raw_data']) if row_12 and row_12['ai_raw_data'] else None

        return {
            "student": student,
            "data_10": data_10,
            "data_12": data_12
        }
    except Exception as e:
        print(f"Search by Email Error: {e}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def get_student_by_contact(email, phone):
    """ Fetches student basic details by Email OR Phone for identity verification. """
    conn = get_db_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    try:
        # Priority: Email > Phone
        query = "SELECT name, father_name FROM students WHERE email = %s OR phone = %s LIMIT 1"
        cursor.execute(query, (email, phone))
        return cursor.fetchone()
    except Exception as e:
        print(f"[ERROR] Student Lookup Failed: {e}")
        return None
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
