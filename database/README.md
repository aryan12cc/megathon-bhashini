# 🏥 Vaidya-Vaani MVP - Backend API

Multilingual Healthcare Communication Platform - Minimum Viable Product

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone and Navigate
```bash
cd mvp
```

### 2. Start All Services
```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** (port 5432) - User authentication
- **MongoDB** (port 27017) - Documents and conversations
- **FastAPI Backend** (port 8000) - REST API

### 3. Check Health
```bash
curl http://localhost:8000/health
```

### 4. API Documentation
Open your browser:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 📁 Project Structure

```
mvp/
├── docker-compose.yml          # Docker orchestration
├── init.sql                    # PostgreSQL schema
├── mongo-init.js              # MongoDB collections & sample data
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py               # FastAPI application
│   ├── config.py             # Configuration
│   ├── database.py           # Database connections
│   ├── models.py             # Pydantic models
│   └── auth.py               # Authentication
└── README.md
```

---

## 🗄️ Database Schema

### PostgreSQL
- **users** - Authentication and basic user info

### MongoDB Collections
- **conversations** - Clinical consultations, triage, pharmacy chats
- **documents** - Prescriptions, lab reports, discharge summaries
- **health_summaries** - AI-generated longitudinal health summaries

---

## 🔐 Authentication

### Test Users (Password: `password123`)
```
Patient:    9876543210
Doctor:     9876543211
Staff:      9876543212
Pharmacist: 9876543213
```

### Login Flow
```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "9876543211",
    "password": "password123"
  }'

# 2. Use the access_token in subsequent requests
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Users (Authenticated)
- `GET /api/users` - Get all users (doctors/staff only)
- `GET /api/users/{user_id}` - Get user by ID

### Conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - Get all conversations (with filters)
- `GET /api/conversations/{id}` - Get conversation by ID
- `PUT /api/conversations/{id}` - Update conversation
- `DELETE /api/conversations/{id}` - Delete conversation

### Documents
- `POST /api/documents` - Create document
- `GET /api/documents` - Get all documents (with filters)
- `GET /api/documents/{id}` - Get document by ID
- `PUT /api/documents/{id}` - Update document (OCR, AI analysis)
- `DELETE /api/documents/{id}` - Delete document

### Health Summaries
- `POST /api/health-summaries` - Create health summary (doctors only)
- `GET /api/health-summaries` - Get health summaries
- `GET /api/health-summaries/{id}` - Get summary by ID
- `DELETE /api/health-summaries/{id}` - Delete summary

---

## 🧪 Testing the API

### 1. Register a New Patient
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "9999999999",
    "password": "mypassword",
    "user_type": "patient",
    "name": "Test Patient",
    "preferred_language": "hi"
  }'
```

### 2. Create a Conversation
```bash
curl -X POST http://localhost:8000/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationType": "clinical_consultation",
    "patientId": "patient-uuid",
    "patientName": "Test Patient",
    "providerId": "doctor-uuid",
    "providerName": "Dr. Singh",
    "patientLanguage": "hi",
    "providerLanguage": "en"
  }'
```

### 3. Create a Document
```bash
curl -X POST http://localhost:8000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "prescription",
    "patientId": "patient-uuid",
    "patientName": "Test Patient",
    "fileUrl": "s3://bucket/prescription.pdf",
    "fileFormat": "pdf",
    "uploadedBy": "patient-uuid"
  }'
```

---

## 🛠️ Development

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f mongodb
```

### Access Database Directly

#### PostgreSQL
```bash
docker exec -it vaidyavaani_postgres psql -U vaidya_admin -d vaidyavaani
```

#### MongoDB
```bash
docker exec -it vaidyavaani_mongodb mongosh -u vaidya_admin -p vaidya_secure_pass_123
use vaidyavaani
db.conversations.find().pretty()
```

### Restart Services
```bash
docker-compose restart backend
```

### Stop All Services
```bash
docker-compose down
```

### Clean Everything (including volumes)
```bash
docker-compose down -v
```

---

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and modify as needed:
```bash
cp backend/.env.example backend/.env
```

### Change Database Passwords
Edit `docker-compose.yml`:
- POSTGRES_PASSWORD
- MONGO_INITDB_ROOT_PASSWORD

---

## 📝 Next Steps (Future Enhancements)

- [ ] File upload for documents (S3 integration)
- [ ] OCR integration (Bhashini API)
- [ ] Translation service (Bhashini MT)
- [ ] AI summarization (Gemini/Sarvam API)
- [ ] Real-time transcript streaming (WebSockets)
- [ ] Medicine reminder system
- [ ] Educational content module
- [ ] Notification system
- [ ] User progress tracking
- [ ] Analytics and reporting

---

## 📚 API Response Examples

### Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "phone_number": "9876543211",
    "user_type": "doctor",
    "name": "Dr. Priya Singh",
    "preferred_language": "en",
    "is_active": true,
    "created_at": "2025-10-11T10:00:00"
  }
}
```

### Conversation Response
```json
{
  "id": "507f1f77bcf86cd799439011",
  "conversationType": "clinical_consultation",
  "patientId": "patient-uuid-1",
  "patientName": "Ramesh Rao",
  "providerId": "doctor-uuid-1",
  "providerName": "Dr. Priya Singh",
  "patientLanguage": "te",
  "providerLanguage": "en",
  "startTime": "2025-10-11T10:00:00Z",
  "endTime": "2025-10-11T10:30:00Z",
  "status": "completed",
  "transcript": [
    {
      "speaker": "patient",
      "speakerId": "patient-uuid-1",
      "originalText": "నాకు తలనొప్పి ఉంది",
      "originalLanguage": "te",
      "translatedText": "I have a headache",
      "translatedLanguage": "en",
      "timestamp": 0,
      "isKeyPoint": false
    }
  ],
  "aiSummary": "Patient presented with headache...",
  "triageData": null,
  "createdAt": "2025-10-11T10:00:00Z",
  "updatedAt": "2025-10-11T10:35:00Z"
}
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :5432
sudo lsof -i :27017

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if containers are running
docker ps

# Check container health
docker-compose ps

# View container logs
docker-compose logs postgres
docker-compose logs mongodb
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## 📄 License
MIT

## 👥 Contributors
- Vaidya-Vaani Team

---

**Happy Coding! 🚀**
