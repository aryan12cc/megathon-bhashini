# 🏥 Megathon Bhashini - Database Documentation

## 📋 Database Architecture

This project uses MongoDB for storing conversation history with a simple Python FastAPI server.

### MongoDB - Conversation History
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userID": "76712345",
  "userLanguage": "Telgu",
  "personLanguage": "English",
  "transcript": [
    {
      "order": 0,
      "speaker": "user",
      "originalText": "నాకు తలనొప్పి ఉంది",
      "originalLanguage": "Telgu",
      "translatedText": "I have a headache",
      "translatedLanguage": "English",
      "translatedText_EN": "I have a headache",
      "translatedLanguage_EN": "English"
    },
    {
      "order": 1,
      "speaker": "person",
      "originalText": "How long have you had this headache?",
      "originalLanguage": "English",
      "translatedText": "మీకు ఎంతకాలం నుండి ఈ తలనొప్పి ఉంది?",
      "translatedLanguage": "Telgu",
      "translatedText_EN": "How long have you had this headache?",
      "translatedLanguage_EN": "English"
    }
  ],
  "aiSummary_EN": "Patient presented with headache...",
  "triageData": null,
  "createdAt": "2025-10-11T10:00:00Z",
  "updatedAt": "2025-10-11T10:35:00Z"
}
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker installed
- MongoDB running (local or Docker)

### Method 1: Run with Docker
```bash
# Build the Docker image
docker build -t megathon-server .

# Run with local MongoDB
docker run -p 8000:8000 -e MONGODB_URL="mongodb://host.docker.internal:27017/megathon_bhashini" megathon-server

# Or run with Docker MongoDB
docker network create megathon-network
docker run -d --name mongodb --network megathon-network -p 27017:27017 mongo:7.0
docker run -p 8000:8000 --network megathon-network -e MONGODB_URL="mongodb://mongodb:27017/megathon_bhashini" megathon-server
```

### Method 2: Run Locally
```bash
# Install dependencies
pip install -r requirements.txt

# Set MongoDB URL (optional, defaults to localhost)
export MONGODB_URL="mongodb://localhost:27017/megathon_bhashini"

# Run the server
python server.py
```

### Access the API
- API Server: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Interactive API Explorer: http://localhost:8000/redoc

### Stop Services
```bash
# Stop all services
docker stop mongodb megathon-server

# Remove containers
docker rm mongodb megathon-server

# Remove network (if created)
docker network rm megathon-network
```

## 🗄️ Database Access

### MongoDB (Conversations)
```bash
# Connect to MongoDB container
docker exec -it mongodb mongosh

# Switch to database and query
use megathon_bhashini
db.conversations.find().pretty()
```

## 📡 API Endpoints

### Conversation Management

#### 1. Create New Conversation
```http
POST /api/conversations/new
Content-Type: application/json

{
    "userID": "76712345",
    "userLanguage": "Telgu", 
    "personLanguage": "English"
}
```

**Response:**
```json
{
    "convoID": "507f1f77bcf86cd799439011",
    "message": "Conversation created successfully"
}
```

#### 2. Add Message to Conversation
```http
POST /api/conversations/add
Content-Type: application/json

{
    "convoID": "507f1f77bcf86cd799439011",
    "speaker": "user",
    "originalText": "నాకు తలనొప్పి ఉంది",
    "originalLanguage": "Telgu",
    "translatedText": "I have a headache", 
    "translatedLanguage": "English",
    "translatedText_EN": "I have a headache",
    "translatedLanguage_EN": "English"
}
```

**Response:**
```json
{
    "order": 0,
    "message": "Message added successfully"
}
```

#### 3. Get Entire Conversation
```http
GET /api/conversations/{convoID}
```

**Response:**
```json
{
    "_id": "507f1f77bcf86cd799439011",
    "userID": "76712345",
    "userLanguage": "Telgu",
    "personLanguage": "English", 
    "transcript": [
        {
            "order": 0,
            "speaker": "user",
            "originalText": "నాకు తలనొప్పి ఉంది",
            "originalLanguage": "Telgu",
            "translatedText": "I have a headache",
            "translatedLanguage": "English",
            "translatedText_EN": "I have a headache",
            "translatedLanguage_EN": "English"
        }
    ],
    "createdAt": "2025-10-11T10:00:00Z",
    "updatedAt": "2025-10-11T10:35:00Z"
}
```

