from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import sys
import os
import base64
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from ocr.ocr_mapping import mappings as ocr_mappings

# Bhashini API Configuration
BHASHINI_API_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
BHASHINI_API_KEY = "DveTyi8IJRxMNJdbUI0EhiE1X0yQYmoIiNLafiNLYbr4K0JCmDxFasFbOQQgkz7w"

# TTS Service ID mappings based on language groups
TTS_SERVICE_IDS = {
    # Indo-Aryan languages
    "as": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Assamese
    "bn": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Bengali
    "gu": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Gujarati
    "hi": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Hindi
    "mr": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Marathi
    "or": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Odia
    "pa": "ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4",  # Punjabi
    
    # Misc languages
    "brx": "ai4bharat/indic-tts-coqui-misc-gpu--t4",  # Bodo
    "en": "ai4bharat/indic-tts-coqui-misc-gpu--t4",   # English
    "mni": "ai4bharat/indic-tts-coqui-misc-gpu--t4",  # Manipuri
    
    # Dravidian languages
    "te": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4",  # Telugu
    "ta": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4",  # Tamil
    "ml": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4",  # Malayalam
    "kn": "ai4bharat/indic-tts-coqui-dravidian-gpu--t4",  # Kannada
}

# ASR Service ID mappings based on language groups
ASR_SERVICE_IDS = {
    # Indo-Aryan languages
    "bn": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Bengali
    "gu": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Gujarati
    "mr": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Marathi
    "or": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Odia
    "pa": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Punjabi
    "sa": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Sanskrit
    "ur": "ai4bharat/conformer-multilingual-indo_aryan-gpu--t4",  # Urdu
    
    # English
    "en": "ai4bharat/whisper-medium-en--gpu--t4",
    
    # Hindi
    "hi": "ai4bharat/conformer-hi-gpu--t4",
    
    # Dravidian languages
    "kn": "ai4bharat/conformer-multilingual-dravidian-gpu--t4",  # Kannada
    "ml": "ai4bharat/conformer-multilingual-dravidian-gpu--t4",  # Malayalam
    "ta": "ai4bharat/conformer-multilingual-dravidian-gpu--t4",  # Tamil
    "te": "ai4bharat/conformer-multilingual-dravidian-gpu--t4",  # Telugu
}

# OCR Service IDs based on modality
OCR_SERVICE_IDS = {
    "printed": "bhashini/iiith-bhasha-ocr",
    "scene": "bhashini/iiith-ocr-sceneText-all",
    "handwritten": "bhashini/iiith-ocr-hw-all"
}

# OCR Supported languages by modality
OCR_LANGUAGES = {
    "printed": ["as", "bn", "en", "gu", "hi", "kn", "ml", "mni", "mr", "or", "pa", "ta", "te", "ur"],
    "scene": ["as", "bn", "gu", "hi", "kn", "ml", "mni", "mr", "or", "pa", "ta", "te", "ur"],
    "handwritten": ["as", "bn", "en", "gu", "hi", "kn", "ml", "mni", "mr", "or", "pa", "ta", "te", "ur"]
}

# Supported languages for MT and ASR (all languages from the list)
SUPPORTED_LANGUAGES = [
    "en", "as", "bn", "brx", "doi", "gom", "gu", "hi", "kn", "ks",
    "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd",
    "ta", "te", "ur"
]

# Language name to code mapping (for frontend compatibility)
LANGUAGE_NAME_TO_CODE = {
    # English names (case-insensitive)
    "english": "en",
    "assamese": "as",
    "bengali": "bn",
    "bodo": "brx",
    "dogri": "doi",
    "konkani": "gom",
    "gujarati": "gu",
    "hindi": "hi",
    "kannada": "kn",
    "kashmiri": "ks",
    "maithili": "mai",
    "malayalam": "ml",
    "manipuri": "mni",
    "marathi": "mr",
    "nepali": "ne",
    "odia": "or",
    "punjabi": "pa",
    "sanskrit": "sa",
    "santali": "sat",
    "sindhi": "sd",
    "tamil": "ta",
    "telugu": "te",
    "urdu": "ur",
}

