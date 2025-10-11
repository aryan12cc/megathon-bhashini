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

### Health Check - `/health`
**Method:** GET

Returns available languages/pairs for all services.