from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
JWT_SECRET = "telemedicine_secret_key_2025"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, str] = {}  # user_id -> connection_id

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id
        return connection_id

    def disconnect(self, connection_id: str, user_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            connection_id = self.user_connections[user_id]
            if connection_id in self.active_connections:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(json.dumps(message))

manager = ConnectionManager()

# Models
class UserRole:
    PATIENT = "patient"
    DOCTOR = "doctor"
    PHARMACY = "pharmacy"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    full_name: str
    role: str  # patient, doctor, pharmacy
    phone: Optional[str] = None
    specialization: Optional[str] = None  # for doctors
    license_number: Optional[str] = None  # for doctors/pharmacy
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_type: str = "text"  # text, prescription, appointment

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    patient_name: str
    doctor_name: str
    status: str = "active"  # active, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None

class Prescription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    pharmacy_id: Optional[str] = None
    patient_name: str
    doctor_name: str
    medications: List[Dict[str, Any]]
    diagnosis: str
    instructions: str
    status: str = "pending"  # pending, dispensed, collected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    dispensed_at: Optional[datetime] = None

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    patient_name: str
    doctor_name: str
    appointment_date: datetime
    duration_minutes: int = 30
    status: str = "scheduled"  # scheduled, completed, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Authentication endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        specialization=user_data.specialization,
        license_number=user_data.license_number
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "specialization": user.specialization,
            "license_number": user.license_number
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "specialization": user.get("specialization"),
            "license_number": user.get("license_number")
        }
    }

# User endpoints
@api_router.get("/users/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "specialization": current_user.specialization,
        "license_number": current_user.license_number
    }

@api_router.get("/users/doctors")
async def get_doctors():
    doctors = await db.users.find({"role": "doctor", "is_active": True}).to_list(100)
    return [
        {
            "id": doc["id"],
            "full_name": doc["full_name"],
            "specialization": doc.get("specialization", "General Practice"),
            "license_number": doc.get("license_number")
        }
        for doc in doctors
    ]

# Chat endpoints
@api_router.post("/chats")
async def create_chat(doctor_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can start chats")
    
    doctor = await db.users.find_one({"id": doctor_id, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if chat already exists
    existing_chat = await db.chats.find_one({
        "patient_id": current_user.id,
        "doctor_id": doctor_id,
        "status": "active"
    })
    
    if existing_chat:
        return Chat(**existing_chat)
    
    chat = Chat(
        patient_id=current_user.id,
        doctor_id=doctor_id,
        patient_name=current_user.full_name,
        doctor_name=doctor["full_name"]
    )
    
    await db.chats.insert_one(chat.dict())
    return chat

@api_router.get("/chats")
async def get_user_chats(current_user: User = Depends(get_current_user)):
    if current_user.role == "patient":
        chats = await db.chats.find({"patient_id": current_user.id}).to_list(100)
    elif current_user.role == "doctor":
        chats = await db.chats.find({"doctor_id": current_user.id}).to_list(100)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return [Chat(**chat) for chat in chats]

@api_router.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, current_user: User = Depends(get_current_user)):
    # Verify user is part of this chat
    chat = await db.chats.find_one({"id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if current_user.id not in [chat["patient_id"], chat["doctor_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find({"chat_id": chat_id}).sort("timestamp", 1).to_list(1000)
    return [Message(**msg) for msg in messages]

@api_router.post("/chats/{chat_id}/messages")
async def send_message(chat_id: str, content: str, current_user: User = Depends(get_current_user)):
    # Verify user is part of this chat
    chat = await db.chats.find_one({"id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if current_user.id not in [chat["patient_id"], chat["doctor_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        content=content
    )
    
    await db.messages.insert_one(message.dict())
    
    # Update chat last message
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$set": {
                "last_message": content,
                "last_message_time": message.timestamp
            }
        }
    )
    
    # Send to other user via WebSocket
    other_user_id = chat["doctor_id"] if current_user.id == chat["patient_id"] else chat["patient_id"]
    await manager.send_personal_message({
        "type": "new_message",
        "message": message.dict()
    }, other_user_id)
    
    return message

# Prescription endpoints
@api_router.post("/prescriptions")
async def create_prescription(
    patient_id: str,
    medications: List[Dict[str, Any]],
    diagnosis: str,
    instructions: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
    
    patient = await db.users.find_one({"id": patient_id, "role": "patient"})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    prescription = Prescription(
        patient_id=patient_id,
        doctor_id=current_user.id,
        patient_name=patient["full_name"],
        doctor_name=current_user.full_name,
        medications=medications,
        diagnosis=diagnosis,
        instructions=instructions
    )
    
    await db.prescriptions.insert_one(prescription.dict())
    return prescription

@api_router.get("/prescriptions")
async def get_prescriptions(current_user: User = Depends(get_current_user)):
    if current_user.role == "patient":
        prescriptions = await db.prescriptions.find({"patient_id": current_user.id}).to_list(100)
    elif current_user.role == "doctor":
        prescriptions = await db.prescriptions.find({"doctor_id": current_user.id}).to_list(100)
    elif current_user.role == "pharmacy":
        prescriptions = await db.prescriptions.find({"status": {"$in": ["pending", "dispensed"]}}).to_list(100)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return [Prescription(**presc) for presc in prescriptions]

@api_router.patch("/prescriptions/{prescription_id}/dispense")
async def dispense_prescription(prescription_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "pharmacy":
        raise HTTPException(status_code=403, detail="Only pharmacy can dispense prescriptions")
    
    result = await db.prescriptions.update_one(
        {"id": prescription_id},
        {
            "$set": {
                "status": "dispensed",
                "pharmacy_id": current_user.id,
                "dispensed_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    return {"message": "Prescription dispensed successfully"}

# WebSocket endpoint
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    connection_id = await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
    except WebSocketDisconnect:
        manager.disconnect(connection_id, user_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
