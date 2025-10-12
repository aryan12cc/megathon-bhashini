#!/usr/bin/env python3
"""
Megathon Bhashini - Database Server
Simple FastAPI server for conversation management with MongoDB
"""

import os
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from pymongo import MongoClient
import uvicorn
from passlib.context import CryptContext
from jose import JWTError, jwt
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth


# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "939597708417-r3k4damgmlqeijps5k4up0gnl3280bt7.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "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")


# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


# --- Pydantic Models ---
class UserBase(BaseModel):
    email: EmailStr
    fullName: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class User(UserBase):
    id: str = Field(..., alias="_id")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class NewConversationRequest(BaseModel):
    userID: str
    userLanguage: str
    personLanguage: str

class AddMessageRequest(BaseModel):
    convoID: str
    speaker: str
    originalText: Optional[str] = None
    originalLanguage: Optional[str] = None
    translatedText: Optional[str] = None
    translatedLanguage: Optional[str] = None
    translatedText_EN: Optional[str] = None
    translatedLanguage_EN: Optional[str] = None

class ConversationResponse(BaseModel):
    convoID: str
    message: str

class MessageResponse(BaseModel):
    order: int
    message: str


# --- Utility Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- Database ---
# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/megathon_bhashini")
client = MongoClient(MONGODB_URL)
db = client.megathon_bhashini
conversations_collection = db.conversations
users_collection = db.users

# --- OAuth ---
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)


# --- Dependency ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return user


# FastAPI App
app = FastAPI(
    title="Megathon Bhashini Database API",
    description="API for managing multilingual healthcare conversations",
    version="1.0.0"
)

# Add SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database connection and create indexes"""
    try:
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        # Create indexes for better performance
        conversations_collection.create_index("userID")
        conversations_collection.create_index("createdAt")
        users_collection.create_index("email", unique=True)
        print("✅ Database indexes created")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")


# --- Google Auth Endpoints ---
@app.get('/api/auth/google')
async def login_google(request: Request):
    print('coming here (/auth/google/) with request: ', request)
    redirect_uri = "http://localhost:8002/api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/api/auth/google/callback')