## 🧪 Testing the API

### Using curl

#### 1. Health Check
```bash
curl http://localhost:8000/health
```

#### 2. Create New Conversation
```bash
curl -X POST "http://localhost:8000/api/conversations/new" \
     -H "Content-Type: application/json" \
     -d '{
       "userID": "76712345",
       "userLanguage": "Telgu",
       "personLanguage": "English"
     }'
```

#### 3. Add Message to Conversation
```bash
curl -X POST "http://localhost:8000/api/conversations/add" \
     -H "Content-Type: application/json" \
     -d '{
       "convoID": "YOUR_CONVO_ID_HERE",
       "speaker": "user",
       "originalText": "నాకు తలనొప్పి ఉంది",
       "originalLanguage": "Telgu",
       "translatedText": "I have a headache",
       "translatedLanguage": "English",
       "translatedText_EN": "I have a headache",
       "translatedLanguage_EN": "English"
     }'
```

#### 4. Get Conversation
```bash
curl "http://localhost:8000/api/conversations/YOUR_CONVO_ID_HERE"
```

#### 5. Get All Conversations
```bash
curl "http://localhost:8000/api/conversations"

# With filters
curl "http://localhost:8000/api/conversations?userID=76712345&limit=10"
```

### Using Python requests
```python
import requests

# Create conversation
response = requests.post("http://localhost:8000/api/conversations/new", json={
    "userID": "76712345",
    "userLanguage": "Telgu", 
    "personLanguage": "English"
})
convo_data = response.json()
convo_id = convo_data["convoID"]

# Add message
requests.post("http://localhost:8000/api/conversations/add", json={
    "convoID": convo_id,
    "speaker": "user",
    "originalText": "నాకు తలనొప్పి ఉంది",
    "originalLanguage": "Telgu",
    "translatedText": "I have a headache",
    "translatedLanguage": "English",
    "translatedText_EN": "I have a headache",
    "translatedLanguage_EN": "English"
})

# Get conversation
conversation = requests.get(f"http://localhost:8000/api/conversations/{convo_id}")
print(conversation.json())
```

## 📁 Project Structure

```
database/
├── Dockerfile                  # Docker image for API server
├── requirements.txt           # Python dependencies
├── server.py                  # FastAPI application
└── README.md                  # This documentation
```

## 🔧 Development & Troubleshooting

### View Logs
```bash
# Server logs
docker logs megathon-server -f

# MongoDB logs
docker logs mongodb -f
```

### Restart Services
```bash
# Restart API server only
docker restart megathon-server

# Restart MongoDB
docker restart mongodb
```

### Database Connection Issues
```bash
# Check if containers are running
docker ps

# Test MongoDB connection
docker exec -it mongodb mongosh --eval "db.adminCommand('ping')"
```

### Reset Everything
```bash
# Stop and remove all containers
docker stop mongodb megathon-server
docker rm mongodb megathon-server

# Remove network (if created)
docker network rm megathon-network

# Start fresh
docker network create megathon-network
docker run -d --name mongodb --network megathon-network -p 27017:27017 mongo:7.0
docker run -p 8000:8000 --network megathon-network -e MONGODB_URL="mongodb://mongodb:27017/megathon_bhashini" megathon-server
```

## 🚀 Production Deployment

### Environment Variables
For production, set these environment variables:

```bash
# Use strong passwords  
MONGODB_URL=mongodb://secure_user:secure_password@mongodb:27017/megathon_bhashini?authSource=admin

# Production settings
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
```

### Security Considerations
- Change default database passwords
- Use HTTPS in production
- Implement authentication/authorization
- Add request rate limiting
- Enable database encryption at rest
- Regular backups

---

## 📝 API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/conversations/new` | POST | Create new conversation |
| `/api/conversations/add` | POST | Add message to conversation |
| `/api/conversations/{id}` | GET | Get specific conversation |
| `/api/conversations` | GET | Get all conversations (with filters) |
| `/api/conversations/{id}` | DELETE | Delete conversation |

---

*Built for Megathon Bhashini - Multilingual Healthcare Communication*