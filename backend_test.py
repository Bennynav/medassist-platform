import requests
import json
import time
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

API_URL = f"{BACKEND_URL}/api"
print(f"Testing backend API at: {API_URL}")

# Test data
test_patient = {
    "email": f"patient_{int(time.time())}@example.com",
    "password": "testpassword123",
    "full_name": "Test Patient",
    "role": "patient",
    "phone": "1234567890"
}

test_doctor = {
    "email": f"doctor_{int(time.time())}@example.com",
    "password": "testpassword123",
    "full_name": "Test Doctor",
    "role": "doctor",
    "phone": "0987654321",
    "specialization": "Cardiology",
    "license_number": "DOC12345"
}

test_pharmacy = {
    "email": f"pharmacy_{int(time.time())}@example.com",
    "password": "testpassword123",
    "full_name": "Test Pharmacy",
    "role": "pharmacy",
    "phone": "5555555555",
    "license_number": "PHARM12345"
}

# Test results tracking
test_results = {
    "auth_system": {"success": False, "details": []},
    "chat_system": {"success": False, "details": []},
    "prescription_system": {"success": False, "details": []},
    "database_operations": {"success": False, "details": []}
}

# Store tokens and IDs
tokens = {}
user_ids = {}
chat_id = None
prescription_id = None

def print_separator():
    print("\n" + "="*80 + "\n")

def run_test(test_name, test_func):
    print_separator()
    print(f"RUNNING TEST: {test_name}")
    try:
        result = test_func()
        if result:
            print(f"✅ TEST PASSED: {test_name}")
            return True
        else:
            print(f"❌ TEST FAILED: {test_name}")
            return False
    except Exception as e:
        print(f"❌ TEST ERROR: {test_name}")
        print(f"Error details: {str(e)}")
        return False

# 1. Authentication System Tests
def test_user_registration():
    success = True
    details = []
    
    # Register patient
    response = requests.post(f"{API_URL}/auth/register", json=test_patient)
    if response.status_code == 200:
        data = response.json()
        tokens["patient"] = data["access_token"]
        user_ids["patient"] = data["user"]["id"]
        details.append("Patient registration successful")
    else:
        success = False
        details.append(f"Patient registration failed: {response.status_code} - {response.text}")
    
    # Register doctor
    response = requests.post(f"{API_URL}/auth/register", json=test_doctor)
    if response.status_code == 200:
        data = response.json()
        tokens["doctor"] = data["access_token"]
        user_ids["doctor"] = data["user"]["id"]
        details.append("Doctor registration successful")
    else:
        success = False
        details.append(f"Doctor registration failed: {response.status_code} - {response.text}")
    
    # Register pharmacy
    response = requests.post(f"{API_URL}/auth/register", json=test_pharmacy)
    if response.status_code == 200:
        data = response.json()
        tokens["pharmacy"] = data["access_token"]
        user_ids["pharmacy"] = data["user"]["id"]
        details.append("Pharmacy registration successful")
    else:
        success = False
        details.append(f"Pharmacy registration failed: {response.status_code} - {response.text}")
    
    test_results["auth_system"]["details"].extend(details)
    return success

def test_user_login():
    success = True
    details = []
    
    # Test patient login
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": test_patient["email"],
        "password": test_patient["password"]
    })
    if response.status_code == 200:
        data = response.json()
        if data["user"]["role"] == "patient":
            details.append("Patient login successful")
        else:
            success = False
            details.append(f"Patient login returned wrong role: {data['user']['role']}")
    else:
        success = False
        details.append(f"Patient login failed: {response.status_code} - {response.text}")
    
    # Test doctor login
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": test_doctor["email"],
        "password": test_doctor["password"]
    })
    if response.status_code == 200:
        data = response.json()
        if data["user"]["role"] == "doctor":
            details.append("Doctor login successful")
        else:
            success = False
            details.append(f"Doctor login returned wrong role: {data['user']['role']}")
    else:
        success = False
        details.append(f"Doctor login failed: {response.status_code} - {response.text}")
    
    # Test pharmacy login
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": test_pharmacy["email"],
        "password": test_pharmacy["password"]
    })
    if response.status_code == 200:
        data = response.json()
        if data["user"]["role"] == "pharmacy":
            details.append("Pharmacy login successful")
        else:
            success = False
            details.append(f"Pharmacy login returned wrong role: {data['user']['role']}")
    else:
        success = False
        details.append(f"Pharmacy login failed: {response.status_code} - {response.text}")
    
    test_results["auth_system"]["details"].extend(details)
    return success

