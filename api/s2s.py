#!/usr/bin/env python3
"""
Speech-to-Speech (S2S) End-to-End Pipeline
Processes audio streams by chunking, ASR, MT, and TTS with overlap handling
"""

import argparse
import os
import sys
import tempfile
import base64
import io
import time
import re
from typing import List, Tuple, Optional
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to Python path to import mapping
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tts.tts_mapping import mappings as tts_mappings
from mt.mt_mapping import mappings as mt_mappings
from asr.asr_mapping import mappings as asr_mappings

# Get the access token from environment variables
ACCESS_TOKEN = os.getenv('TOKEN')
if not ACCESS_TOKEN:
    raise ValueError("TOKEN not found in environment variables. Please check your .env file.")

class AudioChunk:
    """Represents an audio chunk with metadata"""
    def __init__(self, audio_segment: AudioSegment, start_time: float, end_time: float, chunk_id: int):
        self.audio_segment = audio_segment
        self.start_time = start_time
        self.end_time = end_time
        self.chunk_id = chunk_id
        self.text = ""
        self.translated_text = ""
        self.tts_audio = None

class S2SPipeline:
    """End-to-end Speech-to-Speech Pipeline"""
    
    def __init__(self, source_lang: str, dest_lang: str, chunk_duration: int = 6, overlap: int = 0.1):
        self.source_lang = source_lang
        self.dest_lang = dest_lang
        self.chunk_duration = chunk_duration * 1000  # Convert to milliseconds
        self.overlap = overlap * 1000  # Convert to milliseconds
        self.chunks: List[AudioChunk] = []
        
        # Validate language mappings
        self._validate_languages()
        
    def _validate_languages(self):
        """Validate that required language mappings exist"""
        if self.source_lang not in asr_mappings:
            raise ValueError(f"ASR not supported for source language '{self.source_lang}'. "
                           f"Available: {list(asr_mappings.keys())}")
        
        mt_key = f"{self.source_lang},{self.dest_lang}"
        if mt_key not in mt_mappings:
            raise ValueError(f"MT not supported for '{self.source_lang}' to '{self.dest_lang}'. "
                           f"Available: {list(mt_mappings.keys())}")
        
        if self.dest_lang not in tts_mappings:
            raise ValueError(f"TTS not supported for destination language '{self.dest_lang}'. "
                           f"Available: {list(tts_mappings.keys())}")
    
    def chunk_audio_with_overlap(self, audio_file_path: str) -> List[AudioChunk]:
        """
        Chunk audio into overlapping segments with silence detection
        """
        print(f"Loading audio file: {audio_file_path}")
        audio = AudioSegment.from_file(audio_file_path)
        
        print(f"Audio duration: {len(audio)/1000:.2f} seconds")
        print(f"Chunking with {self.chunk_duration/1000}s duration and {self.overlap/1000}s overlap")
        
        chunks = []
        chunk_id = 0
        current_pos = 0
        
        while current_pos < len(audio):
            # Calculate chunk boundaries
            chunk_end = min(current_pos + self.chunk_duration, len(audio))
            
            # Extract the chunk
            chunk_audio = audio[current_pos:chunk_end]
            
            # Apply silence detection to find better boundaries
            if chunk_end < len(audio):  # Not the last chunk
                chunk_audio = self._adjust_chunk_boundary(chunk_audio, audio, current_pos, chunk_end)
            
            # Create AudioChunk object
            chunk = AudioChunk(
                audio_segment=chunk_audio,
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
            if chunk_end >= len(audio):
                break
        
        self.chunks = chunks
        return chunks
    
    def _adjust_chunk_boundary(self, chunk_audio: AudioSegment, full_audio: AudioSegment, 
                              start_pos: int, end_pos: int) -> AudioSegment:
        """
        Adjust chunk boundary to avoid cutting words mid-sentence using silence detection
        """
        # Look for silence in the last second of the chunk
        search_start = max(0, len(chunk_audio) - 1000)  # Last 1 second
        search_segment = chunk_audio[search_start:]
        
        # Detect silent parts (silence threshold: -40dB, min silence: 100ms)
        silent_ranges = detect_nonsilent(search_segment, min_silence_len=100, silence_thresh=-40, seek_step=10)
        
        if silent_ranges:
            # Find the last silence before the end
            for start_silent, end_silent in reversed(silent_ranges):
                if end_silent < len(search_segment) - 100:  # Leave some buffer
                    # Adjust the chunk to end at this silence
                    new_end = search_start + end_silent
                    return chunk_audio[:new_end]
        
        # If no suitable silence found, return original chunk
        return chunk_audio
    
    def process_asr(self, chunk: AudioChunk) -> str:
        """
        Process audio chunk through ASR API
        """
        print(f"Processing ASR for chunk {chunk.chunk_id}")
        
        # Check ASR constraints: ~20 seconds limit and <5MB file size
        chunk_duration = len(chunk.audio_segment) / 1000.0  # Convert to seconds
        if chunk_duration > 20:
            print(f"Warning: Chunk {chunk.chunk_id} duration ({chunk_duration:.2f}s) exceeds ASR limit of 20s. Truncating...")
            chunk.audio_segment = chunk.audio_segment[:20000]  # Truncate to 20 seconds
        
        asr_api_url = asr_mappings[self.source_lang]
        
        # Save chunk as temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            chunk.audio_segment.export(temp_file.name, format='wav')
            temp_file_path = temp_file.name
            
            # Check file size constraint (<5MB)
            file_size = os.path.getsize(temp_file_path)
            if file_size > 5 * 1024 * 1024:  # 5MB in bytes
                print(f"Warning: Chunk {chunk.chunk_id} file size ({file_size/1024/1024:.2f}MB) exceeds ASR limit of 5MB")
                # Could implement compression here if needed
        
        try:
            headers = {'access-token': ACCESS_TOKEN}
            
            with open(temp_file_path, 'rb') as audio_file:
                files = {
                    'audio_file': (f'chunk_{chunk.chunk_id}.wav', audio_file, 'audio/wav')
                }
                
                response = requests.post(asr_api_url, files=files, headers=headers, timeout=60, verify=False)
                response.raise_for_status()
                
                asr_result = response.json()
                
                # Extract text from ASR response
                if 'data' in asr_result and 'recognized_text' in asr_result['data']:
                    text = asr_result['data']['recognized_text']
                elif 'recognized_text' in asr_result:
                    text = asr_result['recognized_text']
                else:
                    print(f"Warning: Unexpected ASR response format for chunk {chunk.chunk_id}")
                    text = ""
                
                chunk.text = text
                print(f"ASR result for chunk {chunk.chunk_id}: '{text}'")
                return text
                
        except requests.exceptions.RequestException as e:
            print(f"Error in ASR for chunk {chunk.chunk_id}: {e}")
            return ""
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
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
        mt_key = f"{self.source_lang},{self.dest_lang}"
        mt_api_url = mt_mappings[mt_key]
        
        for i, chunk in enumerate(text_chunks):
            print(f"Translating chunk {i+1}/{len(text_chunks)}: '{chunk}'")
            
            payload = {"input_text": chunk}
            headers = {
                'access-token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.post(mt_api_url, json=payload, headers=headers, timeout=30, verify=False)
                response.raise_for_status()
                
                mt_result = response.json()
                
                # Extract translated text
                if 'data' in mt_result and 'output_text' in mt_result['data']:
                    translated_text = mt_result['data']['output_text']
                elif 'output_text' in mt_result:
                    translated_text = mt_result['output_text']
                else:
                    print(f"Warning: Unexpected MT response format for chunk {i+1}")
                    translated_text = ""
                
                print(f"Translation result for chunk {i+1}: '{translated_text}'")
                translated_chunks.append(translated_text)
                
            except requests.exceptions.RequestException as e:
                print(f"Error in MT for chunk {i+1}: {e}")
                translated_chunks.append("")
        
        return translated_chunks
    
    def generate_tts_from_translated_chunks(self, translated_chunks: List[str]) -> List[AudioSegment]:
        """
        Generate TTS audio directly from translated text chunks
        """
        print(f"Generating TTS for {len(translated_chunks)} translated chunks")
        
        tts_api_url = tts_mappings[self.dest_lang]
        tts_chunks = []
        
        for i, text_chunk in enumerate(translated_chunks):
            if not text_chunk.strip():
                print(f"Skipping empty chunk {i}")
                continue
            
            print(f"Generating TTS for chunk {i+1}: '{text_chunk}'")
            
            payload = {
                "text": text_chunk,
                "gender": "female"
            }
            
            headers = {
                'access-token': ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
            
            try:
                response = requests.post(tts_api_url, json=payload, headers=headers, timeout=30, verify=False)
                response.raise_for_status()
                
                tts_result = response.json()
                
                # Extract S3 URL from TTS response (according to API specifications)
                if 'data' in tts_result and 's3_url' in tts_result['data']:
                    s3_url = tts_result['data']['s3_url']
                elif 's3_url' in tts_result:
                    s3_url = tts_result['s3_url']
                else:
                    print(f"Warning: Unexpected TTS response format for chunk {i}")
                    print(f"Response: {tts_result}")
                    continue
                
                # Download audio from S3 URL
                try:
                    audio_response = requests.get(s3_url, timeout=30, verify=False)
                    audio_response.raise_for_status()
                    
                    # Create AudioSegment from downloaded audio
                    audio_segment = AudioSegment.from_file(io.BytesIO(audio_response.content))
                    tts_chunks.append(audio_segment)
                    print(f"Generated TTS chunk {i+1}: {len(audio_segment)/1000:.2f}s from {s3_url}")
                    
                except Exception as e:
                    print(f"Error downloading TTS audio from S3 for chunk {i}: {e}")
                
            except requests.exceptions.RequestException as e:
                print(f"Error in TTS for chunk {i}: {e}")
        
        return tts_chunks
    
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
    
    def combine_audio_chunks(self, tts_chunks: List[AudioSegment]) -> AudioSegment:
        """
        Combine TTS audio chunks into final output
        """
        print("Combining audio chunks into final output")
        
        if not tts_chunks:
            return AudioSegment.empty()
        
        combined_audio = tts_chunks[0]
        
        for chunk in tts_chunks[1:]:
            # Add a small fade to smooth transitions
            combined_audio = combined_audio.append(chunk, crossfade=100)
        
        print(f"Final audio duration: {len(combined_audio)/1000:.2f} seconds")
        return combined_audio
    
    def process_file(self, input_file: str, output_file: str):
        """
        Process the complete S2S pipeline
        """
        print(f"Starting S2S pipeline: {self.source_lang} -> {self.dest_lang}")
        print(f"Input: {input_file}, Output: {output_file}")
        
        try:
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
            tts_chunks = self.generate_tts_from_translated_chunks(translated_chunks)
            
            if not tts_chunks:
                print("Error: No TTS audio generated")
                return False
            
            # Step 6: Combine chunks into final audio
            final_audio = self.combine_audio_chunks(tts_chunks)
            
            # Step 7: Export final audio
            final_audio.export(output_file, format='wav')
            print(f"Pipeline completed successfully! Output saved to: {output_file}")
            
            return True
            
        except Exception as e:
            print(f"Error in S2S pipeline: {e}")
            return False

def main():
    parser = argparse.ArgumentParser(description='Speech-to-Speech Translation Pipeline')
    parser.add_argument('--input', required=True, help='Input audio file path')
    parser.add_argument('--source', required=True, help='Source language')
    parser.add_argument('--dest', required=True, help='Destination language')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--chunk-duration', type=int, default=6, help='Chunk duration in seconds (default: 6)')
    parser.add_argument('--overlap', type=int, default=1, help='Overlap duration in seconds (default: 1)')
    
    args = parser.parse_args()
    
    # Validate input file
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found")
        return 1
    
    try:
        # Create S2S pipeline
        pipeline = S2SPipeline(
            source_lang=args.source,
            dest_lang=args.dest,
            chunk_duration=args.chunk_duration,
            overlap=args.overlap
        )
        
        # Process the file
        success = pipeline.process_file(args.input, args.output)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
