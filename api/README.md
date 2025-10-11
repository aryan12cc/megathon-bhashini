# megathon-bhashini

## API Routes

### 1. Text-to-Speech (TTS) - `/tts`
**Method:** POST  
**Content-Type:** application/json

**Request Body:**
```json
{
    "text": "Hello, how are you?",
    "Language": "English"
}
```

### 2. Machine Translation (MT) - `/mt`
**Method:** POST  
**Content-Type:** application/json

**Request Body:**
```json
{
    "text": "Hello, how are you?",
    "source": "English",
    "dest": "Hindi"
}
```

### 3. Audio Speech Recognition (ASR) - `/asr`
**Method:** POST  
**Content-Type:** multipart/form-data

**Form Data:**
- `audio_file`: WAV audio file
- `Language`: "English" (can be in form data or JSON)

### 4. Optical Character Recognition (OCR) - `/ocr`
**Method:** POST  
**Content-Type:** multipart/form-data

**Form Data:**
- `file`: Image file (JPG/PNG/JPEG format)
- `Language`: "English" (can be in form data or JSON)

### 5. Speech-to-Speech (S2S) - `/s2s`
**Method:** POST  
**Content-Type:** multipart/form-data

**Form Data:**
- `audio_file`: WAV audio file
- `source`: "English" (source language for ASR)
- `dest`: "Hindi" (destination language for TTS)

*Combines ASR → MT → TTS: Converts speech to text, translates it, then converts back to speech*

### Health Check - `/health`
**Method:** GET

Returns available languages/pairs for all services.

## API Constraints

1. **MT (Machine Translation)**: Maximum of 50 words
2. **ASR (Audio Speech Recognition)**: 
   - Audio limit: ~20 seconds
   - File size: Below 5MB
   - Format: WAV (recommended for clarity)
3. **TTS (Text to Speech)**: 
   - Maximum of 30 words
   - No special characters allowed
4. **OCR (Optical Character Recognition)**:
   - File size: Below 5MB
   - Formats: JPG or PNG