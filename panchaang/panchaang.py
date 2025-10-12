from flask import Flask, request, jsonify, send_file
import requests
import os
import sys
import tempfile
from datetime import datetime, timedelta
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai
from dateutil.parser import parse
from dateutil.relativedelta import relativedelta
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
import pickle

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
API_SERVER_BASE_URL = os.getenv('API_SERVER_BASE_URL', 'http://localhost:7000')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
TOKEN = os.getenv('TOKEN')

# Google Calendar Configuration
GOOGLE_CALENDAR_CREDENTIALS_FILE = os.getenv('GOOGLE_CALENDAR_CREDENTIALS_FILE', 'credentials.json')
GOOGLE_CALENDAR_TOKEN_FILE = os.getenv('GOOGLE_CALENDAR_TOKEN_FILE', 'token.pickle')
GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar']
HARDCODED_USER_EMAIL = os.getenv('HARDCODED_USER_EMAIL', 'user@example.com')  # Hardcoded for now

if not TOKEN:
    raise ValueError("TOKEN not found in environment variables. Please check your .env file.")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please check your .env file.")

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# In-memory storage for appointments (in production, use a proper database)
appointments_db = []

class AppointmentProcessor:
    """Handles appointment processing through ASR -> MT -> Gemini pipeline"""
    
    def __init__(self):
        self.supported_languages = self._get_supported_languages()
    
    def _get_supported_languages(self):
        """Get supported languages from API server"""
        try:
            response = requests.get(f"{API_SERVER_BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'asr': data['data']['available_asr_languages'],
                    'mt': data['data']['available_mt_pairs']
                }
        except Exception as e:
            print(f"Warning: Could not fetch supported languages: {e}")
        
        # Fallback defaults based on mapping files
        return {
            'asr': ["Hindi", "English", "Telugu", "Urdu", "Marathi", "Bengali", "Kannada", "Malayalam"],
            'mt': ["English,Hindi", "Hindi,English", "English,Telugu", "Telugu,English"]
        }
    
    def process_audio_to_text(self, audio_file, source_language):
        """Convert audio to text using ASR API"""
        if source_language not in self.supported_languages['asr']:
            raise ValueError(f"Source language '{source_language}' not supported for ASR")
        
        # Prepare the ASR request
        url = f"{API_SERVER_BASE_URL}/asr"
        headers = {'access-token': TOKEN}
        
        # Reset file pointer
        audio_file.seek(0)
        files = {'audio_file': (audio_file.filename, audio_file, audio_file.content_type)}
        data = {'Language': source_language}
        
        response = requests.post(url, files=files, data=data, headers=headers, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        
        # Extract text from response
        if 'data' in result and 'recognized_text' in result['data']:
            return result['data']['recognized_text']
        elif 'recognized_text' in result:
            return result['recognized_text']
        else:
            raise ValueError("Could not extract recognized text from ASR response")
    
    def translate_text(self, text, source_lang, target_lang):
        """Translate text using MT API"""
        mapping_key = f"{source_lang},{target_lang}"
        
        if mapping_key not in self.supported_languages['mt']:
            # If direct translation not available, check if we can go through English
            if source_lang != "English" and target_lang != "English":
                # Try source -> English -> target
                if f"{source_lang},English" in self.supported_languages['mt'] and f"English,{target_lang}" in self.supported_languages['mt']:
                    # First translate to English
                    english_text = self._translate_direct(text, source_lang, "English")
                    # Then translate to target
                    return self._translate_direct(english_text, "English", target_lang)
            
            raise ValueError(f"Translation from '{source_lang}' to '{target_lang}' not supported")
        
        return self._translate_direct(text, source_lang, target_lang)
    
    def _translate_direct(self, text, source_lang, target_lang):
        """Direct translation between two languages"""
        url = f"{API_SERVER_BASE_URL}/mt"
        headers = {
            'access-token': TOKEN,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'text': text,
            'source': source_lang,
            'dest': target_lang
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        # Extract translated text
        if 'data' in result and 'output_text' in result['data']:
            return result['data']['output_text']
        elif 'output_text' in result:
            return result['output_text']
        else:
            raise ValueError("Could not extract translated text from MT response")
    
    def extract_appointment_details(self, text):
        """Use Gemini to extract appointment details from text"""
        prompt = f"""
        Analyze the following text and extract appointment/calendar details. 
        Return the information in JSON format with the following fields:
        - title: Brief title of the appointment
        - description: Detailed description 
        - date: Date in YYYY-MM-DD format (if mentioned, otherwise null)
        - time: Time in HH:MM format (if mentioned, otherwise null) 
        - duration: Duration in minutes (if mentioned, otherwise 60)
        - participants: List of participants/attendees (if mentioned)
        - location: Location/venue (if mentioned)
        - priority: high/medium/low (based on context)
        - category: meeting/medical/personal/work/social/other
        - reminders: Any reminder preferences mentioned
        
        If the text doesn't contain appointment information, return {{"is_appointment": false}}.
        If it does contain appointment information, include {{"is_appointment": true}} in the response.
        
        Text to analyze: "{text}"
        
        Return only valid JSON, no other text.
        """
        
        try:
            response = gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean up the response to extract JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # Parse JSON response
            appointment_data = json.loads(response_text.strip())
            
            # Post-process dates if relative terms are used
            if appointment_data.get('is_appointment', False):
                appointment_data = self._process_relative_dates(appointment_data, text)
            
            return appointment_data
            
        except json.JSONDecodeError as e:
            # Fallback: Try to extract basic information using regex
            return self._fallback_appointment_extraction(text)
        except Exception as e:
            raise ValueError(f"Error processing with Gemini: {str(e)}")
    
    def _process_relative_dates(self, appointment_data, original_text):
        """Process relative date expressions like 'tomorrow', 'next week', etc."""
        text_lower = original_text.lower()
        today = datetime.now().date()
        
        # Handle relative dates
        if not appointment_data.get('date'):
            if 'tomorrow' in text_lower:
                appointment_data['date'] = (today + timedelta(days=1)).isoformat()
            elif 'today' in text_lower:
                appointment_data['date'] = today.isoformat()
            elif 'next week' in text_lower:
                appointment_data['date'] = (today + timedelta(weeks=1)).isoformat()
            elif 'next month' in text_lower:
                appointment_data['date'] = (today + relativedelta(months=1)).isoformat()
        
        return appointment_data
    
    def _fallback_appointment_extraction(self, text):
        """Fallback method to extract basic appointment info using regex"""
        # Basic patterns for time, date, etc.
        time_patterns = [
            r'\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b',
            r'\b(\d{1,2})\s*(am|pm|AM|PM)\b'
        ]
        
        date_patterns = [
            r'\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b',
            r'\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b'
        ]
        
        # Try to find time
        time_found = None
        for pattern in time_patterns:
            match = re.search(pattern, text)
            if match:
                time_found = match.group(0)
                break
        
        # Try to find date
        date_found = None
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_found = match.group(0)
                break
        
        # Check if this looks like an appointment
        appointment_keywords = ['appointment', 'meeting', 'schedule', 'book', 'visit', 'consultation']
        is_appointment = any(keyword in text.lower() for keyword in appointment_keywords)
        
        if is_appointment or time_found or date_found:
            return {
                "is_appointment": True,
                "title": "Appointment",
                "description": text[:100] + "..." if len(text) > 100 else text,
                "date": date_found,
                "time": time_found,
                "duration": 60,
                "participants": [],
                "location": None,
                "priority": "medium",
                "category": "other",
                "reminders": None
            }
        else:
            return {"is_appointment": False}

class GoogleCalendarService:
    """Handles Google Calendar operations"""
    
    def __init__(self):
        self.service = None
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Calendar API"""
        creds = None
        
        # Load existing token
        if os.path.exists(GOOGLE_CALENDAR_TOKEN_FILE):
            try:
                with open(GOOGLE_CALENDAR_TOKEN_FILE, 'rb') as token:
                    creds = pickle.load(token)
            except Exception as e:
                print(f"Error loading token: {e}")
        
        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    creds = None
            
            if not creds:
                if os.path.exists(GOOGLE_CALENDAR_CREDENTIALS_FILE):
                    try:
                        flow = InstalledAppFlow.from_client_secrets_file(
                            GOOGLE_CALENDAR_CREDENTIALS_FILE, GOOGLE_CALENDAR_SCOPES)
                        creds = flow.run_local_server(port=0)
                    except Exception as e:
                        print(f"Error with OAuth flow: {e}")
                        return
                else:
                    print(f"Credentials file not found: {GOOGLE_CALENDAR_CREDENTIALS_FILE}")
                    return
            
            # Save the credentials for the next run
            try:
                with open(GOOGLE_CALENDAR_TOKEN_FILE, 'wb') as token:
                    pickle.dump(creds, token)
            except Exception as e:
                print(f"Error saving token: {e}")
        
        if creds:
            try:
                self.service = build('calendar', 'v3', credentials=creds)
            except Exception as e:
                print(f"Error building calendar service: {e}")
    
    def is_authenticated(self):
        """Check if the service is properly authenticated"""
        return self.service is not None
    
    def create_calendar_event(self, appointment_data):
        """Create a calendar event from appointment data"""
        if not self.is_authenticated():
            raise ValueError("Google Calendar service not authenticated")
        
        # Build event data
        event = {
            'summary': appointment_data.get('title', 'Appointment'),
            'description': appointment_data.get('description', ''),
            'location': appointment_data.get('location', ''),
        }
        
        # Handle date and time
        start_datetime = self._build_datetime(
            appointment_data.get('date'), 
            appointment_data.get('time', '09:00')
        )
        
        if start_datetime:
            # Calculate end time based on duration
            duration_minutes = appointment_data.get('duration', 60)
            end_datetime = start_datetime + timedelta(minutes=duration_minutes)
            
            event['start'] = {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'UTC',
            }
            event['end'] = {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'UTC',
            }
        else:
            # All-day event if no time specified
            if appointment_data.get('date'):
                event['start'] = {'date': appointment_data['date']}
                event['end'] = {'date': appointment_data['date']}
            else:
                # Default to today if no date
                today = datetime.now().date().isoformat()
                event['start'] = {'date': today}
                event['end'] = {'date': today}
        
        # Add attendees
        participants = appointment_data.get('participants', [])
        if participants:
            event['attendees'] = [{'email': email} for email in participants if '@' in str(email)]
        
        # Add reminders based on priority
        priority = appointment_data.get('priority', 'medium')
        if priority == 'high':
            event['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 60},       # 1 hour before
                ],
            }
        elif priority == 'medium':
            event['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},       # 30 minutes before
                ],
            }
        else:  # low priority
            event['reminders'] = {'useDefault': True}
        
        try:
            # Create the event
            created_event = self.service.events().insert(calendarId='primary', body=event).execute()
            return {
                'calendar_event_id': created_event.get('id'),
                'calendar_event_link': created_event.get('htmlLink'),
                'status': 'created'
            }
        except Exception as e:
            raise ValueError(f"Failed to create calendar event: {str(e)}")
    
    def update_calendar_event(self, event_id, appointment_data):
        """Update an existing calendar event"""
        if not self.is_authenticated():
            raise ValueError("Google Calendar service not authenticated")
        
        try:
            # Get existing event
            existing_event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Update fields
            existing_event['summary'] = appointment_data.get('title', existing_event.get('summary'))
            existing_event['description'] = appointment_data.get('description', existing_event.get('description'))
            existing_event['location'] = appointment_data.get('location', existing_event.get('location'))
            
            # Update date/time if provided
            if appointment_data.get('date') or appointment_data.get('time'):
                start_datetime = self._build_datetime(
                    appointment_data.get('date'), 
                    appointment_data.get('time', '09:00')
                )
                
                if start_datetime:
                    duration_minutes = appointment_data.get('duration', 60)
                    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
                    
                    existing_event['start'] = {
                        'dateTime': start_datetime.isoformat(),
                        'timeZone': 'UTC',
                    }
                    existing_event['end'] = {
                        'dateTime': end_datetime.isoformat(),
                        'timeZone': 'UTC',
                    }
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary', 
                eventId=event_id, 
                body=existing_event
            ).execute()
            
            return {
                'calendar_event_id': updated_event.get('id'),
                'calendar_event_link': updated_event.get('htmlLink'),
                'status': 'updated'
            }
        except Exception as e:
            raise ValueError(f"Failed to update calendar event: {str(e)}")
    
    def delete_calendar_event(self, event_id):
        """Delete a calendar event"""
        if not self.is_authenticated():
            raise ValueError("Google Calendar service not authenticated")
        
        try:
            self.service.events().delete(calendarId='primary', eventId=event_id).execute()
            return {'status': 'deleted'}
        except Exception as e:
            raise ValueError(f"Failed to delete calendar event: {str(e)}")
    
    def _build_datetime(self, date_str, time_str):
        """Build datetime object from date and time strings"""
        if not date_str:
            return None
        
        try:
            # Parse date
            if isinstance(date_str, str):
                date_obj = datetime.fromisoformat(date_str).date()
            else:
                date_obj = date_str
            
            # Parse time
            if time_str:
                # Handle various time formats
                time_str = time_str.strip()
                if ':' in time_str:
                    # Handle HH:MM format
                    time_parts = time_str.replace('am', '').replace('pm', '').replace('AM', '').replace('PM', '').strip().split(':')
                    hour = int(time_parts[0])
                    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                    
                    # Handle AM/PM
                    if 'pm' in time_str.lower() and hour != 12:
                        hour += 12
                    elif 'am' in time_str.lower() and hour == 12:
                        hour = 0
                else:
                    # Handle simple hour format like "9am" or "14"
                    hour_str = time_str.replace('am', '').replace('pm', '').replace('AM', '').replace('PM', '').strip()
                    hour = int(hour_str)
                    minute = 0
                    
                    if 'pm' in time_str.lower() and hour != 12:
                        hour += 12
                    elif 'am' in time_str.lower() and hour == 12:
                        hour = 0
                
                return datetime.combine(date_obj, datetime.min.time().replace(hour=hour, minute=minute))
            else:
                # Default to 9 AM if no time specified
                return datetime.combine(date_obj, datetime.min.time().replace(hour=9, minute=0))
                
        except (ValueError, AttributeError) as e:
            print(f"Error parsing date/time: {e}")
            return None

# Initialize processor and calendar service
processor = AppointmentProcessor()
calendar_service = GoogleCalendarService()

@app.route('/process_appointment_audio', methods=['POST'])
def process_appointment_audio():
    """
    Process audio file to extract appointment details
    Expected form data:
    - audio_file: WAV audio file
    - source_language: Source language for ASR
    - target_language: Target language for translation (optional, defaults to English)
    """
    try:
        # Validate input
        if 'audio_file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No audio file provided",
                "error": "audio_file is required in form data",
                "code": 400
            }), 400
        
        audio_file = request.files['audio_file']
        if audio_file.filename == '':
            return jsonify({
                "status": "error", 
                "message": "No file selected",
                "error": "Please select an audio file",
                "code": 400
            }), 400
        
        source_language = request.form.get('source_language', 'English')
        target_language = request.form.get('target_language', 'English')
        
        # Step 1: Convert audio to text using ASR
        try:
            recognized_text = processor.process_audio_to_text(audio_file, source_language)
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "ASR processing failed",
                "error": str(e),
                "code": 502
            }), 502
        
        # Step 2: Translate if needed
        processed_text = recognized_text
        if source_language != target_language:
            try:
                processed_text = processor.translate_text(recognized_text, source_language, target_language)
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": "Translation failed",
                    "error": str(e),
                    "code": 502
                }), 502
        
        # Step 3: Extract appointment details using Gemini
        try:
            appointment_details = processor.extract_appointment_details(processed_text)
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Appointment extraction failed",
                "error": str(e), 
                "code": 502
            }), 502
        
        # Step 4: Save appointment if valid
        if appointment_details.get('is_appointment', False):
            appointment_id = len(appointments_db) + 1
            appointment_details['id'] = appointment_id
            appointment_details['created_at'] = datetime.now().isoformat()
            appointment_details['original_text'] = recognized_text
            appointment_details['processed_text'] = processed_text
            appointment_details['source_language'] = source_language
            
            # Step 5: Create Google Calendar event
            calendar_result = None
            if calendar_service.is_authenticated():
                try:
                    calendar_result = calendar_service.create_calendar_event(appointment_details)
                    appointment_details['calendar_event_id'] = calendar_result.get('calendar_event_id')
                    appointment_details['calendar_event_link'] = calendar_result.get('calendar_event_link')
                    appointment_details['calendar_status'] = 'synced'
                except Exception as e:
                    appointment_details['calendar_status'] = f'failed: {str(e)}'
                    print(f"Failed to create calendar event: {e}")
            else:
                appointment_details['calendar_status'] = 'not_authenticated'
            
            appointments_db.append(appointment_details)
        
        return jsonify({
            "status": "success",
            "message": "Audio processed successfully",
            "data": {
                "recognized_text": recognized_text,
                "processed_text": processed_text,
                "appointment_details": appointment_details,
                "source_language": source_language,
                "target_language": target_language
            },
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments', methods=['GET'])
def get_appointments():
    """Get all appointments with optional filtering"""
    try:
        # Optional query parameters for filtering
        date_filter = request.args.get('date')  # YYYY-MM-DD format
        category_filter = request.args.get('category')
        priority_filter = request.args.get('priority')
        
        filtered_appointments = appointments_db.copy()
        
        # Apply filters
        if date_filter:
            filtered_appointments = [apt for apt in filtered_appointments 
                                   if apt.get('date') == date_filter]
        
        if category_filter:
            filtered_appointments = [apt for apt in filtered_appointments 
                                   if apt.get('category') == category_filter]
        
        if priority_filter:
            filtered_appointments = [apt for apt in filtered_appointments 
                                   if apt.get('priority') == priority_filter]
        
        return jsonify({
            "status": "success",
            "message": f"Found {len(filtered_appointments)} appointments",
            "data": {
                "appointments": filtered_appointments,
                "total": len(filtered_appointments)
            },
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve appointments",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    """Get specific appointment by ID"""
    try:
        appointment = next((apt for apt in appointments_db if apt['id'] == appointment_id), None)
        
        if not appointment:
            return jsonify({
                "status": "error",
                "message": "Appointment not found",
                "error": f"No appointment with ID {appointment_id}",
                "code": 404
            }), 404
        
        return jsonify({
            "status": "success",
            "message": "Appointment found",
            "data": appointment,
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve appointment",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    """Update an existing appointment"""
    try:
        appointment = next((apt for apt in appointments_db if apt['id'] == appointment_id), None)
        
        if not appointment:
            return jsonify({
                "status": "error",
                "message": "Appointment not found",
                "error": f"No appointment with ID {appointment_id}",
                "code": 404
            }), 404
        
        # Get update data
        update_data = request.get_json()
        if not update_data:
            return jsonify({
                "status": "error",
                "message": "No update data provided",
                "error": "Request body must contain JSON data",
                "code": 400
            }), 400
        
        # Update allowed fields
        allowed_fields = ['title', 'description', 'date', 'time', 'duration', 
                         'participants', 'location', 'priority', 'category', 'reminders']
        
        for field in allowed_fields:
            if field in update_data:
                appointment[field] = update_data[field]
        
        appointment['updated_at'] = datetime.now().isoformat()
        
        # Update Google Calendar event if it exists
        if appointment.get('calendar_event_id') and calendar_service.is_authenticated():
            try:
                calendar_result = calendar_service.update_calendar_event(
                    appointment['calendar_event_id'], 
                    appointment
                )
                appointment['calendar_status'] = 'synced'
                appointment['calendar_event_link'] = calendar_result.get('calendar_event_link')
            except Exception as e:
                appointment['calendar_status'] = f'update_failed: {str(e)}'
                print(f"Failed to update calendar event: {e}")
        
        return jsonify({
            "status": "success",
            "message": "Appointment updated successfully",
            "data": appointment,
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to update appointment",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """Delete an appointment"""
    try:
        appointment = next((apt for apt in appointments_db if apt['id'] == appointment_id), None)
        
        if not appointment:
            return jsonify({
                "status": "error",
                "message": "Appointment not found",
                "error": f"No appointment with ID {appointment_id}",
                "code": 404
            }), 404
        
        # Delete Google Calendar event if it exists
        if appointment.get('calendar_event_id') and calendar_service.is_authenticated():
            try:
                calendar_service.delete_calendar_event(appointment['calendar_event_id'])
            except Exception as e:
                print(f"Failed to delete calendar event: {e}")
        
        appointments_db.remove(appointment)
        
        return jsonify({
            "status": "success",
            "message": "Appointment deleted successfully",
            "data": {"deleted_id": appointment_id},
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to delete appointment",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments/create', methods=['POST'])
def create_appointment():
    """Create a new appointment manually"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided",
                "error": "Request body must contain JSON data",
                "code": 400
            }), 400
        
        # Validate required fields
        if 'title' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required field",
                "error": "title is required",
                "code": 400
            }), 400
        
        # Create new appointment
        appointment_id = len(appointments_db) + 1
        appointment = {
            'id': appointment_id,
            'title': data['title'],
            'description': data.get('description', ''),
            'date': data.get('date'),
            'time': data.get('time'),
            'duration': data.get('duration', 60),
            'participants': data.get('participants', []),
            'location': data.get('location'),
            'priority': data.get('priority', 'medium'),
            'category': data.get('category', 'other'),
            'reminders': data.get('reminders'),
            'is_appointment': True,
            'created_at': datetime.now().isoformat(),
            'source': 'manual'
        }
        
        # Create Google Calendar event
        if calendar_service.is_authenticated():
            try:
                calendar_result = calendar_service.create_calendar_event(appointment)
                appointment['calendar_event_id'] = calendar_result.get('calendar_event_id')
                appointment['calendar_event_link'] = calendar_result.get('calendar_event_link')
                appointment['calendar_status'] = 'synced'
            except Exception as e:
                appointment['calendar_status'] = f'failed: {str(e)}'
                print(f"Failed to create calendar event: {e}")
        else:
            appointment['calendar_status'] = 'not_authenticated'
        
        appointments_db.append(appointment)
        
        return jsonify({
            "status": "success",
            "message": "Appointment created successfully",
            "data": appointment,
            "code": 201
        }), 201
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to create appointment",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/appointments/<int:appointment_id>/sync_calendar', methods=['POST'])
def sync_appointment_to_calendar(appointment_id):
    """Manually sync an appointment to Google Calendar"""
    try:
        appointment = next((apt for apt in appointments_db if apt['id'] == appointment_id), None)
        
        if not appointment:
            return jsonify({
                "status": "error",
                "message": "Appointment not found",
                "error": f"No appointment with ID {appointment_id}",
                "code": 404
            }), 404
        
        if not calendar_service.is_authenticated():
            return jsonify({
                "status": "error",
                "message": "Google Calendar not authenticated",
                "error": "Please set up Google Calendar credentials",
                "code": 401
            }), 401
        
        # Create or update calendar event
        try:
            if appointment.get('calendar_event_id'):
                # Update existing event
                calendar_result = calendar_service.update_calendar_event(
                    appointment['calendar_event_id'], 
                    appointment
                )
            else:
                # Create new event
                calendar_result = calendar_service.create_calendar_event(appointment)
                appointment['calendar_event_id'] = calendar_result.get('calendar_event_id')
            
            appointment['calendar_event_link'] = calendar_result.get('calendar_event_link')
            appointment['calendar_status'] = 'synced'
            appointment['last_synced'] = datetime.now().isoformat()
            
            return jsonify({
                "status": "success",
                "message": "Appointment synced to Google Calendar successfully",
                "data": {
                    "appointment": appointment,
                    "calendar_result": calendar_result
                },
                "code": 200
            }), 200
            
        except Exception as e:
            appointment['calendar_status'] = f'sync_failed: {str(e)}'
            return jsonify({
                "status": "error",
                "message": "Failed to sync appointment to calendar",
                "error": str(e),
                "code": 502
            }), 502
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/calendar/authenticate', methods=['GET'])
def calendar_authenticate():
    """Get Google Calendar authentication status"""
    try:
        is_authenticated = calendar_service.is_authenticated()
        
        return jsonify({
            "status": "success",
            "message": "Calendar authentication status retrieved",
            "data": {
                "is_authenticated": is_authenticated,
                "credentials_file_exists": os.path.exists(GOOGLE_CALENDAR_CREDENTIALS_FILE),
                "token_file_exists": os.path.exists(GOOGLE_CALENDAR_TOKEN_FILE),
                "hardcoded_user_email": HARDCODED_USER_EMAIL
            },
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to check authentication status",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/calendar/bulk_sync', methods=['POST'])
def bulk_sync_appointments():
    """Sync all appointments to Google Calendar"""
    try:
        if not calendar_service.is_authenticated():
            return jsonify({
                "status": "error",
                "message": "Google Calendar not authenticated",
                "error": "Please set up Google Calendar credentials",
                "code": 401
            }), 401
        
        sync_results = []
        for appointment in appointments_db:
            if appointment.get('is_appointment', False):
                try:
                    if appointment.get('calendar_event_id'):
                        # Update existing event
                        calendar_result = calendar_service.update_calendar_event(
                            appointment['calendar_event_id'], 
                            appointment
                        )
                    else:
                        # Create new event
                        calendar_result = calendar_service.create_calendar_event(appointment)
                        appointment['calendar_event_id'] = calendar_result.get('calendar_event_id')
                    
                    appointment['calendar_event_link'] = calendar_result.get('calendar_event_link')
                    appointment['calendar_status'] = 'synced'
                    appointment['last_synced'] = datetime.now().isoformat()
                    
                    sync_results.append({
                        'appointment_id': appointment['id'],
                        'status': 'success',
                        'calendar_event_id': calendar_result.get('calendar_event_id')
                    })
                    
                except Exception as e:
                    appointment['calendar_status'] = f'sync_failed: {str(e)}'
                    sync_results.append({
                        'appointment_id': appointment['id'],
                        'status': 'failed',
                        'error': str(e)
                    })
        
        successful_syncs = len([r for r in sync_results if r['status'] == 'success'])
        failed_syncs = len([r for r in sync_results if r['status'] == 'failed'])
        
        return jsonify({
            "status": "success",
            "message": f"Bulk sync completed: {successful_syncs} successful, {failed_syncs} failed",
            "data": {
                "sync_results": sync_results,
                "summary": {
                    "total_appointments": len(sync_results),
                    "successful_syncs": successful_syncs,
                    "failed_syncs": failed_syncs
                }
            },
            "code": 200
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Bulk sync failed",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/supported_languages', methods=['GET'])
def get_supported_languages():
    """Get supported languages for ASR and MT"""
    try:
        return jsonify({
            "status": "success",
            "message": "Supported languages retrieved",
            "data": processor.supported_languages,
            "code": 200
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve supported languages",
            "error": str(e),
            "code": 500
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test API server connectivity
        api_server_status = "unknown"
        try:
            response = requests.get(f"{API_SERVER_BASE_URL}/health", timeout=5)
            api_server_status = "connected" if response.status_code == 200 else "error"
        except:
            api_server_status = "disconnected"
        
        # Test Gemini connectivity
        gemini_status = "connected" if GEMINI_API_KEY else "not_configured"
        
        # Test Google Calendar connectivity
        calendar_status = "connected" if calendar_service.is_authenticated() else "not_authenticated"
        
        # Count appointments with calendar events
        synced_appointments = len([apt for apt in appointments_db if apt.get('calendar_event_id')])
        
        return jsonify({
            "status": "success",
            "message": "Panchaang calendar service is running",
            "data": {
                "service": "Panchaang (Calendar with Google Calendar Integration)",
                "version": "1.0.0",
                "api_server_status": api_server_status,
                "api_server_url": API_SERVER_BASE_URL,
                "gemini_status": gemini_status,
                "google_calendar_status": calendar_status,
                "hardcoded_user_email": HARDCODED_USER_EMAIL,
                "total_appointments": len(appointments_db),
                "synced_appointments": synced_appointments,
                "supported_languages": processor.supported_languages
            },
            "code": 200
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Health check failed",
            "error": str(e),
            "code": 500
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
