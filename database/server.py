#!/usr/bin/env python3
"""
Megathon Bhashini - Database Server
Simple FastAPI server for conversation management with MongoDB
"""

import os
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
import uvicorn


# Pydantic Models
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


# FastAPI App
app = FastAPI(
    title="Megathon Bhashini Database API",
    description="API for managing multilingual healthcare conversations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/megathon_bhashini")
client = MongoClient(MONGODB_URL)
db = client.megathon_bhashini
conversations_collection = db.conversations


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


@app.post("/api/conversations/new", response_model=ConversationResponse)
async def create_new_conversation(request: NewConversationRequest):
    """Create a new conversation"""
    try:
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
async def add_message_to_conversation(request: AddMessageRequest):
    """Add a message to an existing conversation"""
    try:
        # Validate conversation exists
        if not ObjectId.is_valid(request.convoID):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
        conversation = conversations_collection.find_one({"_id": ObjectId(request.convoID)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
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
async def get_conversation(convo_id: str):
    """Get entire conversation transcript"""
    try:
        if not ObjectId.is_valid(convo_id):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
        conversation = conversations_collection.find_one({"_id": ObjectId(convo_id)})
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
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
    skip: Optional[int] = 0
):
    """Get all conversations with optional filtering"""
    try:
        # Build query
        query = {}
        if userID:
            query["userID"] = userID
        
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
async def delete_conversation(convo_id: str):
    """Delete a conversation"""
    try:
        if not ObjectId.is_valid(convo_id):
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")
        
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
    port = int(os.getenv("PORT", "8000"))
    
    print(f"🚀 Starting Megathon Bhashini Database Server on {host}:{port}")
    print(f"📄 API Documentation: http://{host}:{port}/docs")
    print(f"🔄 Interactive API: http://{host}:{port}/redoc")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=False
    )