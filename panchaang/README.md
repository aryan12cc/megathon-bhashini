# Panchaang (Calendar) - Voice-Powered Appointment Management with Google Calendar Integration

Panchaang is a voice-powered calendar/appointment management system that processes speech input to extract and manage appointment details. It uses a pipeline of ASR (Automatic Speech Recognition) → MT (Machine Translation) → Gemini AI for intelligent appointment processing, and automatically syncs appointments to Google Calendar.

## Features

- **Voice-to-Appointment Processing**: Upload audio files containing appointment details
- **Multi-language Support**: Supports multiple Indian languages via ASR and MT APIs
- **Intelligent Extraction**: Uses Google Gemini AI to extract structured appointment data
- **Google Calendar Integration**: Automatically creates, updates, and deletes events in Google Calendar
- **RESTful API**: Full CRUD operations for appointment management
- **Flexible Translation**: Handles translation between supported language pairs
- **Smart Date Processing**: Understands relative dates like "tomorrow", "next week"
- **Bulk Sync**: Sync all appointments to Google Calendar at once

## Architecture

```
Audio File (.wav) → ASR API → Text → MT API → English Text → Gemini AI → Structured Appointment Data
```

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   
   Update the following variables:
   - `TOKEN`: Your API server access token
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `API_SERVER_BASE_URL`: API server URL (default: http://localhost:7000)
   - `HARDCODED_USER_EMAIL`: Email address for Google Calendar (hardcoded for now)

3. **Google Calendar Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Calendar API
   - Create credentials (OAuth 2.0 Client ID) for a desktop application
   - Download the credentials JSON file and save it as `credentials.json` in the panchaang directory
   - The first time you run the service, it will open a browser for OAuth authentication

4. **Start the Service**:
   ```bash
   python panchaang.py
   ```
   
   The service will run on `http://localhost:5001`

## API Endpoints

### 1. Process Appointment Audio
**POST** `/process_appointment_audio`

Upload an audio file to extract appointment details.

**Form Data:**
- `audio_file`: WAV audio file
- `source_language`: Source language (e.g., "Hindi", "English")
- `target_language`: Target language for processing (optional, defaults to "English")

**Response:**
```json
{
  "status": "success",
  "data": {
    "recognized_text": "Original transcribed text",
    "processed_text": "Translated text (if translation occurred)",
    "appointment_details": {
      "is_appointment": true,
      "id": 1,
      "title": "Doctor Appointment",
      "description": "Consultation with Dr. Smith",
      "date": "2024-12-15",
      "time": "14:30",
      "duration": 60,
      "participants": ["Dr. Smith"],
      "location": "City Hospital",
      "priority": "high",
      "category": "medical",
      "reminders": "15 minutes before"
    }
  }
}
```

### 2. Get All Appointments
**GET** `/appointments`

Retrieve all appointments with optional filtering.

**Query Parameters:**
- `date`: Filter by date (YYYY-MM-DD)
- `category`: Filter by category (medical, meeting, personal, etc.)
- `priority`: Filter by priority (high, medium, low)

### 3. Get Specific Appointment
**GET** `/appointments/<id>`

Retrieve a specific appointment by ID.

### 4. Update Appointment
**PUT** `/appointments/<id>`

Update an existing appointment.

**JSON Body:**
```json
{
  "title": "Updated Title",
  "date": "2024-12-16",
  "priority": "high"
}
```

### 5. Delete Appointment
**DELETE** `/appointments/<id>`

Delete an appointment.

### 6. Create Appointment Manually
**POST** `/appointments/create`

Create a new appointment manually.

**JSON Body:**
```json
{
  "title": "Manual Appointment",
  "description": "Created manually",
  "date": "2024-12-15",
  "time": "10:00",
  "category": "meeting"
}
```

### 7. Get Supported Languages
**GET** `/supported_languages`

Get list of supported languages for ASR and MT.

### 8. Health Check
**GET** `/health`

Check service health and connectivity.

## Supported Languages

### ASR (Speech Recognition)
- Hindi, English, Telugu, Urdu, Marathi, Bengali, Kannada, Malayalam, Bhojpuri, Gujarati, Odia, Punjabi, Tamil, Sanskrit

### MT (Translation)
- Various language pairs including English-Hindi, Hindi-English, English-Telugu, etc.
- Check `/supported_languages` endpoint for complete list

## Usage Examples

### 1. Process Hindi Audio Appointment
```bash
curl -X POST http://localhost:5000/process_appointment_audio \
  -F "audio_file=@appointment.wav" \
  -F "source_language=Hindi" \
  -F "target_language=English"
```

### 2. Get Today's Appointments
```bash
curl "http://localhost:5000/appointments?date=2024-12-15"
```

### 3. Create Manual Appointment
```bash
curl -X POST http://localhost:5000/appointments/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly team sync",
    "date": "2024-12-16",
    "time": "15:00",
    "category": "meeting",
    "priority": "medium"
  }'
```

## Appointment Data Structure

Each appointment contains:
- `id`: Unique identifier
- `title`: Brief appointment title
- `description`: Detailed description
- `date`: Date in YYYY-MM-DD format
- `time`: Time in HH:MM format
- `duration`: Duration in minutes
- `participants`: List of participants
- `location`: Venue/location
- `priority`: high/medium/low
- `category`: meeting/medical/personal/work/social/other
- `reminders`: Reminder preferences
- `created_at`: Creation timestamp
- `source_language`: Original audio language
- `original_text`: Original transcribed text
- `processed_text`: Translated/processed text

## API Constraints

### Audio File Requirements
- Format: WAV files recommended
- Size: Reasonable file sizes for API processing
- Duration: Optimal results with clear, focused speech

### Language Support
- Depends on available ASR and MT models
- Some language pairs may require intermediate translation through English
- Check `/supported_languages` for current availability

### Rate Limits
- Inherits rate limits from underlying ASR/MT APIs
- Gemini AI has its own rate limits

## Error Handling

The service provides detailed error responses:
- `400`: Bad Request (missing parameters, invalid data)
- `404`: Not Found (appointment not found)
- `502`: Bad Gateway (upstream API failures)
- `500`: Internal Server Error

## Development

### Adding New Features
1. Extend the `AppointmentProcessor` class for new processing logic
2. Add new endpoints following the existing pattern
3. Update the appointment data structure as needed

### Database Integration
Currently uses in-memory storage. For production:
1. Replace `appointments_db` list with proper database
2. Add database models and ORM
3. Implement proper data persistence

### Testing
Create test cases for:
- Audio processing pipeline
- Appointment extraction accuracy
- API endpoint functionality
- Error handling scenarios

## Dependencies

- **Flask**: Web framework
- **requests**: HTTP client for API calls  
- **google-generativeai**: Gemini AI integration
- **python-dotenv**: Environment variable management
- **python-dateutil**: Date parsing and manipulation

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Update documentation for new features
4. Test with various languages and audio formats