def normalize_language(lang: str) -> str:
    """
    Normalize language input - converts full language names to codes.
    Returns the language code if input is a name, or the original if already a code.
    """
    if not lang:
        return lang
    
    # If it's already a valid code, return it
    if lang.lower() in SUPPORTED_LANGUAGES:
        return lang.lower()
    
    # Try to convert from language name
    lang_lower = lang.lower()
    if lang_lower in LANGUAGE_NAME_TO_CODE:
        return LANGUAGE_NAME_TO_CODE[lang_lower]
    
    # Return original if no mapping found
    return lang

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/tts', methods=['POST'])
def tts_endpoint():
    """
    Text-to-Speech endpoint using Bhashini API.
    Expects JSON: {"text": "...", "Language": "...", "gender": "female/male" (optional)}
    Returns: Compatible response with audio_url field for frontend compatibility
    """
    try:
        # Get the request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No JSON data provided",
                "data": None,
                "error": "Missing request body",
                "code": 400
            }), 400
        
        # Validate required fields
        if 'text' not in data or 'Language' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required fields",
                "data": None,
                "error": "Both 'text' and 'Language' fields are required",
                "code": 400
            }), 400
        
        text = data['text']
        language = data['Language']
        gender = data.get('gender', 'female')
        speed = data.get('speed', 1.0)
        
        # Normalize language (convert from name to code if needed)
        language = normalize_language(language)
        
        # Validate language support
        if language not in TTS_SERVICE_IDS:
            return jsonify({
                "status": "error",
                "message": "Language not supported for TTS",
                "data": None,
                "error": f"Language '{language}' is not supported. Available languages: {list(TTS_SERVICE_IDS.keys())}",
                "code": 400
            }), 400
        
        # Get the appropriate service ID for the language
        service_id = TTS_SERVICE_IDS[language]
        
        # Prepare Bhashini API payload
        bhashini_payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {
                            "sourceLanguage": language
                        },
                        "serviceId": service_id,
                        "gender": gender,
                        "speed": speed,
                        "samplingRate": 48000
                    }
                }
            ],
            "inputData": {
                "input": [
                    {
                        "source": text
                    }
                ],
                "audio": [
                    {
                        "audioContent": None
                    }
                ]
            }
        }
        
        # Make the request to Bhashini API
        try:
            headers = {
                'Authorization': BHASHINI_API_KEY,
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                BHASHINI_API_URL,
                json=bhashini_payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            bhashini_response = response.json()
            
            # Extract base64 audio from response
            audio_base64 = None
            if 'pipelineResponse' in bhashini_response:
                for task_response in bhashini_response['pipelineResponse']:
                    if task_response.get('taskType') == 'tts' and 'audio' in task_response:
                        audio_list = task_response['audio']
                        if audio_list and len(audio_list) > 0:
                            audio_base64 = audio_list[0].get('audioContent')
                            break
            
            if not audio_base64:
                return jsonify({
                    "status": "error",
                    "message": "No audio generated",
                    "data": None,
                    "error": "Bhashini API did not return audio content",
                    "code": 502
                }), 502
            
            # Return response in format compatible with frontend
            return jsonify({
                "status": "success",
                "message": "TTS conversion successful",
                "data": {
                    "audio_base64": audio_base64,
                    "audio_url": f"data:audio/wav;base64,{audio_base64}",  # For direct playback
                    "language": language,
                    "text": text
                },
                "error": None,
                "code": 200
            }), 200
            
        except requests.exceptions.Timeout:
            return jsonify({
                "status": "error",
                "message": "TTS API request timed out",
                "data": None,
                "error": "The TTS service is taking too long to respond",
                "code": 504
            }), 504
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "Failed to connect to TTS API",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
            
        except ValueError as e:
            return jsonify({
                "status": "error",
                "message": "Invalid response from TTS API",
                "data": None,
                "error": "TTS API returned invalid JSON",
                "code": 502
            }), 502
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "data": None,
            "error": str(e),
            "code": 500
        }), 500

