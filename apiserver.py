from flask import Flask, request, jsonify
import requests
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the current directory to Python path to import mapping
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tts.tts_mapping import mappings as tts_mappings
from mt.mt_mapping import mappings as mt_mappings

# Get the access token from environment variables
ACCESS_TOKEN = os.getenv('TOKEN')

if not ACCESS_TOKEN:
    raise ValueError("TOKEN not found in environment variables. Please check your .env file.")

app = Flask(__name__)

@app.route('/tts', methods=['POST'])
def tts_endpoint():
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
        
        # Get the TTS API URL for the specified language
        if language not in tts_mappings:
            return jsonify({
                "status": "error",
                "message": "Language not supported",
                "data": None,
                "error": f"Language '{language}' is not supported. Available languages: {list(tts_mappings.keys())}",
                "code": 400
            }), 400
        
        tts_api_url = tts_mappings[language]
        
        # Prepare the payload for the TTS API
        # Default gender to "female" if not provided
        gender = data.get('gender', 'female')
        
        tts_payload = {
            "text": text,
            "gender": gender
        }
        
        # Make the request to the TTS API
        try:
            # Prepare headers with access token
            headers = {
                'access-token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
            
            # Make request with SSL verification disabled to handle certificate issues
            response = requests.post(tts_api_url, json=tts_payload, headers=headers, timeout=30, verify=False)
            response.raise_for_status()
            
            # Return the response from the TTS API
            tts_response = response.json()
            return jsonify(tts_response), response.status_code
            
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

@app.route('/mt', methods=['POST'])
def mt_endpoint():
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
        
        # Create the mapping key for source,dest combination
        mapping_key = f"{source},{dest}"
        
        # Get the MT API URL for the specified source-destination pair
        if mapping_key not in mt_mappings:
            return jsonify({
                "status": "error",
                "message": "Translation pair not supported",
                "data": None,
                "error": f"Translation from '{source}' to '{dest}' is not supported. Available pairs: {list(mt_mappings.keys())}",
                "code": 400
            }), 400
        
        mt_api_url = mt_mappings[mapping_key]
        
        # Prepare the payload for the MT API
        mt_payload = {
            "input_text": text
        }
        
        # Make the request to the MT API
        try:
            # Prepare headers with access token
            headers = {
                'access-token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
            
            # Make request with SSL verification disabled to handle certificate issues
            response = requests.post(mt_api_url, json=mt_payload, headers=headers, timeout=30, verify=False)
            response.raise_for_status()
            
            # Return the response from the MT API
            mt_response = response.json()
            return jsonify(mt_response), response.status_code
            
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
    return jsonify({
        "status": "success",
        "message": "API server is running",
        "data": {
            "available_tts_languages": list(tts_mappings.keys()),
            "available_mt_pairs": list(mt_mappings.keys())
        },
        "error": None,
        "code": 200
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