async def auth_google_callback(request: Request):
    print('coming here (/auth/google/callback) with request: ', request)
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not authorize Google login: {e}")

    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Could not fetch user info from Google")

    email = user_info['email']
    user = users_collection.find_one({"email": email})

    if not user:
        # Create a new user
        new_user_data = {
            "email": email,
            "fullName": user_info.get('name', ''),
            "hashed_password": get_password_hash(os.urandom(16).hex()),  # Generate a random password
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        users_collection.insert_one(new_user_data)
        user = users_collection.find_one({"email": email})

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # Redirect to frontend with token
    # In a real app, you might want a more secure way to pass the token
    # or have the frontend poll for it.
    response = RedirectResponse(url=f"http://localhost:8080/login/success?token={access_token}")
    return response


# --- User Authentication Endpoints ---
@app.post("/api/users/register", response_model=User)
async def register_user(user: UserCreate):
    """Register a new user"""
    db_user = users_collection.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_data = user.dict()
    user_data.pop("password")  # Don't store plain password
    user_in_db_data = {**user_data, "hashed_password": hashed_password}
    
    new_user = users_collection.insert_one(user_in_db_data)
    created_user = users_collection.find_one({"_id": new_user.inserted_id})

    # Convert ObjectId to string for the response model
    created_user["_id"] = str(created_user["_id"])
    return User(**created_user)

@app.post("/api/users/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and return access token"""
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current logged in user"""
    current_user["_id"] = str(current_user["_id"])
    return User(**current_user)


# --- Conversation Endpoints ---
@app.post("/api/conversations/new", response_model=ConversationResponse)
async def create_new_conversation(request: NewConversationRequest, current_user: dict = Depends(get_current_user)):
    """Create a new conversation"""
    try:
        if request.userID != str(current_user["_id"]):
             raise HTTPException(status_code=403, detail="Cannot create conversation for another user")

        conversation = {
            "userID": request.userID,
            "userLanguage": request.userLanguage,
            "personLanguage": request.personLanguage,
            "transcript": [],
            "aiSummary_EN": None,
            "triageData": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = conversations_collection.insert_one(conversation)
        convo_id = str(result.inserted_id)
        
        return ConversationResponse(
            convoID=convo_id,
            message="Conversation created successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


@app.post("/api/conversations/add", response_model=MessageResponse)
async def add_message_to_conversation(request: AddMessageRequest, current_user: dict = Depends(get_current_user)):
    """Add a message to an existing conversation"""
    try:
        # Validate conversation exists
        if not ObjectId.is_valid(request.convoID):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
        conversation = conversations_collection.find_one({"_id": ObjectId(request.convoID)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if str(conversation["userID"]) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to add message to this conversation")
        
        # Calculate next order number
        current_transcript = conversation.get("transcript", [])
        next_order = len(current_transcript)
        
        # Create message object
        message = {
            "order": next_order,
            "speaker": request.speaker,
            "originalText": request.originalText,
            "originalLanguage": request.originalLanguage,
            "translatedText": request.translatedText,
            "translatedLanguage": request.translatedLanguage,
            "translatedText_EN": request.translatedText_EN,
            "translatedLanguage_EN": request.translatedLanguage_EN
        }
        
        # Update conversation
        conversations_collection.update_one(
            {"_id": ObjectId(request.convoID)},
            {
                "$push": {"transcript": message},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        return MessageResponse(
            order=next_order,
            message="Message added successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add message: {str(e)}")


@app.get("/api/conversations/{convo_id}")
async def get_conversation(convo_id: str, current_user: dict = Depends(get_current_user)):
    """Get entire conversation transcript"""
    try:
        if not ObjectId.is_valid(convo_id):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
        conversation = conversations_collection.find_one({"_id": ObjectId(convo_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if str(conversation["userID"]) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

        # Convert ObjectId to string for JSON serialization
        conversation["_id"] = str(conversation["_id"])
        
        # Convert datetime objects to ISO format strings
        if "createdAt" in conversation:
            conversation["createdAt"] = conversation["createdAt"].isoformat() + "Z"
        if "updatedAt" in conversation:
            conversation["updatedAt"] = conversation["updatedAt"].isoformat() + "Z"
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversation: {str(e)}")


@app.get("/api/conversations")
async def get_all_conversations(
    userID: Optional[str] = None,
    limit: Optional[int] = 50,
    skip: Optional[int] = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get all conversations with optional filtering"""
    try:
        # Build query
        query = {}
        # If userID is provided, it must match the current user's ID
        if userID and userID != str(current_user["_id"]):
             raise HTTPException(status_code=403, detail="Not authorized to view conversations for this user")
        
        # If no userID is provided, default to the current user's ID
        query["userID"] = userID if userID else str(current_user["_id"])
        
        # Get conversations
        cursor = conversations_collection.find(query).sort("createdAt", -1)
        
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        
        conversations = list(cursor)
        
        # Convert ObjectIds and dates for JSON serialization
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            if "createdAt" in conv:
                conv["createdAt"] = conv["createdAt"].isoformat() + "Z"
            if "updatedAt" in conv:
                conv["updatedAt"] = conv["updatedAt"].isoformat() + "Z"
        
        return {
            "conversations": conversations,
            "total": len(conversations),
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversations: {str(e)}")


@app.delete("/api/conversations/{convo_id}")
async def delete_conversation(convo_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a conversation"""
    try:
        if not ObjectId.is_valid(convo_id):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
        conversation = conversations_collection.find_one({"_id": ObjectId(convo_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if str(conversation["userID"]) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")

        result = conversations_collection.delete_one({"_id": ObjectId(convo_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")


if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8002"))
    
    print(f"🚀 Starting Megathon Bhashini Database Server on {host}:{port}")
    print(f"📄 API Documentation: http://{host}:{port}/docs")
    print(f"🔄 Interactive API: http://{host}:{port}/redoc")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=False
    )