@app.route('/s2s', methods=['POST'])
def s2s_endpoint():
    """
    Speech-to-Speech endpoint: ASR -> MT -> TTS pipeline using Bhashini API
    Expects form-data: audio_file, source (language), dest (language)
    Returns: Translated audio in base64 format
    """
    try:
        # Check if audio file is present
        if 'audio_file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No audio file provided",
                "data": None,
                "error": "audio_file is required in form data",
                "code": 400
            }), 400
        
        audio_file = request.files['audio_file']
        
        # Check if file is selected
        if audio_file.filename == '':
            return jsonify({
                "status": "error",
                "message": "No file selected",
                "data": None,
                "error": "Please select an audio file",
                "code": 400
            }), 400
        
        # Get source and dest languages from form data
        source = request.form.get('source')
        dest = request.form.get('dest')
        
        if not source or not dest:
            return jsonify({
                "status": "error",
                "message": "Missing required fields",
                "data": None,
                "error": "Both 'source' and 'dest' fields are required",
                "code": 400
            }), 400
        
        # Normalize languages
        source = normalize_language(source)
        dest = normalize_language(dest)
        
        # Validate languages
        if source not in ASR_SERVICE_IDS:
            return jsonify({
                "status": "error",
                "message": "Source language not supported for ASR",
                "data": None,
                "error": f"ASR for language '{source}' is not supported. Available languages: {list(ASR_SERVICE_IDS.keys())}",
                "code": 400
            }), 400
        
        if source not in SUPPORTED_LANGUAGES or dest not in SUPPORTED_LANGUAGES:
            return jsonify({
                "status": "error",
                "message": "Language not supported for translation",
                "data": None,
                "error": f"Source or dest language not supported for MT",
                "code": 400
            }), 400
        
        if dest not in TTS_SERVICE_IDS:
            return jsonify({
                "status": "error",
                "message": "Destination language not supported for TTS",
                "data": None,
                "error": f"TTS for language '{dest}' is not supported. Available languages: {list(TTS_SERVICE_IDS.keys())}",
                "code": 400
            }), 400
        
        # Step 1: ASR - Convert audio to text
        try:
            # Convert audio file to base64
            audio_file.seek(0)
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            asr_service_id = ASR_SERVICE_IDS[source]
            
            asr_payload = {
                "pipelineTasks": [
                    {
                        "taskType": "asr",
                        "config": {
                            "language": {
                                "sourceLanguage": source
                            },
                            "serviceId": asr_service_id,
                            "audioFormat": "wav",
                            "samplingRate": 16000
                        }
                    }
                ],
                "inputData": {
                    "audio": [
                        {
                            "audioContent": audio_base64
                        }
                    ]
                }
            }
            
            headers = {
                'Authorization': BHASHINI_API_KEY,
                'Content-Type': 'application/json'
            }
            
            asr_response = requests.post(
                BHASHINI_API_URL,
                json=asr_payload,
                headers=headers,
                timeout=60
            )
            asr_response.raise_for_status()
            asr_result = asr_response.json()
            
            # Extract recognized text
            source_text = None
            if 'pipelineResponse' in asr_result:
                for task_response in asr_result['pipelineResponse']:
                    if task_response.get('taskType') == 'asr' and 'output' in task_response:
                        output_list = task_response['output']
                        if output_list and len(output_list) > 0:
                            source_text = output_list[0].get('source')
                            break
            
            if not source_text:
                return jsonify({
                    "status": "error",
                    "message": "ASR step failed",
                    "data": None,
                    "error": "Could not extract text from audio",
                    "code": 502
                }), 502
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "ASR step failed",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
        
        # Step 2: MT - Translate text
        try:
            mt_payload = {
                "pipelineTasks": [
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source,
                                "targetLanguage": dest
                            },
                            "serviceId": "ai4bharat/indictrans-v2-all-gpu--t4",
                            "numTranslation": "True"
                        }
                    }
                ],
                "inputData": {
                    "input": [
                        {
                            "source": source_text
                        }
                    ],
                    "audio": [
                        {
                            "audioContent": None
                        }
                    ]
                }
            }
            
            mt_response = requests.post(
                BHASHINI_API_URL,
                json=mt_payload,
                headers=headers,
                timeout=30
            )
            mt_response.raise_for_status()
            mt_result = mt_response.json()
            
            # Extract translated text
            translated_text = None
            if 'pipelineResponse' in mt_result:
                for task_response in mt_result['pipelineResponse']:
                    if task_response.get('taskType') == 'translation' and 'output' in task_response:
                        output_list = task_response['output']
                        if output_list and len(output_list) > 0:
                            translated_text = output_list[0].get('target')
                            break
            
            if not translated_text:
                return jsonify({
                    "status": "error",
                    "message": "MT step failed",
                    "data": None,
                    "error": "Could not translate text",
                    "code": 502
                }), 502
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "MT step failed",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
        
        # Step 3: TTS - Convert translated text to speech
        try:
            tts_service_id = TTS_SERVICE_IDS[dest]
            
            tts_payload = {
                "pipelineTasks": [
                    {
                        "taskType": "tts",
                        "config": {
                            "language": {
                                "sourceLanguage": dest
                            },
                            "serviceId": tts_service_id,
                            "gender": "female",
                            "speed": 1.0,
                            "samplingRate": 48000
                        }
                    }
                ],
                "inputData": {
                    "input": [
                        {
                            "source": translated_text
                        }
                    ],
                    "audio": [
                        {
                            "audioContent": None
                        }
                    ]
                }
            }
            
            tts_response = requests.post(
                BHASHINI_API_URL,
                json=tts_payload,
                headers=headers,
                timeout=30
            )
            tts_response.raise_for_status()
            tts_result = tts_response.json()
            
            # Extract audio
            audio_base64_out = None
            if 'pipelineResponse' in tts_result:
                for task_response in tts_result['pipelineResponse']:
                    if task_response.get('taskType') == 'tts' and 'audio' in task_response:
                        audio_list = task_response['audio']
                        if audio_list and len(audio_list) > 0:
                            audio_base64_out = audio_list[0].get('audioContent')
                            break
            
            if not audio_base64_out:
                return jsonify({
                    "status": "error",
                    "message": "TTS step failed",
                    "data": None,
                    "error": "Could not generate audio",
                    "code": 502
                }), 502
            
            # Return complete S2S result
            return jsonify({
                "status": "success",
                "message": "Speech-to-Speech conversion completed successfully",
                "data": {
                    "source_language": source,
                    "dest_language": dest,
                    "original_text": source_text,
                    "translated_text": translated_text,
                    "audio_base64": audio_base64_out,
                    "audio_url": f"data:audio/wav;base64,{audio_base64_out}"
                },
                "error": None,
                "code": 200
            }), 200
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "TTS step failed",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "data": None,
            "error": str(e),
            "code": 500
        }), 500