def test_token_validation():
    success = True
    details = []
    
    # Test patient token
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.get(f"{API_URL}/users/me", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data["role"] == "patient":
            details.append("Patient token validation successful")
        else:
            success = False
            details.append(f"Patient token returned wrong role: {data['role']}")
    else:
        success = False
        details.append(f"Patient token validation failed: {response.status_code} - {response.text}")
    
    # Test doctor token
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    response = requests.get(f"{API_URL}/users/me", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data["role"] == "doctor":
            details.append("Doctor token validation successful")
        else:
            success = False
            details.append(f"Doctor token returned wrong role: {data['role']}")
    else:
        success = False
        details.append(f"Doctor token validation failed: {response.status_code} - {response.text}")
    
    # Test pharmacy token
    headers = {"Authorization": f"Bearer {tokens['pharmacy']}"}
    response = requests.get(f"{API_URL}/users/me", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data["role"] == "pharmacy":
            details.append("Pharmacy token validation successful")
        else:
            success = False
            details.append(f"Pharmacy token returned wrong role: {data['role']}")
    else:
        success = False
        details.append(f"Pharmacy token validation failed: {response.status_code} - {response.text}")
    
    test_results["auth_system"]["details"].extend(details)
    return success

def test_role_based_access():
    success = True
    details = []
    
    # Test patient trying to create prescription (should fail)
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.post(
        f"{API_URL}/prescriptions",
        params={
            "patient_id": user_ids["patient"],
            "diagnosis": "Test diagnosis",
            "instructions": "Test instructions"
        },
        json=[{"name": "Test Med", "dosage": "10mg", "frequency": "daily"}],
        headers=headers
    )
    if response.status_code in [401, 403]:
        details.append("Role-based access control working: Patient cannot create prescriptions")
    else:
        success = False
        details.append(f"Role-based access control failed: Patient could create prescription: {response.status_code}")
    
    # Test pharmacy trying to create chat (should fail)
    headers = {"Authorization": f"Bearer {tokens['pharmacy']}"}
    response = requests.post(
        f"{API_URL}/chats",
        params={"doctor_id": user_ids["doctor"]},
        headers=headers
    )
    if response.status_code in [401, 403]:
        details.append("Role-based access control working: Pharmacy cannot create chats")
    else:
        success = False
        details.append(f"Role-based access control failed: Pharmacy could create chat: {response.status_code}")
    
    test_results["auth_system"]["details"].extend(details)
    return success

# 2. Chat System Tests
def test_chat_creation():
    global chat_id
    success = True
    details = []
    
    # Create chat as patient
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.post(
        f"{API_URL}/chats",
        params={"doctor_id": user_ids["doctor"]},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        chat_id = data["id"]
        if data["patient_id"] == user_ids["patient"] and data["doctor_id"] == user_ids["doctor"]:
            details.append("Chat creation successful")
        else:
            success = False
            details.append(f"Chat creation returned wrong user IDs: {data}")
    else:
        success = False
        details.append(f"Chat creation failed: {response.status_code} - {response.text}")
    
    test_results["chat_system"]["details"].extend(details)
    return success

def test_message_sending():
    success = True
    details = []
    
    if not chat_id:
        success = False
        details.append("Cannot test message sending: No chat ID available")
        test_results["chat_system"]["details"].extend(details)
        return success
    
    # Send message as patient
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.post(
        f"{API_URL}/chats/{chat_id}/messages",
        params={"content": "Hello from patient"},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data["sender_id"] == user_ids["patient"] and data["content"] == "Hello from patient":
            details.append("Patient message sending successful")
        else:
            success = False
            details.append(f"Patient message sending returned wrong data: {data}")
    else:
        success = False
        details.append(f"Patient message sending failed: {response.status_code} - {response.text}")
    
    # Send message as doctor
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    response = requests.post(
        f"{API_URL}/chats/{chat_id}/messages",
        params={"content": "Hello from doctor"},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data["sender_id"] == user_ids["doctor"] and data["content"] == "Hello from doctor":
            details.append("Doctor message sending successful")
        else:
            success = False
            details.append(f"Doctor message sending returned wrong data: {data}")
    else:
        success = False
        details.append(f"Doctor message sending failed: {response.status_code} - {response.text}")
    
    test_results["chat_system"]["details"].extend(details)
    return success

def test_message_retrieval():
    success = True
    details = []
    
    if not chat_id:
        success = False
        details.append("Cannot test message retrieval: No chat ID available")
        test_results["chat_system"]["details"].extend(details)
        return success
    
    # Get messages as patient
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.get(f"{API_URL}/chats/{chat_id}/messages", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 2:  # Should have at least the two messages we sent
            patient_msg = next((msg for msg in data if msg["sender_id"] == user_ids["patient"]), None)
            doctor_msg = next((msg for msg in data if msg["sender_id"] == user_ids["doctor"]), None)
            
            if patient_msg and doctor_msg:
                details.append("Message retrieval successful")
            else:
                success = False
                details.append(f"Message retrieval missing messages: {data}")
        else:
            success = False
            details.append(f"Message retrieval returned too few messages: {data}")
    else:
        success = False
        details.append(f"Message retrieval failed: {response.status_code} - {response.text}")
    
    test_results["chat_system"]["details"].extend(details)
    return success

def test_chat_listing():
    success = True
    details = []
    
    # Get chats as patient
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.get(f"{API_URL}/chats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 1:
            if any(chat["id"] == chat_id for chat in data):
                details.append("Patient chat listing successful")
            else:
                success = False
                details.append(f"Patient chat listing missing created chat: {data}")
        else:
            success = False
            details.append(f"Patient chat listing returned no chats: {data}")
    else:
        success = False
        details.append(f"Patient chat listing failed: {response.status_code} - {response.text}")
    
    # Get chats as doctor
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    response = requests.get(f"{API_URL}/chats", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 1:
            if any(chat["id"] == chat_id for chat in data):
                details.append("Doctor chat listing successful")
            else:
                success = False
                details.append(f"Doctor chat listing missing created chat: {data}")
        else:
            success = False
            details.append(f"Doctor chat listing returned no chats: {data}")
    else:
        success = False
        details.append(f"Doctor chat listing failed: {response.status_code} - {response.text}")
    
    test_results["chat_system"]["details"].extend(details)
    return success

# 3. Prescription System Tests
def test_prescription_creation():
    global prescription_id
    success = True
    details = []
    
    # Create prescription as doctor
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    medications = [
        {"name": "Aspirin", "dosage": "100mg", "frequency": "daily", "duration": "7 days"},
        {"name": "Ibuprofen", "dosage": "200mg", "frequency": "twice daily", "duration": "5 days"}
    ]
    
    response = requests.post(
        f"{API_URL}/prescriptions",
        params={
            "patient_id": user_ids["patient"],
            "diagnosis": "Test diagnosis",
            "instructions": "Take with food"
        },
        json=medications,
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        prescription_id = data["id"]
        if (data["patient_id"] == user_ids["patient"] and 
            data["doctor_id"] == user_ids["doctor"] and
            len(data["medications"]) == 2):
            details.append("Prescription creation successful")
        else:
            success = False
            details.append(f"Prescription creation returned wrong data: {data}")
    else:
        success = False
        details.append(f"Prescription creation failed: {response.status_code} - {response.text}")
    
    test_results["prescription_system"]["details"].extend(details)
    return success

def test_prescription_viewing():
    success = True
    details = []
    
    if not prescription_id:
        success = False
        details.append("Cannot test prescription viewing: No prescription ID available")
        test_results["prescription_system"]["details"].extend(details)
        return success
    
    # View prescriptions as patient
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.get(f"{API_URL}/prescriptions", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 1:
            if any(presc["id"] == prescription_id for presc in data):
                details.append("Patient prescription viewing successful")
            else:
                success = False
                details.append(f"Patient prescription viewing missing created prescription: {data}")
        else:
            success = False
            details.append(f"Patient prescription viewing returned no prescriptions: {data}")
    else:
        success = False
        details.append(f"Patient prescription viewing failed: {response.status_code} - {response.text}")
    
    # View prescriptions as doctor
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    response = requests.get(f"{API_URL}/prescriptions", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 1:
            if any(presc["id"] == prescription_id for presc in data):
                details.append("Doctor prescription viewing successful")
            else:
                success = False
                details.append(f"Doctor prescription viewing missing created prescription: {data}")
        else:
            success = False
            details.append(f"Doctor prescription viewing returned no prescriptions: {data}")
    else:
        success = False
        details.append(f"Doctor prescription viewing failed: {response.status_code} - {response.text}")
    
    # View prescriptions as pharmacy
    headers = {"Authorization": f"Bearer {tokens['pharmacy']}"}
    response = requests.get(f"{API_URL}/prescriptions", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if len(data) >= 1:
            if any(presc["id"] == prescription_id for presc in data):
                details.append("Pharmacy prescription viewing successful")
            else:
                success = False
                details.append(f"Pharmacy prescription viewing missing created prescription: {data}")
        else:
            success = False
            details.append(f"Pharmacy prescription viewing returned no prescriptions: {data}")
    else:
        success = False
        details.append(f"Pharmacy prescription viewing failed: {response.status_code} - {response.text}")
    
    test_results["prescription_system"]["details"].extend(details)
    return success

def test_prescription_dispensing():
    success = True
    details = []
    
    if not prescription_id:
        success = False
        details.append("Cannot test prescription dispensing: No prescription ID available")
        test_results["prescription_system"]["details"].extend(details)
        return success
    
    # Dispense prescription as pharmacy
    headers = {"Authorization": f"Bearer {tokens['pharmacy']}"}
    response = requests.patch(f"{API_URL}/prescriptions/{prescription_id}/dispense", headers=headers)
    
    if response.status_code == 200:
        details.append("Prescription dispensing successful")
        
        # Verify prescription status changed
        response = requests.get(f"{API_URL}/prescriptions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            dispensed_presc = next((p for p in data if p["id"] == prescription_id), None)
            if dispensed_presc and dispensed_presc["status"] == "dispensed":
                details.append("Prescription status updated correctly")
            else:
                success = False
                details.append(f"Prescription status not updated correctly: {dispensed_presc}")
        else:
            success = False
            details.append(f"Failed to verify prescription status: {response.status_code} - {response.text}")
    else:
        success = False
        details.append(f"Prescription dispensing failed: {response.status_code} - {response.text}")
    
    # Try to dispense as patient (should fail)
    headers = {"Authorization": f"Bearer {tokens['patient']}"}
    response = requests.patch(f"{API_URL}/prescriptions/{prescription_id}/dispense", headers=headers)
    
    if response.status_code in [401, 403]:
        details.append("Role-based access control working: Patient cannot dispense prescriptions")
    else:
        success = False
        details.append(f"Role-based access control failed: Patient could dispense prescription: {response.status_code}")
    
    test_results["prescription_system"]["details"].extend(details)
    return success

# 4. Database Operations Tests
def test_database_operations():
    success = True
    details = []
    
    # Test if data is persisted correctly
    # 1. Check if users are stored
    headers = {"Authorization": f"Bearer {tokens['doctor']}"}
    response = requests.get(f"{API_URL}/users/doctors", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if any(doc["id"] == user_ids["doctor"] for doc in data):
            details.append("User data persistence verified")
        else:
            success = False
            details.append(f"User data not persisted correctly: {data}")
    else:
        success = False
        details.append(f"Failed to verify user data persistence: {response.status_code} - {response.text}")
    
    # 2. Check if chats are stored
    if chat_id:
        headers = {"Authorization": f"Bearer {tokens['patient']}"}
        response = requests.get(f"{API_URL}/chats", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if any(chat["id"] == chat_id for chat in data):
                details.append("Chat data persistence verified")
            else:
                success = False
                details.append(f"Chat data not persisted correctly: {data}")
        else:
            success = False
            details.append(f"Failed to verify chat data persistence: {response.status_code} - {response.text}")
    
    # 3. Check if prescriptions are stored
    if prescription_id:
        headers = {"Authorization": f"Bearer {tokens['pharmacy']}"}
        response = requests.get(f"{API_URL}/prescriptions", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if any(presc["id"] == prescription_id for presc in data):
                details.append("Prescription data persistence verified")
            else:
                success = False
                details.append(f"Prescription data not persisted correctly: {data}")
        else:
            success = False
            details.append(f"Failed to verify prescription data persistence: {response.status_code} - {response.text}")
    
    test_results["database_operations"]["details"].extend(details)
    return success

# Run all tests
def run_all_tests():
    print("\n🔍 STARTING TELEMEDICINE BACKEND TESTS 🔍\n")
    
    # Authentication System Tests
    auth_success = True
    auth_success &= run_test("User Registration", test_user_registration)
    auth_success &= run_test("User Login", test_user_login)
    auth_success &= run_test("Token Validation", test_token_validation)
    auth_success &= run_test("Role-Based Access Control", test_role_based_access)
    test_results["auth_system"]["success"] = auth_success
    
    # Chat System Tests
    chat_success = True
    chat_success &= run_test("Chat Creation", test_chat_creation)
    chat_success &= run_test("Message Sending", test_message_sending)
    chat_success &= run_test("Message Retrieval", test_message_retrieval)
    chat_success &= run_test("Chat Listing", test_chat_listing)
    test_results["chat_system"]["success"] = chat_success
    
    # Prescription System Tests
    prescription_success = True
    prescription_success &= run_test("Prescription Creation", test_prescription_creation)
    prescription_success &= run_test("Prescription Viewing", test_prescription_viewing)
    prescription_success &= run_test("Prescription Dispensing", test_prescription_dispensing)
    test_results["prescription_system"]["success"] = prescription_success
    
    # Database Operations Tests
    db_success = run_test("Database Operations", test_database_operations)
    test_results["database_operations"]["success"] = db_success
    
    # Print summary
    print_separator()
    print("📊 TEST SUMMARY 📊")
    print(f"Authentication System: {'✅ PASSED' if test_results['auth_system']['success'] else '❌ FAILED'}")
    print(f"Chat System: {'✅ PASSED' if test_results['chat_system']['success'] else '❌ FAILED'}")
    print(f"Prescription System: {'✅ PASSED' if test_results['prescription_system']['success'] else '❌ FAILED'}")
    print(f"Database Operations: {'✅ PASSED' if test_results['database_operations']['success'] else '❌ FAILED'}")
    
    all_passed = all(result["success"] for result in test_results.values())
    print_separator()
    if all_passed:
        print("🎉 ALL TESTS PASSED! 🎉")
    else:
        print("❌ SOME TESTS FAILED! ❌")
    print_separator()
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()