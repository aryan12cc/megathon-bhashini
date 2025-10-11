# Speech-to-Speech (S2S) Translation Pipeline

This module provides end-to-end speech-to-speech translation using API server endpoints instead of direct API calls.

## Features

- **Two Processing Modes**:
  - **Simple Mode**: Uses the API server's `/s2s` endpoint for quick processing
  - **Advanced Mode**: Chunks audio for better handling of long files with overlap processing

- **Audio Chunking**: Breaks long audio files into manageable chunks with configurable overlap
- **Silence Detection**: Smart boundary detection to avoid cutting words mid-sentence
- **Overlap Handling**: Merges overlapping text segments to ensure continuity
- **Error Handling**: Robust error handling for API failures and network issues

## Requirements

Install dependencies:
```bash
pip install -r requirements.txt
```

Make sure you have `ffmpeg` installed for audio processing:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

## Configuration

Create a `.env` file with:
```
TOKEN=your_api_token_here
API_SERVER_BASE_URL=http://localhost:8000
```

## Usage

### Simple Mode (Recommended for most cases)

```bash
python s2s.py --input input.wav --source en --dest hi --output output.wav --simple
```

### Advanced Mode (For long audio files)

```bash
python s2s.py --input input.wav --source en --dest hi --output output.wav --chunk-duration 6 --overlap 1
```

### Custom API Server

```bash
python s2s.py --input input.wav --source en --dest hi --output output.wav --simple --api-server http://localhost:8000
```

## Arguments

- `--input`: Input audio file path (required)
- `--source`: Source language code (required)
- `--dest`: Destination language code (required) 
- `--output`: Output audio file path (required)
- `--simple`: Use simple API server endpoint (faster, no chunking)
- `--chunk-duration`: Chunk duration in seconds (default: 6, advanced mode only)
- `--overlap`: Overlap duration in seconds (default: 1, advanced mode only)
- `--api-server`: API server base URL (default: http://localhost:8000)

## API Server Endpoints Used

- `GET /health`: Check available languages and server status
- `POST /asr`: Automatic Speech Recognition
- `POST /mt`: Machine Translation  
- `POST /tts`: Text-to-Speech
- `POST /s2s`: Complete Speech-to-Speech pipeline

## Processing Pipeline

### Simple Mode
1. Sends entire audio file to `/s2s` endpoint
2. API server handles ASR → MT → TTS internally
3. Downloads and saves final audio

### Advanced Mode  
1. **Audio Chunking**: Splits audio into overlapping segments
2. **ASR Processing**: Converts each chunk to text via `/asr`
3. **Text Merging**: Combines overlapping text segments intelligently
4. **Translation**: Translates merged text in 50-word chunks via `/mt`
5. **TTS Generation**: Converts translated text to speech via `/tts`
6. **Audio Combination**: Merges TTS chunks with crossfading

## Error Handling

- Validates language support via API server health endpoint
- Handles audio file size and duration constraints
- Provides detailed error messages for debugging
- Graceful fallback for API failures

## Supported Languages

Check available languages by running:
```bash
curl http://localhost:8000/health
```

## Example

```bash
# Simple processing
python s2s.py --input speech_en.wav --source en --dest hi --output speech_hi.wav --simple

# Advanced processing with custom settings
python s2s.py --input long_speech_en.wav --source en --dest hi --output long_speech_hi.wav --chunk-duration 8 --overlap 2
```