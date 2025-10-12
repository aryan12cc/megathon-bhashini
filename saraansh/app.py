"""
Saraansh API - Clinical Transcript Processing Service
Endpoints:
  - /soap_notes - Generate SOAP notes from clinical transcripts
  - /action_items - Generate patient action items from consultations
"""
from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

from transcript_processor import TranscriptProcessor

app = Flask(__name__)

# API configuration
API_SERVER_URL = os.getenv('API_SERVER_URL', 'http://localhost:8000')


@app.route('/', methods=['GET'])
def home():
    """Health check and API info"""
    return jsonify({
        "status": "success",
        "message": "Saraansh - Clinical Transcript Processing API",
        "endpoints": {
            "POST /soap_notes": "Generate SOAP notes from clinical transcript",
            "POST /action_items": "Generate patient action items from consultation",
            "GET /": "Health check"
        },
        "supported_languages": [
            "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
            "Bengali", "Gujarati", "Marathi", "Punjabi", "Urdu", "Assamese",
            "Odia", "Sanskrit", "and 10 more Indian languages"
        ]
    })


@app.route('/soap_notes', methods=['POST'])
def generate_soap_notes():
    """
    Generate SOAP notes from clinical transcript
    
    Request Body (JSON):
    {
        "transcript": "Clinical transcript text",
        "source_language": "Hindi",
        "target_language": "Hindi"  // optional, defaults to source_language
    }
    
    Response:
    {
        "status": "success",
        "data": {
            "soap_notes_english": {
                "subjective": "...",
                "objective": "...",
                "assessment": "...",
                "plan": "..."
            },
            "soap_notes_native": {
                "subjective": "...",
                "objective": "...",
                "assessment": "...",
                "plan": "..."
            },
            "original_transcript": "...",
            "english_transcript": "...",
            "source_language": "Hindi",
            "target_language": "Hindi"
        }
    }
    """
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "error": "No JSON data provided"
            }), 400
        
        # Validate required fields
        transcript = data.get('transcript')
        source_language = data.get('source_language')
        
        if not transcript:
            return jsonify({
                "status": "error",
                "error": "transcript field is required"
            }), 400
        
        if not source_language:
            return jsonify({
                "status": "error",
                "error": "source_language field is required"
            }), 400
        
        target_language = data.get('target_language', source_language)
        
        # Process transcript
        processor = TranscriptProcessor(api_base_url=API_SERVER_URL)
        result = processor.process_clinical_transcript(
            transcript=transcript,
            source_language=source_language,
            target_language=target_language
        )
        
        if result["success"]:
            return jsonify({
                "status": "success",
                "data": {
                    "soap_notes_english": result["soap_notes_english"],
                    "soap_notes_native": result["soap_notes_native"],
                    "original_transcript": result["original_transcript"],
                    "english_transcript": result["english_transcript"],
                    "source_language": result["source_language"],
                    "target_language": result["target_language"],
                    "processing_type": result["processing_type"]
                }
            }), 200
        else:
            return jsonify({
                "status": "error",
                "error": result.get("error", "SOAP notes generation failed"),
                "steps": result.get("steps", {})
            }), 500
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


@app.route('/action_items', methods=['POST'])
def generate_action_items():
    """
    Generate patient action items from consultation transcript
    
    Request Body (JSON):
    {
        "transcript": "Patient consultation transcript text",
        "source_language": "Hindi",
        "target_language": "Hindi"  // optional, defaults to source_language
    }
    
    Response:
    {
        "status": "success",
        "data": {
            "action_items_english": {
                "medications": [...],
                "follow_up": {...},
                "lifestyle_changes": [...],
                "tests_procedures": [...],
                "precautions": [...],
                "summary": "..."
            },
            "action_items_native": "Formatted text in native language",
            "original_transcript": "...",
            "english_transcript": "...",
            "source_language": "Hindi",
            "target_language": "Hindi"
        }
    }
    """
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "error": "No JSON data provided"
            }), 400
        
        # Validate required fields
        transcript = data.get('transcript')
        source_language = data.get('source_language')
        
        if not transcript:
            return jsonify({
                "status": "error",
                "error": "transcript field is required"
            }), 400
        
        if not source_language:
            return jsonify({
                "status": "error",
                "error": "source_language field is required"
            }), 400
        
        target_language = data.get('target_language', source_language)
        
        # Process transcript
        processor = TranscriptProcessor(api_base_url=API_SERVER_URL)
        result = processor.process_patient_consultation(
            transcript=transcript,
            source_language=source_language,
            target_language=target_language
        )
        
        if result["success"]:
            return jsonify({
                "status": "success",
                "data": {
                    "action_items_english": result["action_items_english"],
                    "action_items_native": result["action_items_native"],
                    "original_transcript": result["original_transcript"],
                    "english_transcript": result["english_transcript"],
                    "source_language": result["source_language"],
                    "target_language": result["target_language"],
                    "processing_type": result["processing_type"]
                }
            }), 200
        else:
            return jsonify({
                "status": "error",
                "error": result.get("error", "Action items generation failed"),
                "steps": result.get("steps", {})
            }), 500
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Saraansh - Clinical Transcript Processing API")
    print("="*70)
    print(f"Using MT API Server: {API_SERVER_URL}")
    print("\nEndpoints:")
    print("  POST /soap_notes    - Generate SOAP notes from clinical transcript")
    print("  POST /action_items  - Generate patient action items")
    print("  GET  /              - Health check")
    print("\nStarting server on http://0.0.0.0:5003")
    print("="*70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5003)
