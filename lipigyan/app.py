"""
Simple Flask API for Document Processing
Uses existing OCR/MT API + Gemini summarization
"""
from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

from doc_ingestion.processor import DocumentProcessor

app = Flask(__name__)

# API server URL (where OCR/MT endpoints are running)
API_SERVER_URL = os.getenv('API_SERVER_URL', 'http://localhost:8005')


@app.route('/', methods=['GET'])
def home():
    """Health check"""
    return jsonify({
        "status": "success",
        "message": "Document Processing API (Lipi-Gyan Module)",
        "endpoints": {
            "POST /process_document": "Complete pipeline: OCR → MT → Gemini → MT"
        }
    })


@app.route('/process_document', methods=['POST'])
def process_document():
    """
    Process medical document: OCR → Translation → AI Summary → Translation back
    
    Form Data:
        - image_file (required): Medical document image
        - source_language (required): Document language (Hindi, Telugu, etc.)
        - target_language (optional): Output language (default: same as source)
        - document_type (optional): prescription/lab_report/discharge_summary
    
    Returns:
        {
            "ocr_text": "Original extracted text",
            "english_text": "Text in English",
            "summary_english": "AI-generated summary in English",
            "summary_native": "Summary in native language"
        }
    """
    try:
        # Validate file
        if 'image_file' not in request.files:
            return jsonify({
                "status": "error",
                "error": "image_file is required"
            }), 400
        
        image_file = request.files['image_file']
        if image_file.filename == '':
            return jsonify({
                "status": "error",
                "error": "No file selected"
            }), 400
        
        # Get parameters
        source_language = request.form.get('source_language')
        if not source_language:
            return jsonify({
                "status": "error",
                "error": "source_language is required"
            }), 400
        
        target_language = request.form.get('target_language', source_language)
        document_type = request.form.get('document_type')
        
        # Process document
        processor = DocumentProcessor(api_base_url=API_SERVER_URL)
        result = processor.process_document(
            image_file=image_file,
            source_language=source_language,
            target_language=target_language,
            document_type=document_type
        )
        
        if result["success"]:
            return jsonify({
                "status": "success",
                "data": {
                    "ocr_text": result["ocr_text"],
                    "english_text": result["english_text"],
                    "summary_english": result["summary_english"],
                    "summary_native": result["summary_native"],
                    "source_language": result["source_language"],
                    "target_language": result["target_language"]
                }
            }), 200
        else:
            return jsonify({
                "status": "error",
                "error": result.get("error", "Processing failed"),
                "steps": result.get("steps", {})
            }), 500
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Document Processing API (Lipi-Gyan Module)")
    print("="*60)
    print(f"Using API Server: {API_SERVER_URL}")
    print("\nEndpoints:")
    print("  POST /process_document - Process medical documents")
    print("  GET  /                 - Health check")
    print("\nStarting server on http://0.0.0.0:5001")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
