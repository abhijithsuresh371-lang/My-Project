
import sys
import os
import json

# Ensure we can import backend services
sys.path.append(os.getcwd())

from services import db_services

def verify_latest_student():
    print("--- 🔍 VERIFYING LATEST STUDENT DATA ---")
    
    # 1. Get connection and find latest student
    conn = db_services.get_db_connection()
    if not conn:
        print("❌ DB Connection Failed")
        return

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM students ORDER BY created_at DESC LIMIT 1")
    student = cursor.fetchone()
    
    if not student:
        print("❌ No students found in database.")
        return

    print(f"✅ Found Student: {student['name']} (AdmNo: {student['admno']})")
    print(f"   Name: {student['name']}")
    print(f"   Father: {student['father_name']}")
    print(f"   Email: {student['email']}")
    
    # 2. Check Marks Table (10th)
    cursor.execute("SELECT * FROM marks_10th WHERE student_admno = %s", (student['admno'],))
    marks_10 = cursor.fetchone()
    
    if marks_10:
        print(f"\n✅ Found Class 10 Data:")
        print(f"   Roll No: {marks_10['roll_no']}")
        print(f"   Result: {marks_10['result_status']}")
        
        # 3. Check JSON Raw Data
        if marks_10['ai_raw_data']:
            print(f"   ✅ JSON Raw Data is PRESENT.")
            try:
                data = json.loads(marks_10['ai_raw_data'])
                print(f"   👉 Parsed JSON 'Father': {data.get('details', {}).get('father_name', 'Not found directly in details')}")
                
                print("   👉 JSON Subjects:")
                for sub in data.get('subjects', [])[:3]: # Show first 3
                    print(f"      - {sub['subject']}: {sub['marks']}")
            except:
                print("   ❌ Start JSON Parsing Failed")
    else:
        print("\n⚠️ No Class 10 Data found.")

    # 4. Check Marks Table (12th)
    cursor.execute("SELECT * FROM marks_12th WHERE student_admno = %s", (student['admno'],))
    marks_12 = cursor.fetchone()
    
    if marks_12:
        print(f"\n✅ Found Class 12 Data:")
        print(f"   Roll No: {marks_12['roll_no']}")
        print(f"   Result: {marks_12['result_status']}")
        
        if marks_12['ai_raw_data']:
            print(f"   ✅ JSON Raw Data is PRESENT.")
            try:
                data = json.loads(marks_12['ai_raw_data'])
                print(f"   👉 Parsed JSON 'Father': {data.get('details', {}).get('father_name', 'Not found directly in details')}")
                
                print("   👉 JSON Subjects:")
                for sub in data.get('subjects', [])[:3]:
                    print(f"      - {sub['subject']}: {sub['marks']}")
            except:
                print("   ❌ JSON Parsing Failed")
    else:
        print("\n⚠️ No Class 12 Data found (This is normal if user only inspected 10th).")

    conn.close()

if __name__ == "__main__":
    verify_latest_student()
