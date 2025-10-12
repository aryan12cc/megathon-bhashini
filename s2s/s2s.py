#!/usr/bin/env python3
"""
Speech-to-Speech (S2S) End-to-End Pipeline
Processes audio streams by chunking, ASR, MT, and TTS with overlap handling
Uses API server endpoints instead of direct API calls
"""

import argparse
import os
import sys
import tempfile
import subprocess
import shutil
from typing import List, Tuple, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the API server base URL from environment variables
API_SERVER_BASE_URL = os.getenv('API_SERVER_BASE_URL', 'http://localhost:8000')

class AudioChunk:
    """Represents an audio chunk with metadata"""
    def __init__(self, file_path: str, start_time: float, end_time: float, chunk_id: int):
        self.file_path = file_path
        self.start_time = start_time
        self.end_time = end_time
        self.chunk_id = chunk_id
        self.text = ""
        self.translated_text = ""
        self.tts_audio_path = None

class S2SPipeline:
    """End-to-end Speech-to-Speech Pipeline"""
    
    def __init__(self, source_lang: str, dest_lang: str, chunk_duration: int = 6, overlap: int = 0.1):
        self.source_lang = source_lang
        self.dest_lang = dest_lang
        self.chunk_duration = chunk_duration * 1000  # Convert to milliseconds
        self.overlap = overlap * 1000  # Convert to milliseconds
        self.chunks: List[AudioChunk] = []
        self.original_text = ""
        self.translated_text = ""
        
        # Validate language mappings
        self._validate_languages()
        
    def _validate_languages(self):
        """Validate that required language mappings exist by checking API server health endpoint"""
        health_url = f"{API_SERVER_BASE_URL}/health"
        response = requests.get(health_url, timeout=10)
        health_data = response.json()
        
        data = health_data.get('data', {})
        available_asr = data.get('available_asr_languages', [])
        available_mt = data.get('available_mt_pairs', [])
        available_tts = data.get('available_tts_languages', [])
        
        mt_key = f"{self.source_lang},{self.dest_lang}"
        
        print(f"Available ASR: {available_asr}")
        print(f"Available MT: {available_mt}")
        print(f"Available TTS: {available_tts}")
    
    def get_audio_duration(self, audio_file_path: str) -> float:
        """Get audio duration using ffprobe"""
        cmd = [
            'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', audio_file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return float(result.stdout.strip())

    def chunk_audio_with_overlap(self, audio_file_path: str) -> List[AudioChunk]:
        """
        Chunk audio into overlapping segments using ffmpeg
        """
        print(f"Loading audio file: {audio_file_path}")
        
        # Get audio duration
        total_duration = self.get_audio_duration(audio_file_path)
        print(f"Audio duration: {total_duration:.2f} seconds")
        print(f"Chunking with {self.chunk_duration/1000}s duration and {self.overlap/1000}s overlap")
        
        chunks = []
        chunk_id = 0
        current_pos = 0
        
        while current_pos < total_duration * 1000:  # Convert to milliseconds
            # Calculate chunk boundaries
            chunk_end = min(current_pos + self.chunk_duration, total_duration * 1000)
            
            # Create temporary file for this chunk
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_file.close()
            
            # Extract chunk using ffmpeg
            start_seconds = current_pos / 1000.0
            duration_seconds = (chunk_end - current_pos) / 1000.0
            
            cmd = [
                'ffmpeg', '-i', audio_file_path, '-ss', str(start_seconds),
                '-t', str(duration_seconds), '-acodec', 'pcm_s16le',
                '-ar', '16000', '-ac', '1', '-y', temp_file.name
            ]
            
            subprocess.run(cmd, capture_output=True)
            
            # Create AudioChunk object
            chunk = AudioChunk(
                file_path=temp_file.name,
                start_time=current_pos / 1000.0,
                end_time=chunk_end / 1000.0,
                chunk_id=chunk_id
            )
            chunks.append(chunk)
            
            print(f"Created chunk {chunk_id}: {chunk.start_time:.2f}s - {chunk.end_time:.2f}s")
            
            # Move to next position with overlap
            current_pos = chunk_end - self.overlap
            chunk_id += 1
            
            # Break if we've reached the end
            if chunk_end >= total_duration * 1000:
                break
        
        self.chunks = chunks
        return chunks
    
    def process_asr(self, chunk: AudioChunk) -> str:
        """
        Process audio chunk through ASR API server endpoint
        """
        print(f"Processing ASR for chunk {chunk.chunk_id}")
        
        asr_api_url = f"{API_SERVER_BASE_URL}/asr"
        
        with open(chunk.file_path, 'rb') as audio_file:
            files = {
                'audio_file': (f'chunk_{chunk.chunk_id}.wav', audio_file, 'audio/wav')
            }
            data = {
                'Language': self.source_lang
            }
            
            response = requests.post(asr_api_url, files=files, data=data, timeout=60)
            asr_result = response.json()
            
            # Extract text from ASR response
            if asr_result.get('status') == 'success' and 'data' in asr_result:
                if 'recognized_text' in asr_result['data']:
                    text = asr_result['data']['recognized_text']
                else:
                    text = ""
            elif 'recognized_text' in asr_result:
                text = asr_result['recognized_text']
            else:
                print(f"Warning: Unexpected ASR response format for chunk {chunk.chunk_id}")
                print(f"Response: {asr_result}")
                text = ""
            
            chunk.text = text
            print(f"ASR result for chunk {chunk.chunk_id}: '{text}'")
            
        return text
    
    def merge_overlapping_text(self, chunks: List[AudioChunk]) -> str:
        """
        Merge text from overlapping chunks, removing duplicates
        """
        print("Merging overlapping text from chunks")
        
        if not chunks:
            return ""
        
        if len(chunks) == 1:
            return chunks[0].text
        
        merged_text = chunks[0].text
        
        for i in range(1, len(chunks)):
            current_text = chunks[i].text
            if not current_text:
                continue
            
            # Find overlap between previous merged text and current chunk text
            overlap_text = self._find_text_overlap(merged_text, current_text)
            
            if overlap_text:
                # Remove overlap from current text and append the rest
                overlap_pos = current_text.find(overlap_text)
                if overlap_pos >= 0:
                    remaining_text = current_text[overlap_pos + len(overlap_text):].strip()
                    if remaining_text:
                        merged_text += " " + remaining_text
                else:
                    merged_text += " " + current_text
            else:
                # No overlap found, just concatenate
                merged_text += " " + current_text
        
        print(f"Merged text: '{merged_text}'")
        return merged_text.strip()
    
    def _find_text_overlap(self, text1: str, text2: str) -> str:
        """
        Find overlapping text between two strings
        """
        if not text1 or not text2:
            return ""
        
        # Split into words for better matching
        words1 = text1.split()
        words2 = text2.split()
        
        # Look for the longest matching suffix of text1 with prefix of text2
        max_overlap = ""
        
        for i in range(1, min(len(words1), len(words2)) + 1):
            suffix = " ".join(words1[-i:])
            prefix = " ".join(words2[:i])
            
            if suffix.lower() == prefix.lower():
                max_overlap = suffix
        
        return max_overlap
    
    def translate_text_chunks(self, text: str) -> List[str]:
        """
        Translate text by chunking it into 50-word segments and translating each chunk
        """
        if not text.strip():
            return []
        
        # Split text into 50-word chunks
        words = text.split()
        text_chunks = []
        
        for i in range(0, len(words), 50):
            chunk = " ".join(words[i:i+50])
            text_chunks.append(chunk)
        
        print(f"Split text into {len(text_chunks)} chunks for translation")
        
        translated_chunks = []
        mt_api_url = f"{API_SERVER_BASE_URL}/mt"
        
        for i, chunk in enumerate(text_chunks):
            print(f"Translating chunk {i+1}/{len(text_chunks)}: '{chunk}'")
            
            payload = {
                "text": chunk,
                "source": self.source_lang,
                "dest": self.dest_lang
            }
            headers = {
                'Content-Type': 'application/json'
            }
            
            response = requests.post(mt_api_url, json=payload, headers=headers, timeout=30)
            mt_result = response.json()
            
            # Extract translated text
            if mt_result.get('status') == 'success' and 'data' in mt_result:
                if 'output_text' in mt_result['data']:
                    translated_text = mt_result['data']['output_text']
                else:
                    translated_text = ""
            elif 'output_text' in mt_result:
                translated_text = mt_result['output_text']
            else:
                print(f"Warning: Unexpected MT response format for chunk {i+1}")
                print(f"Response: {mt_result}")
                translated_text = ""
            
            print(f"Translation result for chunk {i+1}: '{translated_text}'")
            translated_chunks.append(translated_text)
        
        return translated_chunks
    
    def generate_tts_from_translated_chunks(self, translated_chunks: List[str]) -> List[str]:
        """
        Generate TTS audio directly from translated text chunks using API server
        Returns list of temporary audio file paths
        """
        print(f"Generating TTS for {len(translated_chunks)} translated chunks")
        
        tts_api_url = f"{API_SERVER_BASE_URL}/tts"
        tts_file_paths = []
        
        for i, text_chunk in enumerate(translated_chunks):
            if not text_chunk.strip():
                print(f"Skipping empty chunk {i}")
                continue
            
            print(f"Generating TTS for chunk {i+1}: '{text_chunk}'")
            
            payload = {
                "text": text_chunk,
                "Language": self.dest_lang,
                "gender": "female"
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            response = requests.post(tts_api_url, json=payload, headers=headers, timeout=30)
            tts_result = response.json()
            
            # Extract S3 URL from TTS response
            s3_url = None
            if tts_result.get('status') == 'success' and 'data' in tts_result:
                if 's3_url' in tts_result['data']:
                    s3_url = tts_result['data']['s3_url']
            elif 's3_url' in tts_result:
                s3_url = tts_result['s3_url']
            
            if s3_url:
                # Download audio from S3 URL
                audio_response = requests.get(s3_url, timeout=30)
                
                # Save to temporary file
                temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                temp_file.write(audio_response.content)
                temp_file.close()
                
                tts_file_paths.append(temp_file.name)
                print(f"Generated TTS chunk {i+1}: saved to {temp_file.name}")
            else:
                print(f"Warning: No S3 URL found in TTS response for chunk {i}")
                print(f"Response: {tts_result}")
        
        return tts_file_paths
    
    def _split_text_proportionally(self, text: str, original_chunks: List[AudioChunk]) -> List[str]:
        """
        Split translated text proportionally based on original chunk durations
        """
        if not text.strip():
            return ["" for _ in original_chunks]
        
        words = text.split()
        if not words:
            return ["" for _ in original_chunks]
        
        # Calculate proportions based on original chunk durations
        total_duration = sum(len(chunk.audio_segment) for chunk in original_chunks)
        proportions = [len(chunk.audio_segment) / total_duration for chunk in original_chunks]
        
        # Distribute words proportionally
        text_chunks = []
        word_index = 0
        
        for i, proportion in enumerate(proportions):
            words_for_chunk = max(1, int(len(words) * proportion))
            
            # Don't exceed available words
            words_for_chunk = min(words_for_chunk, len(words) - word_index)
            
            if word_index < len(words):
                chunk_text = " ".join(words[word_index:word_index + words_for_chunk])
                text_chunks.append(chunk_text)
                word_index += words_for_chunk
            else:
                text_chunks.append("")
        
        # Distribute any remaining words to the last chunk
        if word_index < len(words):
            remaining_words = " ".join(words[word_index:])
            if text_chunks:
                text_chunks[-1] += " " + remaining_words
        
        return text_chunks
    
    def combine_audio_chunks(self, tts_file_paths: List[str], output_file: str):
        """
        Combine TTS audio chunks into final output using ffmpeg
        """
        print("Combining audio chunks into final output")
        
        if not tts_file_paths:
            print("No audio chunks to combine")
            return
        
        if len(tts_file_paths) == 1:
            # Just copy the single file
            shutil.copy2(tts_file_paths[0], output_file)
        else:
            # Create a file list for ffmpeg concat
            list_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
            for file_path in tts_file_paths:
                list_file.write(f"file '{file_path}'\n")
            list_file.close()
            
            # Use ffmpeg to concatenate files
            cmd = [
                'ffmpeg', '-f', 'concat', '-safe', '0', '-i', list_file.name,
                '-c', 'copy', '-y', output_file
            ]
            subprocess.run(cmd, capture_output=True)
            
            # Clean up list file
            os.unlink(list_file.name)
        
        # Clean up temporary TTS files
        for file_path in tts_file_paths:
            if os.path.exists(file_path):
                os.unlink(file_path)
        
        print(f"Final audio saved to: {output_file}")
    
    def process_file_simple(self, input_file: str, output_file: str):
        """
        Process the complete S2S pipeline using the API server's s2s endpoint (simpler, no chunking)
        """
        print(f"Starting simple S2S pipeline: {self.source_lang} -> {self.dest_lang}")
        print(f"Input: {input_file}, Output: {output_file}")
        
        s2s_api_url = f"{API_SERVER_BASE_URL}/s2s"
        
        with open(input_file, 'rb') as audio_file:
            files = {
                'audio_file': (os.path.basename(input_file), audio_file, 'audio/wav')
            }
            data = {
                'source': self.source_lang,
                'dest': self.dest_lang
            }
            
            response = requests.post(s2s_api_url, files=files, data=data, timeout=120)
            s2s_result = response.json()
            
            # Extract S3 URL from TTS result
            data = s2s_result.get('data', {})
            tts_result = data.get('tts_result', {})
            
            s3_url = None
            if 's3_url' in tts_result:
                s3_url = tts_result['s3_url']
            elif 'data' in tts_result and 's3_url' in tts_result['data']:
                s3_url = tts_result['data']['s3_url']
            
            if s3_url:
                # Download and save the audio
                audio_response = requests.get(s3_url, timeout=60)
                
                # Save the audio directly
                with open(output_file, 'wb') as out_file:
                    out_file.write(audio_response.content)
                
                # Store results in instance variables
                self.original_text = data.get('original_text', '')
                self.translated_text = data.get('translated_text', '')
                
                print(f"Pipeline completed successfully! Output saved to: {output_file}")
                print(f"Original text: {self.original_text}")
                print(f"Translated text: {self.translated_text}")
                
                return True
            else:
                print(f"Error: No S3 URL found in S2S response")
                print(f"Response: {s2s_result}")
                return False

    def process_file(self, input_file: str, output_file: str):
        """
        Process the complete S2S pipeline
        """
        print(f"Starting S2S pipeline: {self.source_lang} -> {self.dest_lang}")
        print(f"Input: {input_file}, Output: {output_file}")
        
        # Step 1: Chunk audio with overlap
        chunks = self.chunk_audio_with_overlap(input_file)
        
        # Step 2: Process each chunk through ASR
        for chunk in chunks:
            self.process_asr(chunk)
        
        # Step 3: Merge overlapping text
        merged_text = self.merge_overlapping_text(chunks)
        
        # Step 4: Translate merged text in chunks
        translated_chunks = self.translate_text_chunks(merged_text)
        
        if not translated_chunks or all(not chunk.strip() for chunk in translated_chunks):
            print("Error: No translated text generated")
            return False
        
        # Step 5: Generate TTS directly from translated chunks
        tts_file_paths = self.generate_tts_from_translated_chunks(translated_chunks)
        
        if not tts_file_paths:
            print("Error: No TTS audio generated")
            return False
        
        # Step 6: Combine chunks into final audio
        self.combine_audio_chunks(tts_file_paths, output_file)
        
        # Step 7: Clean up chunk files
        for chunk in chunks:
            if os.path.exists(chunk.file_path):
                os.unlink(chunk.file_path)
        
        print(f"Pipeline completed successfully! Output saved to: {output_file}")
        
        return True

    def run(self, input_audio_path: str) -> dict:
        """
        Run the complete S2S pipeline and return results as a dictionary
        """
        try:
            # Create temporary output file
            temp_output = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_output.close()
            
            # Process the file using simple method for faster processing
            success = self.process_file_simple(input_audio_path, temp_output.name)
            
            if success:
                return {
                    'status': 'success',
                    'data': {
                        'original_text': self.original_text,
                        'translated_text': self.translated_text,
                        'output_audio': temp_output.name
                    }
                }
            else:
                return {
                    'status': 'error',
                    'message': 'S2S processing failed'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'S2S pipeline error: {str(e)}'
            }

def main():
    parser = argparse.ArgumentParser(description='Speech-to-Speech Translation Pipeline')
    parser.add_argument('--input', required=True, help='Input audio file path')
    parser.add_argument('--source', required=True, help='Source language')
    parser.add_argument('--dest', required=True, help='Destination language')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--chunk-duration', type=int, default=6, help='Chunk duration in seconds (default: 6)')
    parser.add_argument('--overlap', type=int, default=1, help='Overlap duration in seconds (default: 1)')
    parser.add_argument('--simple', action='store_true', help='Use simple API server endpoint (faster, no chunking)')
    parser.add_argument('--api-server', default='http://localhost:8000', help='API server base URL (default: http://localhost:8000)')
    
    args = parser.parse_args()
    
    # Set API server URL
    global API_SERVER_BASE_URL
    API_SERVER_BASE_URL = args.api_server
    
    # Create S2S pipeline
    pipeline = S2SPipeline(
        source_lang=args.source,
        dest_lang=args.dest,
        chunk_duration=args.chunk_duration,
        overlap=args.overlap
    )
    
    # Process the file
    if args.simple:
        print("Using simple API server endpoint...")
        success = pipeline.process_file_simple(args.input, args.output)
    else:
        print("Using advanced chunked processing...")
        success = pipeline.process_file(args.input, args.output)
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
