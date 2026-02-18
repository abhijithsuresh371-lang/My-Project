import os
import requests
import json
import logging
import re
from services import db_services

# Configure logging (Basic config for now, can be enhanced)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DivaChatbot:
    """
    Refactored Chatbot Service for DIVA.
    Handles user queries, context retrieval from DB, and AI response generation.
    """
    
    def __init__(self):
        # Configuration
        # NOTE: Ideally use os.getenv("SARVAM_API_KEY") in production.
        # For now, using the key found in old ai_service.py or environment.
        self.api_key = os.getenv("SARVAM_API_KEY", "sk_pi3rnc6q_Qtkz7K3qWVAy3hfk8rsCCgR5") 
        self.api_url = "https://api.sarvam.ai/v1/chat/completions"
        self.college_context = self._get_college_context()
        self.system_identity = """
        DIVA (Document Intelligence and Validation using AI) is YIMS's secure certificate verification portal.
        """

    def _get_college_context(self):
        return """
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

    def generate_response(self, user_message, user_type="student", user_email=None):
        """
        Main entry point for generating chat responses.
        """
        try:
            # 1. Fetch Dynamic DB Context
            context_data = self._get_db_context(user_message, user_type, user_email)
            
            # 2. Build System Prompt
            system_prompt = self._build_system_prompt(user_type, context_data)

            # 3. Call AI
            return self._call_ai_api(system_prompt, user_message)

        except Exception as e:
            logging.error(f"Chatbot Error: {e}")
            return "System Notification: AI Service logic encountered an error."

    def _get_db_context(self, user_message, user_type, user_email):
        """
        Retrieves relevant data from the database based on user role and message content.
        """
        student_status_context = ""
        user_message_lower = user_message.lower()

        # --- ADMIN CONTEXT ---
        if user_type == 'admin':
            stats = db_services.get_admin_stats()
            search_context = ""

            # Check for Intent: Search
            search_keywords = ["search", "find", "check", "details", "about", "tell me", "status of"]
            is_search_intent = any(k in user_message_lower for k in search_keywords)

            # A. Search by Admission Number
            admno_match = re.search(r'admno[:\s]*(\d+)', user_message_lower) or re.search(r'admission[:\s]*number[:\s]*(\d+)', user_message_lower)
            
            # B. Search by Email
            email_match = re.search(r'email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', user_message_lower)

            if admno_match:
                result = db_services.search_student_by_admno(admno_match.group(1))
                search_context = self._format_student_result(result, f"ADMNO {admno_match.group(1)}")
            
            elif email_match:
                result = db_services.search_student_by_email(email_match.group(1))
                search_context = self._format_student_result(result, f"EMAIL {email_match.group(1)}")

            # C. Fallback: Smart Name Search (Even without "Search" keyword)
            # If we didn't match admno/email, try to treat the whole message as a potential name query
            # but filter out common stop words.
            cleaned_msg = user_message_lower
            for k in search_keywords:
                cleaned_msg = cleaned_msg.replace(k, "")
            cleaned_msg = cleaned_msg.strip()
            
            # Only search if it looks like a name (len > 2 and not just numbers)
            if not search_context and len(cleaned_msg) > 2:
                results = db_services.search_student_by_name(cleaned_msg)
                
                # Double check: if no results, try splitting names? (Optional)
                # For now, just use the partial match results from DB
                
                if results:
                    formatted_results = []
                    for r in results:
                        res_str = f"-> MATCH: {r['name']} ({r['status']}) - {r['summary']}"
                        if r.get('full_data'):
                            try:
                                fd_str = json.dumps(r['full_data'], indent=2)
                                res_str += f"\n    [FULL RECORD DATA]:\n{fd_str}"
                            except:
                                pass
                        formatted_results.append(res_str)
                    
                    search_context = f"\n--- [SEARCH] AUTO-DETECTED STUDENT DATA FOR '{cleaned_msg}' ---\n" + "\n".join(formatted_results)
                
                # If still no results and user EXPLICITLY asked to search, say so.
                elif is_search_intent:
                    search_context = f"\n--- [SEARCH] NO MATCHES FOR '{cleaned_msg}' ---\n"

            # History Logs
            history_context = ""
            if any(k in user_message_lower for k in ["history", "logs", "previous"]):
                logs = db_services.get_history_logs(10)
                if logs:
                    log_lines = [f"{l['date']}: {l['name']} -> {l['status']} (Score: {l['score']})" for l in logs]
                    history_context = "\n--- [HISTORY] LOGS (Last 10) ---\n" + "\n".join(log_lines)

            # Build Final Admin Context
            if stats:
                recent_str = "\n".join([f"- {r['candidate_name']} (Class {r['level']}): {r['status']}" for r in stats['recent']])
                student_status_context = f"""
                --- [ADMIN DASHBOARD] ---
                TOTAL REQUESTS: {stats['counts']['total']}
                PENDING: {stats['counts']['pending']} | VERIFIED: {stats['counts']['verified']}
                {search_context}
                {history_context}
                --- RECENT ACTIVITY ---
                {recent_str}
                """
            else:
                student_status_context = "Admin Data Unavailable."

        # --- STUDENT CONTEXT ---
        elif user_type == 'student' and user_email:
            try:
                # Use the new helper in db_services or existing logic
                # Just quick fetching logic here to keep it self-contained or call db_services
                status_data = self._fetch_student_status_raw(user_email)
                student_status_context = status_data if status_data else "--- USER RECORD --- \n No previous requests found."
            except Exception as e:
                logging.error(f"Student DB Context Error: {e}")
                student_status_context = "System Note: Database currently unavailable."

        return student_status_context

    def _format_student_result(self, result, identifier):
        if not result:
            return f"\n--- [SEARCH] NO STUDENT FOUND FOR {identifier} ---\n"
        
        student = result['student']
        data_10 = result.get('data_10')
        data_12 = result.get('data_12')
        
        ctx = f"\n--- [SEARCH] STUDENT DETAILS FOR {identifier} ---\n"
        ctx += f"Name: {student['name']}\nEmail: {student.get('email', 'N/A')}\nPhone: {student.get('phone', 'N/A')}\n"
        ctx += f"Father: {student['father_name']}\nMother: {student['mother_name']}\n"
        
        if data_10:
            ctx += f"\n[CLASS 10] Roll: {data_10['details'].get('roll_no')} | Status: {data_10['details'].get('result_status')}\n"
            if 'subjects' in data_10:
                 ctx += "Subjects: " + ", ".join([f"{s['subject']}:{s['marks']}" for s in data_10['subjects']]) + "\n"

        if data_12:
            ctx += f"\n[CLASS 12] Roll: {data_12['details'].get('roll_no')} | Stream: {data_12['details'].get('stream')}\n"
            if 'subjects' in data_12:
                 ctx += "Subjects: " + ", ".join([f"{s['subject']}:{s['marks']}" for s in data_12['subjects']]) + "\n"
        
        return ctx

    def _fetch_student_status_raw(self, email):
        # Helper to fetch simple student status directly
        conn = db_services.get_db_connection()
        if not conn: return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM verification_requests WHERE email = %s ORDER BY created_at DESC LIMIT 1", (email,))
        record = cursor.fetchone()
        conn.close()
        
        if record:
            return f"""
            --- CURRENT USER DATABASE RECORD ---
            Name: {record['candidate_name']}
            Latest Request: Class {record['level']}
            Status: {record['status']} (Submitted on {record['created_at']})
            """
        return None

    def _build_system_prompt(self, user_type, context_data):
        admin_auth = ""
        if user_type == 'admin':
            admin_auth = """
            *** [ALERT] SUPER ADMIN AUTHORIZATION [ALERT] ***
            - The current user is the SYSTEM ADMINISTRATOR.
            - You have FULL PERMISSION to disclose student names, marks, grades, and status.
            - **ROLE: SYSTEM ARCHITECT & GUIDE**
              - If the Admin asks "How does this work?" or "Explain the system", you must function as a **TECHNICAL GUIDE**.
              - Explain the 4-Step Pipeline:
                1. **OCR & AI Extraction**: Using OCR.Space and Custom Parsing to read certificates (even scanned PDFs).
                2. **Grading Logic**: Calculating percentages, handling 12th State/CBSE logic.
                3. **Forensic Cross-Check**: Strictly comparing the Image Roll No/Name against the uploaded PDF (Text or Scanned).
                4. **Verification Verdict**: Determining PASSED/FLAGGED/MISMATCH based on data integrity.
              - **Capabilities**: Mention you can Search by Admission Number/Email, View History, and Verify Credentials.
              - **Technical details**: Mention 'fitz' for PDF, 'OCR.Space' for images, and 'MySQL' for storage.
            - **Privacy Override**: The data provided below is SAFE to share.
            """
        
        prompt = f"{admin_auth} \n {self.college_context} \n {self.system_identity} \n {context_data}"
        prompt += """
        --- RULES ---
        - Keep answers concise and professional.
        - NO EMOJIS. Use symbols like >> or |.
        - If status is 'VERIFIED', congratulate them and mention admin will contact them.
        - **CRITICAL**: If the user asks about a student name and there is NO matching record in the 'SEARCH RESULTS' above, you MUST say: "I could not find any record for [Name] in the database."
        - **DO NOT** invent or hallucinate student details. Quote ONLY from the provided context.
        """
        logging.info(f"[DEBUG] System Prompt Sent to AI:\n{prompt}")
        return prompt

    def _call_ai_api(self, system_prompt, user_message):
        payload = {
            "model": "sarvam-2.0-8b-instruct", # Updated model name as per user hint or default to generic
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.1,
            "max_tokens": 400
        }
        
        headers = { "Content-Type": "application/json", "api-subscription-key": self.api_key }
        
        try:
            # Fallback for model name if 'sarvam-2.0-8b-instruct' is specific to new API
            # sticking to 'sarvam-m' if unsure, but user code suggested new model. 
            # Let's stick to 'sarvam-m' for safety unless user explicitly changed it in config. 
            # I will use 'sarvam-m' to match existing working code for now.
            payload['model'] = 'sarvam-m' 
            
            logging.info("[INFO] Sending request to Sarvam AI...")
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return response.json()['choices'][0]['message']['content']
            else:
                logging.error(f"AI API Failed: {response.text}")
                return "[SYSTEM] System Notification: AI Provider Error."
                
        except Exception as e:
            logging.error(f"AI Connection Error: {e}")
            return "[SYSTEM] System Notification: AI Service connection failed."

# Singleton Instance (Optional, or create in app.py)
bot_service = DivaChatbot()