@app.route('/asr', methods=['POST'])
def asr_endpoint():
    """
    Automatic Speech Recognition endpoint using Bhashini API.
    Expects form-data with audio_file or JSON with audio_base64
    Returns: Compatible response with recognized_text field
    """
    try:
        language = None
        audio_base64 = None
        
        # Check if it's form data with file
        if 'audio_file' in request.files:
            audio_file = request.files['audio_file']
            
            if audio_file.filename == '':
                return jsonify({
                    "status": "error",
                    "message": "No file selected",
                    "data": None,
                    "error": "Please select an audio file",
                    "code": 400
                }), 400
            
            # Get language from form data
            language = request.form.get('Language')
            
            # Convert audio file to base64
            audio_file.seek(0)
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
        # Check if it's JSON with base64 audio
        elif request.is_json:
            data = request.get_json()
            audio_base64 = data.get('audio_base64') or data.get('audioContent')
            language = data.get('Language') or data.get('language')
        
        if not language:
            return jsonify({
                "status": "error",
                "message": "Missing required field",
                "data": None,
                "error": "Language field is required",
                "code": 400
            }), 400
        
        if not audio_base64:
            return jsonify({
                "status": "error",
                "message": "Missing audio data",
                "data": None,
                "error": "Either audio_file or audio_base64 is required",
                "code": 400
            }), 400
        
        # Normalize language
        language = normalize_language(language)
        
        # Validate language support for ASR
        if language not in ASR_SERVICE_IDS:
            return jsonify({
                "status": "error",
                "message": "Language not supported for ASR",
                "data": None,
                "error": f"Language '{language}' is not supported. Available languages: {list(ASR_SERVICE_IDS.keys())}",
                "code": 400
            }), 400
        
        # Validate base64 audio
        try:
            # Check if it's valid base64
            if ',' in audio_base64:
                # Remove data URL prefix if present
                audio_base64 = audio_base64.split(',')[1]
            
            # Try to decode to verify it's valid base64
            base64.b64decode(audio_base64[:100])  # Just check first 100 chars
        except Exception as base64_error:
            print(f"Invalid base64 audio: {base64_error}")
            return jsonify({
                "status": "error",
                "message": "Invalid audio data",
                "data": None,
                "error": f"Audio data is not valid base64: {str(base64_error)}",
                "code": 400
            }), 400
        
        # Get the appropriate service ID for the language
        service_id = ASR_SERVICE_IDS[language]
        
        # Prepare Bhashini API payload
        bhashini_payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {
                            "sourceLanguage": language
                        },
                        "serviceId": service_id,
                        "audioFormat": "wav",
                        "samplingRate": 16000
                    }
                }
            ],
            "inputData": {
                "audio": [
                    {
                        "audioContent": audio_base64
                    }
                ]
            }
        }
        
        # Make the request to Bhashini API
        try:
            headers = {
                'Authorization': BHASHINI_API_KEY,
                'Content-Type': 'application/json'
            }
            
            # Log request for debugging
            print(f"ASR Request - Language: {language}, Service ID: {service_id}")
            print(f"Audio Base64 length: {len(audio_base64)} chars")
            
            response = requests.post(
                BHASHINI_API_URL,
                json=bhashini_payload,
                headers=headers,
                timeout=60
            )
            
            # Log response status
            print(f"ASR Response Status: {response.status_code}")
            
            # Try to get response body even if there's an error
            try:
                bhashini_response = response.json()
                print(f"ASR Response: {bhashini_response}")
            except Exception as json_error:
                print(f"Failed to parse response JSON: {json_error}")
                print(f"Raw response text: {response.text[:500]}")
                return jsonify({
                    "status": "error",
                    "message": "Invalid response from ASR API",
                    "data": None,
                    "error": f"Failed to parse JSON: {str(json_error)}. Response: {response.text[:200]}",
                    "code": 502
                }), 502
            
            response.raise_for_status()
            
            # Extract recognized text from response
            recognized_text = None
            if 'pipelineResponse' in bhashini_response:
                for task_response in bhashini_response['pipelineResponse']:
                    if task_response.get('taskType') == 'asr' and 'output' in task_response:
                        output_list = task_response['output']
                        if output_list and len(output_list) > 0:
                            recognized_text = output_list[0].get('source')
                            break
            
            if not recognized_text:
                print(f"No text recognized in response: {bhashini_response}")
                return jsonify({
                    "status": "error",
                    "message": "No text recognized",
                    "data": None,
                    "error": f"Bhashini API did not return recognized text. Response: {bhashini_response}",
                    "code": 502
                }), 502
            
            # Return response in format compatible with frontend
            return jsonify({
                "status": "success",
                "message": "ASR conversion successful",
                "data": {
                    "recognized_text": recognized_text,
                    "language": language
                },
                "error": None,
                "code": 200
            }), 200
            
        except requests.exceptions.Timeout:
            print("ASR request timed out")
            return jsonify({
                "status": "error",
                "message": "ASR API request timed out",
                "data": None,
                "error": "The ASR service is taking too long to respond. Try with a shorter audio file.",
                "code": 504
            }), 504
            
        except requests.exceptions.RequestException as e:
            print(f"ASR request exception: {str(e)}")
            error_detail = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_json = e.response.json()
                    error_detail = f"{error_detail} - Response: {error_json}"
                except:
                    error_detail = f"{error_detail} - Response: {e.response.text[:200]}"
            
            return jsonify({
                "status": "error",
                "message": "Failed to connect to ASR API",
                "data": None,
                "error": error_detail,
                "code": 502
            }), 502
            
        except ValueError as e:
            return jsonify({
                "status": "error",
                "message": "Invalid response from ASR API",
                "data": None,
                "error": "ASR API returned invalid JSON",
                "code": 502
            }), 502
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "data": None,
            "error": str(e),
            "code": 500
        }), 500

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    try:
        # Check if image file is present
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No image file provided",
                "data": None,
                "error": "file is required in form data",
                "code": 400
            }), 400
        
        image_file = request.files['file']
        
        # Check if file is selected
        if image_file.filename == '':
            return jsonify({
                "status": "error",
                "message": "No file selected",
                "data": None,
                "error": "Please select an image file",
                "code": 400
            }), 400
        
        # Validate file format (jpg/png/jpeg)
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        file_extension = image_file.filename.rsplit('.', 1)[1].lower() if '.' in image_file.filename else ''
        if file_extension not in allowed_extensions:
            return jsonify({
                "status": "error",
                "message": "Invalid file format",
                "data": None,
                "error": f"File must be in jpg/png/jpeg format. Received: {file_extension}",
                "code": 400
            }), 400
        
        # Get language from form data or JSON
        language = request.form.get('Language')
        if not language:
            # Try to get from JSON if not in form data
            try:
                json_data = request.get_json()
                if json_data:
                    language = json_data.get('Language')
            except:
                pass
        
        if not language:
            return jsonify({
                "status": "error",
                "message": "Missing required field",
                "data": None,
                "error": "Language field is required",
                "code": 400
            }), 400
        
        # Get the OCR API URL for the specified language
        if language not in ocr_mappings:
            return jsonify({
                "status": "error",
                "message": "Language not supported",
                "data": None,
                "error": f"Language '{language}' is not supported. Available languages: {list(ocr_mappings.keys())}",
                "code": 400
            }), 400
        
        ocr_api_url = ocr_mappings[language]
        
        # Prepare the file for upload
        try:
            # Prepare headers with access token (don't include Content-Type for multipart)
            headers = {
                'access-token': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhlYTYyMjdiOTNlM2JlYzkwMWZkOGQ3Iiwicm9sZSI6Im1lZ2F0aG9uX3N0dWRlbnQifQ.tMn2kPuK7tI9pLjELAHqNXbzE3H1wJBFDKUPf6elww8"
            }
            
            # Prepare files for the request
            files = {
                'file': (image_file.filename, image_file.stream, image_file.content_type)
            }
            
            # Make request with SSL verification disabled to handle certificate issues
            response = requests.post(ocr_api_url, files=files, headers=headers, timeout=60, verify=False)
            response.raise_for_status()
            
            # Return the response from the OCR API
            ocr_response = response.json()
            return jsonify(ocr_response), response.status_code
            
        except requests.exceptions.Timeout:
            return jsonify({
                "status": "error",
                "message": "OCR API request timed out",
                "data": None,
                "error": "The OCR service is taking too long to respond",
                "code": 504
            }), 504
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "Failed to connect to OCR API",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
            
        except ValueError as e:
            return jsonify({
                "status": "error",
                "message": "Invalid response from OCR API",
                "data": None,
                "error": "OCR API returned invalid JSON",
                "code": 502
            }), 502
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "data": None,
            "error": str(e),
            "code": 500
        }), 500


