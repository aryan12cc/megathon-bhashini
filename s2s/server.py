#!/usr/bin/env python3
"""
S2S API Server
Simple Flask server that provides an endpoint for speech-to-speech translation
"""

import os
import tempfile
import shutil
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from s2s import S2SPipeline
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = '/tmp/s2s_uploads'
OUTPUT_FOLDER = '/tmp/s2s_outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'webm', 'ogg', 'm4a'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 's2s_api'
    })

@app.route('/save-audio', methods=['POST'])
def save_audio():
    """
    Save uploaded WAV audio file to the specified folder
    """
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({
                'error': 'No audio file provided'
            }), 400
        
        file = request.files['audio']
        speaker = request.form.get('speaker', 'unknown')
        save_location = request.form.get('saveLocation', 's2s')  # Default to s2s folder
        
        if file.filename == '':
            return jsonify({
                'error': 'No file selected'
            }), 400
        
        if file:
            # Get the base directory (megathon-bhashini folder)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            base_dir = os.path.dirname(current_dir)  # Go up one level from s2s
            
            # Determine save directory based on saveLocation parameter
            if save_location == 'samvaad':
                # Save in vaidhya-vaani-suite-main/src/pages/samvaad/
                save_dir = os.path.join(base_dir, 'vaidhya-vaani-suite-main', 'src', 'pages', 'samvaad')
            else:
                # Default: save in s2s directory
                save_dir = current_dir
            
            # Create directory if it doesn't exist
            os.makedirs(save_dir, exist_ok=True)
            
            # Create filename - keep it simple
            filename = secure_filename(file.filename)
            if not filename:
                filename = f"{speaker}_audio_{uuid.uuid4().hex[:8]}.mp3"
            
            # Save file in the specified directory
            file_path = os.path.join(save_dir, filename)
            
            # Save the file directly using werkzeug's save method
            file.save(file_path)
            
            # Verify the file was saved correctly
            file_size = os.path.getsize(file_path)
            
            return jsonify({
                'status': 'success',
                'message': f'Audio saved as {filename} in {save_location} folder',
                'file_path': file_path,
                'file_size': file_size,
                'save_location': save_location
            })
        
        return jsonify({
            'error': 'Invalid file'
        }), 400
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/s2s', methods=['POST'])
def speech_to_speech():
    """
    Process audio through S2S pipeline
    Expects: audio file, source_lang, dest_lang
    Returns: original_text, translated_text, audio_url
    """
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({
                'error': 'No audio file provided'
            }), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({
                'error': 'No file selected'
            }), 400
        
        # Get parameters
        source_lang = request.form.get('source_lang', 'english')
        dest_lang = request.form.get('dest_lang', 'hindi')
        
        if file and allowed_file(file.filename):
            # Save uploaded file
            filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())
            input_filename = f"{unique_id}_{filename}"
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], input_filename)
            file.save(input_path)
            
            try:
                # Initialize S2S pipeline
                pipeline = S2SPipeline(
                    source_lang=source_lang,
                    dest_lang=dest_lang,
                    chunk_duration=30,  # Process entire file as one chunk
                    overlap=0
                )
                
                # Run the pipeline
                result = pipeline.run(input_path)
                
                if result['status'] == 'success':
                    # Move output file to public folder
                    output_audio_path = result['data']['output_audio']
                    public_filename = f"{unique_id}_output.wav"
                    public_path = os.path.join(app.config['OUTPUT_FOLDER'], public_filename)
                    shutil.move(output_audio_path, public_path)
                    
                    # Create URL for audio file
                    audio_url = f"http://localhost:8001/audio/{public_filename}"
                    
                    return jsonify({
                        'status': 'success',
                        'original_text': result['data']['original_text'],
                        'translated_text': result['data']['translated_text'],
                        'audio_url': audio_url
                    })
                else:
                    return jsonify({
                        'error': result.get('message', 'S2S processing failed')
                    }), 500
                    
            finally:
                # Clean up input file
                if os.path.exists(input_path):
                    os.remove(input_path)
        
        return jsonify({
            'error': 'Invalid file type'
        }), 400
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/audio/<filename>')
def serve_audio(filename):
    """Serve audio files"""
    try:
        audio_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype='audio/wav')
        else:
            return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting S2S API Server on http://localhost:8001")
    app.run(host='0.0.0.0', port=8001, debug=True)