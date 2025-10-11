from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from config import settings
from database import get_postgres_cursor, get_mongodb, test_connections
from models import (
    UserCreate, UserLogin, UserResponse, Token, MessageResponse,
    ConversationCreate, ConversationUpdate, ConversationResponse,
    DocumentCreate, DocumentUpdate, DocumentResponse,
    HealthSummaryCreate, HealthSummaryResponse
)
from auth import hash_password, verify_password, create_access_token, get_current_user, require_user_type

# Initialize FastAPI app
app = FastAPI(
    title="Vaidya-Vaani API",
    description="Multilingual Healthcare Communication Platform - MVP",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= Startup/Shutdown Events =============

@app.on_event("startup")
async def startup_event():
    """Test database connections on startup"""
    print("🚀 Starting Vaidya-Vaani API...")
    test_connections()
    print("✅ API is ready!")


# ============= Health Check =============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Vaidya-Vaani API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# ============= Authentication Endpoints =============

@app.post("/api/auth/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Register a new user"""
    try:
        with get_postgres_cursor() as cursor:
            # Check if user already exists
            cursor.execute(
                "SELECT user_id FROM users WHERE phone_number = %s",
                (user.phone_number,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number already registered"
                )
            
            # Hash password and insert user
            hashed_password = hash_password(user.password)
            cursor.execute(
                """
                INSERT INTO users (phone_number, password_hash, user_type, name, preferred_language)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING user_id
                """,
                (user.phone_number, hashed_password, user.user_type, user.name, user.preferred_language)
            )
            result = cursor.fetchone()
            
            return MessageResponse(
                message=f"User registered successfully with ID: {result['user_id']}",
                success=True
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    try:
        with get_postgres_cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, phone_number, password_hash, user_type, name, 
                       preferred_language, is_active, created_at
                FROM users WHERE phone_number = %s
                """,
                (credentials.phone_number,)
            )
            user = cursor.fetchone()
            
            if not user or not verify_password(credentials.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid phone number or password"
                )
            
            if not user["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is inactive"
                )
            
            # Update last login
            cursor.execute(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = %s",
                (user["user_id"],)
            )
            
            # Create access token
            access_token = create_access_token(data={"sub": str(user["user_id"])})
            
            user_response = UserResponse(
                user_id=str(user["user_id"]),
                phone_number=user["phone_number"],
                user_type=user["user_type"],
                name=user["name"],
                preferred_language=user["preferred_language"],
                is_active=user["is_active"],
                created_at=user["created_at"]
            )
            
            return Token(
                access_token=access_token,
                token_type="bearer",
                user=user_response
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user info"""
    return current_user


# ============= User CRUD Endpoints =============

@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(
    user_type: Optional[str] = None,
    current_user: UserResponse = Depends(require_user_type("doctor", "staff"))
):
    """Get all users (doctors and staff only)"""
    try:
        with get_postgres_cursor() as cursor:
            if user_type:
                cursor.execute(
                    """
                    SELECT user_id, phone_number, user_type, name, preferred_language, 
                           is_active, created_at
                    FROM users WHERE user_type = %s AND is_active = true
                    ORDER BY created_at DESC
                    """,
                    (user_type,)
                )
            else:
                cursor.execute(
                    """
                    SELECT user_id, phone_number, user_type, name, preferred_language, 
                           is_active, created_at
                    FROM users WHERE is_active = true
                    ORDER BY created_at DESC
                    """
                )
            
            users = cursor.fetchall()
            return [
                UserResponse(
                    user_id=str(u["user_id"]),
                    phone_number=u["phone_number"],
                    user_type=u["user_type"],
                    name=u["name"],
                    preferred_language=u["preferred_language"],
                    is_active=u["is_active"],
                    created_at=u["created_at"]
                )
                for u in users
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        with get_postgres_cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, phone_number, user_type, name, preferred_language, 
                       is_active, created_at
                FROM users WHERE user_id = %s
                """,
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return UserResponse(
                user_id=str(user["user_id"]),
                phone_number=user["phone_number"],
                user_type=user["user_type"],
                name=user["name"],
                preferred_language=user["preferred_language"],
                is_active=user["is_active"],
                created_at=user["created_at"]
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Conversation CRUD Endpoints =============

@app.post("/api/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        db = get_mongodb()
        
        conversation_data = {
            "conversationType": conversation.conversationType,
            "patientId": conversation.patientId,
            "patientName": conversation.patientName,
            "providerId": conversation.providerId,
            "providerName": conversation.providerName,
            "patientLanguage": conversation.patientLanguage,
            "providerLanguage": conversation.providerLanguage,
            "startTime": datetime.utcnow(),
            "endTime": None,
            "status": "active",
            "transcript": [],
            "aiSummary": None,
            "triageData": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = db.conversations.insert_one(conversation_data)
        conversation_data["_id"] = str(result.inserted_id)
        
        return ConversationResponse(**conversation_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    patient_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    conversation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all conversations with optional filters"""
    try:
        db = get_mongodb()
        
        query = {}
        if patient_id:
            query["patientId"] = patient_id
        if provider_id:
            query["providerId"] = provider_id
        if conversation_type:
            query["conversationType"] = conversation_type
        if status_filter:
            query["status"] = status_filter
        
        conversations = list(db.conversations.find(query).sort("createdAt", -1))
        
        return [
            ConversationResponse(**{**conv, "_id": str(conv["_id"])})
            for conv in conversations
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_by_id(
    conversation_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get conversation by ID"""
    try:
        db = get_mongodb()
        
        conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return ConversationResponse(**{**conversation, "_id": str(conversation["_id"])})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update conversation"""
    try:
        db = get_mongodb()
        
        update_dict = update_data.model_dump(exclude_unset=True)
        if update_dict:
            update_dict["updatedAt"] = datetime.utcnow()
            
            result = db.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = db.conversations.find_one({"_id": ObjectId(conversation_id)})
        return ConversationResponse(**{**conversation, "_id": str(conversation["_id"])})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/conversations/{conversation_id}", response_model=MessageResponse)
async def delete_conversation(
    conversation_id: str,
    current_user: UserResponse = Depends(require_user_type("doctor", "staff"))
):
    """Delete conversation"""
    try:
        db = get_mongodb()
        
        result = db.conversations.delete_one({"_id": ObjectId(conversation_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return MessageResponse(message="Conversation deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Document CRUD Endpoints =============

@app.post("/api/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document: DocumentCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new document"""
    try:
        db = get_mongodb()
        
        document_data = {
            "documentType": document.documentType,
            "patientId": document.patientId,
            "patientName": document.patientName,
            "fileUrl": document.fileUrl,
            "fileFormat": document.fileFormat,
            "uploadedBy": document.uploadedBy,
            "uploadedAt": datetime.utcnow(),
            "documentDate": document.documentDate or datetime.utcnow(),
            "ocrStatus": "pending",
            "originalText": None,
            "translatedText": None,
            "aiAnalysis": None,
            "tags": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = db.documents.insert_one(document_data)
        document_data["_id"] = str(result.inserted_id)
        
        return DocumentResponse(**document_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents", response_model=List[DocumentResponse])
async def get_documents(
    patient_id: Optional[str] = None,
    document_type: Optional[str] = None,
    ocr_status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all documents with optional filters"""
    try:
        db = get_mongodb()
        
        query = {}
        if patient_id:
            query["patientId"] = patient_id
        if document_type:
            query["documentType"] = document_type
        if ocr_status:
            query["ocrStatus"] = ocr_status
        
        documents = list(db.documents.find(query).sort("createdAt", -1))
        
        return [
            DocumentResponse(**{**doc, "_id": str(doc["_id"])})
            for doc in documents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents/{document_id}", response_model=DocumentResponse)
async def get_document_by_id(
    document_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get document by ID"""
    try:
        db = get_mongodb()
        
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return DocumentResponse(**{**document, "_id": str(document["_id"])})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    update_data: DocumentUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update document"""
    try:
        db = get_mongodb()
        
        update_dict = update_data.model_dump(exclude_unset=True)
        if update_dict:
            update_dict["updatedAt"] = datetime.utcnow()
            
            result = db.documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Document not found")
        
        document = db.documents.find_one({"_id": ObjectId(document_id)})
        return DocumentResponse(**{**document, "_id": str(document["_id"])})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/documents/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    current_user: UserResponse = Depends(require_user_type("doctor", "staff", "patient"))
):
    """Delete document"""
    try:
        db = get_mongodb()
        
        result = db.documents.delete_one({"_id": ObjectId(document_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return MessageResponse(message="Document deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Health Summary CRUD Endpoints =============

@app.post("/api/health-summaries", response_model=HealthSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_health_summary(
    summary: HealthSummaryCreate,
    current_user: UserResponse = Depends(require_user_type("doctor"))
):
    """Create a new health summary"""
    try:
        db = get_mongodb()
        
        summary_data = {
            "patientId": summary.patientId,
            "sourceDocumentIds": summary.sourceDocumentIds,
            "summaryText": summary.summaryText,
            "startDate": summary.startDate,
            "endDate": summary.endDate,
            "generatedBy": summary.generatedBy,
            "generatedAt": datetime.utcnow()
        }
        
        result = db.health_summaries.insert_one(summary_data)
        summary_data["_id"] = str(result.inserted_id)
        
        return HealthSummaryResponse(**summary_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health-summaries", response_model=List[HealthSummaryResponse])
async def get_health_summaries(
    patient_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all health summaries with optional filters"""
    try:
        db = get_mongodb()
        
        query = {}
        if patient_id:
            query["patientId"] = patient_id
        
        summaries = list(db.health_summaries.find(query).sort("generatedAt", -1))
        
        return [
            HealthSummaryResponse(**{**summary, "_id": str(summary["_id"])})
            for summary in summaries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health-summaries/{summary_id}", response_model=HealthSummaryResponse)
async def get_health_summary_by_id(
    summary_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get health summary by ID"""
    try:
        db = get_mongodb()
        
        summary = db.health_summaries.find_one({"_id": ObjectId(summary_id)})
        
        if not summary:
            raise HTTPException(status_code=404, detail="Health summary not found")
        
        return HealthSummaryResponse(**{**summary, "_id": str(summary["_id"])})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/health-summaries/{summary_id}", response_model=MessageResponse)
async def delete_health_summary(
    summary_id: str,
    current_user: UserResponse = Depends(require_user_type("doctor"))
):
    """Delete health summary"""
    try:
        db = get_mongodb()
        
        result = db.health_summaries.delete_one({"_id": ObjectId(summary_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Health summary not found")
        
        return MessageResponse(message="Health summary deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