@app.route('/mt', methods=['POST'])
def mt_endpoint():
    """
    Machine Translation endpoint using Bhashini API.
    Expects JSON: {"text": "...", "source": "...", "dest": "..."}
    Returns: Compatible response with output_text field for frontend compatibility
    """
    try:
        # Get the request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "No JSON data provided",
                "data": None,
                "error": "Missing request body",
                "code": 400
            }), 400
        
        # Validate required fields
        if 'text' not in data or 'source' not in data or 'dest' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required fields",
                "data": None,
                "error": "Fields 'text', 'source', and 'dest' are required",
                "code": 400
            }), 400
        
        text = data['text']
        source = data['source']
        dest = data['dest']
        
        # Normalize languages (convert from names to codes if needed)
        source = normalize_language(source)
        dest = normalize_language(dest)
        
        # Validate languages
        if source not in SUPPORTED_LANGUAGES:
            return jsonify({
                "status": "error",
                "message": "Source language not supported",
                "data": None,
                "error": f"Language '{source}' is not supported. Available languages: {SUPPORTED_LANGUAGES}",
                "code": 400
            }), 400
        
        if dest not in SUPPORTED_LANGUAGES:
            return jsonify({
                "status": "error",
                "message": "Destination language not supported",
                "data": None,
                "error": f"Language '{dest}' is not supported. Available languages: {SUPPORTED_LANGUAGES}",
                "code": 400
            }), 400
        
        # Prepare Bhashini API payload
        bhashini_payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source,
                            "targetLanguage": dest
                        },
                        "serviceId": "ai4bharat/indictrans-v2-all-gpu--t4",
                        "numTranslation": "True"
                    }
                }
            ],
            "inputData": {
                "input": [
                    {
                        "source": text
                    }
                ],
                "audio": [
                    {
                        "audioContent": None
                    }
                ]
            }
        }
        
        # Make the request to Bhashini API
        try:
            headers = {
                'Authorization': BHASHINI_API_KEY,
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                BHASHINI_API_URL,
                json=bhashini_payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            bhashini_response = response.json()
            
            # Extract translated text from response
            translated_text = None
            if 'pipelineResponse' in bhashini_response:
                for task_response in bhashini_response['pipelineResponse']:
                    if task_response.get('taskType') == 'translation' and 'output' in task_response:
                        output_list = task_response['output']
                        if output_list and len(output_list) > 0:
                            translated_text = output_list[0].get('target')
                            break
            
            if not translated_text:
                return jsonify({
                    "status": "error",
                    "message": "No translation generated",
                    "data": None,
                    "error": "Bhashini API did not return translated text",
                    "code": 502
                }), 502
            
            # Return response in format compatible with frontend
            return jsonify({
                "status": "success",
                "message": "Translation successful",
                "data": {
                    "output_text": translated_text,
                    "input_text": text,
                    "source_language": source,
                    "target_language": dest
                },
                "error": None,
                "code": 200
            }), 200
            
        except requests.exceptions.Timeout:
            return jsonify({
                "status": "error",
                "message": "MT API request timed out",
                "data": None,
                "error": "The MT service is taking too long to respond",
                "code": 504
            }), 504
            
        except requests.exceptions.RequestException as e:
            return jsonify({
                "status": "error",
                "message": "Failed to connect to MT API",
                "data": None,
                "error": str(e),
                "code": 502
            }), 502
            
        except ValueError as e:
            return jsonify({
                "status": "error",
                "message": "Invalid response from MT API",
                "data": None,
                "error": "MT API returned invalid JSON",
                "code": 502
            }), 502
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Internal server error",
            "data": None,
            "error": str(e),
            "code": 500
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint showing available services"""
    return jsonify({
        "status": "success",
        "message": "API server is running with Bhashini API",
        "data": {
            "available_tts_languages": list(TTS_SERVICE_IDS.keys()),
            "available_asr_languages": list(ASR_SERVICE_IDS.keys()),
            "available_mt_languages": SUPPORTED_LANGUAGES,
            "available_ocr_languages": {
                "printed": OCR_LANGUAGES["printed"],
                "scene": OCR_LANGUAGES["scene"],
                "handwritten": OCR_LANGUAGES["handwritten"]
            },
            "tts_service_groups": {
                "indo_aryan": ["as", "bn", "gu", "hi", "mr", "or", "pa"],
                "misc": ["brx", "en", "mni"],
                "dravidian": ["te", "ta", "ml", "kn"]
            },
            "asr_service_groups": {
                "indo_aryan_multilingual": ["bn", "gu", "mr", "or", "pa", "sa", "ur"],
                "english": ["en"],
                "hindi": ["hi"],
                "dravidian_multilingual": ["kn", "ml", "ta", "te"]
            },
            "api_version": "bhashini-v1-full",
            "endpoints": {
                "tts": "/tts - Text-to-Speech (14 languages)",
                "mt": "/mt - Machine Translation (all pairs)",
                "asr": "/asr - Automatic Speech Recognition (13 languages)",
                "ocr": "/ocr - Optical Character Recognition (3 modalities)",
                "s2s": "/s2s - Speech-to-Speech (full pipeline)"
            }
        },
        "error": None,
        "code": 200
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8005)
