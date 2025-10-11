from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId


# ============= User Models =============

class UserCreate(BaseModel):
    phone_number: str
    password: str
    user_type: Literal["patient", "doctor", "staff", "pharmacist"]
    name: str
    preferred_language: str = "en"


class UserLogin(BaseModel):
    phone_number: str
    password: str


class UserResponse(BaseModel):
    user_id: str
    phone_number: str
    user_type: str
    name: str
    preferred_language: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ============= Conversation Models =============

class TranscriptItem(BaseModel):
    speaker: Literal["patient", "provider"]
    speakerId: str
    originalText: str
    originalLanguage: str
    translatedText: str
    translatedLanguage: str
    timestamp: int
    isKeyPoint: bool = False


class TriageData(BaseModel):
    chiefComplaint: str
    symptoms: List[str]
    urgencyLevel: Literal["emergency", "urgent", "semi_urgent", "non_urgent"]
    recommendedDepartment: str


class ConversationCreate(BaseModel):
    conversationType: Literal["clinical_consultation", "triage", "pharmacy_connect"]
    patientId: str
    patientName: str
    providerId: str
    providerName: str
    patientLanguage: str = "en"
    providerLanguage: str = "en"


class ConversationUpdate(BaseModel):
    transcript: Optional[List[TranscriptItem]] = None
    aiSummary: Optional[str] = None
    triageData: Optional[TriageData] = None
    endTime: Optional[datetime] = None
    status: Optional[Literal["active", "completed"]] = None


class ConversationResponse(BaseModel):
    id: str = Field(alias="_id")
    conversationType: str
    patientId: str
    patientName: str
    providerId: str
    providerName: str
    patientLanguage: str
    providerLanguage: str
    startTime: datetime
    endTime: Optional[datetime] = None
    status: str
    transcript: List[TranscriptItem] = []
    aiSummary: Optional[str] = None
    triageData: Optional[TriageData] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


# ============= Document Models =============

class DocumentCreate(BaseModel):
    documentType: Literal["prescription", "lab_report", "discharge_summary", "other"]
    patientId: str
    patientName: str
    fileUrl: str
    fileFormat: str
    documentDate: Optional[datetime] = None
    uploadedBy: str


class DocumentUpdate(BaseModel):
    ocrStatus: Optional[Literal["pending", "completed", "failed"]] = None
    originalText: Optional[str] = None
    translatedText: Optional[str] = None
    aiAnalysis: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentResponse(BaseModel):
    id: str = Field(alias="_id")
    documentType: str
    patientId: str
    patientName: str
    fileUrl: str
    fileFormat: str
    uploadedBy: str
    uploadedAt: datetime
    documentDate: Optional[datetime] = None
    ocrStatus: str
    originalText: Optional[str] = None
    translatedText: Optional[str] = None
    aiAnalysis: Optional[str] = None
    tags: List[str] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


# ============= Health Summary Models =============

class HealthSummaryCreate(BaseModel):
    patientId: str
    sourceDocumentIds: List[str] = []
    summaryText: str
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    generatedBy: str


class HealthSummaryResponse(BaseModel):
    id: str = Field(alias="_id")
    patientId: str
    sourceDocumentIds: List[str]
    summaryText: str
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    generatedBy: str
    generatedAt: datetime

    class Config:
        populate_by_name = True


# ============= Generic Response Models =============

class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False
