"""
Document Processing Service - Uses existing OCR/MT endpoints + Gemini
"""
import requests
from typing import Dict, Optional
from .config import GEMINI_API_KEY, GEMINI_TIMEOUT


class DocumentProcessor:
    """Process documents using existing API endpoints + Gemini"""
    
    def __init__(self, api_base_url: str = "http://localhost:5000"):
        self.api_base_url = api_base_url
        self.gemini_api_key = GEMINI_API_KEY
        self.gemini_base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.gemini_model = "gemini-2.0-flash"
    
    def process_document(
        self,
        image_file,
        source_language: str,
        target_language: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> Dict:
        """
        Complete pipeline: OCR → Translate → Summarize → Translate back
        
        Args:
            image_file: Image file or path
            source_language: Language of document
            target_language: Language for final summary (default: same as source)
            document_type: Type of document for better summarization
            
        Returns:
            Dict with all results
        """
        if target_language is None:
            target_language = source_language
        
        result = {
            "success": False,
            "source_language": source_language,
            "target_language": target_language,
            "steps": {}
        }
        
        # Step 1: OCR
        print(f"[Step 1/4] OCR: Extracting text in {source_language}...")
        ocr_result = self._call_ocr(image_file, source_language)
        result["steps"]["ocr"] = ocr_result
        
        if not ocr_result["success"]:
            result["error"] = f"OCR failed: {ocr_result['error']}"
            return result
        
        result["ocr_text"] = ocr_result["text"]
        
        # Step 2: Translate to English (if needed)
        if source_language != "English":
            print(f"[Step 2/4] MT: Translating {source_language} → English...")
            mt_result = self._call_mt(ocr_result["text"], source_language, "English")
            result["steps"]["translation_to_english"] = mt_result
            
            if not mt_result["success"]:
                result["error"] = f"Translation failed: {mt_result['error']}"
                return result
            
            english_text = mt_result["translated_text"]
        else:
            print(f"[Step 2/4] Skipping translation (already English)")
            english_text = ocr_result["text"]
        
        result["english_text"] = english_text
        
        # Step 3: Summarize with Gemini
        print(f"[Step 3/4] Gemini: Generating summary...")
        summary_result = self._call_gemini(english_text, document_type)
        result["steps"]["summarization"] = summary_result
        
        if not summary_result["success"]:
            result["error"] = f"Summarization failed: {summary_result['error']}"
            return result
        
        result["summary_english"] = summary_result["summary"]
        
        # Step 4: Translate summary back (if needed)
        if target_language != "English":
            print(f"[Step 4/4] MT: Translating summary English → {target_language}...")
            
            # Check if summary is JSON (dict) or plain text
            summary_content = summary_result["summary"]
            if isinstance(summary_content, dict):
                # For JSON summaries, translate only the text fields
                import json
                translated_summary = self._translate_json_fields(summary_content, "English", target_language)
                result["summary_native"] = translated_summary
                result["steps"]["translation_to_native"] = {"success": True, "note": "JSON fields translated"}
            else:
                # For plain text summaries, translate directly
                mt_back_result = self._call_mt(str(summary_content), "English", target_language)
                print(f"mt_back_result: {mt_back_result.get('translated_text', 'N/A')}")
                result["steps"]["translation_to_native"] = mt_back_result
                
                if not mt_back_result["success"]:
                    result["warning"] = f"Back-translation failed: {mt_back_result['error']}"
                    result["summary_native"] = None
                else:
                    result["summary_native"] = mt_back_result["translated_text"]
        else:
            print(f"[Step 4/4] Skipping translation (target is English)")
            result["summary_native"] = summary_result["summary"]
        
        result["success"] = True
        print("✓ Document processing completed!")
        return result
    
    def _call_ocr(self, image_file, language: str) -> Dict:
        """Call OCR endpoint"""
        try:
            url = f"{self.api_base_url}/ocr"
            
            # Prepare file - handle both file path string and file-like objects
            if isinstance(image_file, str):
                # File path provided
                with open(image_file, 'rb') as f:
                    files = {'file': (image_file, f, 'image/png')}
                    data = {'Language': language}
                    response = requests.post(url, files=files, data=data, timeout=120)
            else:
                # File object (FileStorage from Flask)
                # Reset file pointer to beginning
                if hasattr(image_file, 'seek'):
                    image_file.seek(0)
                
                # Read the file content
                file_content = image_file.read()
                
                # Reset pointer again in case file is used later
                if hasattr(image_file, 'seek'):
                    image_file.seek(0)
                
                # Get filename and mime type
                filename = getattr(image_file, 'filename', 'image.png')
                content_type = getattr(image_file, 'content_type', 'image/png')
                
                # Send with proper multipart format
                files = {'file': (filename, file_content, content_type)}
                data = {'Language': language}
                response = requests.post(url, files=files, data=data, timeout=120)
            
            response.raise_for_status()
            result = response.json()
            
            # Extract text from response - Bhashini API returns 'decoded_text'
            if result.get("status") == "success" and "data" in result:
                text = (result["data"].get("decoded_text") or 
                        result["data"].get("text") or 
                        result["data"].get("recognized_text"))
                
                # Check if text was actually extracted
                if not text or text.strip() == "":
                    return {"success": False, "error": "No text found in image. The image might be empty, unclear, or contain no readable text."}
                
                return {"success": True, "text": text}
            
            return {"success": False, "error": f"OCR failed: {result}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _call_mt(self, text: str, source: str, target: str) -> Dict:
        """Call MT endpoint"""
        try:
            url = f"{self.api_base_url}/mt"
            
            payload = {
                "text": text,
                "source": source,
                "dest": target
            }
            
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            print(result)
            print("=======================================")
            # Extract translation
            if result.get("status") == "success" and "data" in result:
                translated = result["data"].get("translated_text") or result["data"].get("text") or result["data"].get("output_text")
                return {"success": True, "translated_text": translated}
            
            return {"success": False, "error": f"MT failed: {result}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _call_gemini(self, text: str, document_type: Optional[str] = None) -> Dict:
        """Call Gemini API for summarization"""
        try:
            import json
            print('gemini api key:', self.gemini_api_key)
            prompt = self._create_prompt(text, document_type)
            
            url = f"{self.gemini_base_url}/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048,
                }
            }
            
            response = requests.post(url, json=payload, timeout=GEMINI_TIMEOUT)
            response.raise_for_status()
            result = response.json()
            
            # Extract summary
            if "candidates" in result and len(result["candidates"]) > 0:
                parts = result["candidates"][0].get("content", {}).get("parts", [])
                if parts and "text" in parts[0]:
                    raw_text = parts[0]["text"].strip()
                    
                    # Try to parse as JSON
                    try:
                        # Remove markdown code blocks if present
                        if raw_text.startswith("```"):
                            # Remove ```json or ``` at start and ``` at end
                            raw_text = raw_text.split("```")[1]
                            if raw_text.startswith("json"):
                                raw_text = raw_text[4:].strip()
                        
                        parsed_json = json.loads(raw_text)
                        return {"success": True, "summary": parsed_json, "raw_text": raw_text}
                    except json.JSONDecodeError:
                        # If JSON parsing fails, return as text
                        return {"success": True, "summary": raw_text, "raw_text": raw_text}
            
            return {"success": False, "error": f"Gemini failed: {result}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _translate_json_fields(self, data, source: str, target: str) -> Dict:
        """Recursively translate string fields in JSON structure"""
        import json
        
        if isinstance(data, dict):
            translated = {}
            for key, value in data.items():
                if isinstance(value, str) and value not in ["not specified", "yes", "no", "true", "false"]:
                    # Translate string values (except certain keywords)
                    mt_result = self._call_mt(value, source, target)
                    if mt_result["success"]:
                        translated[key] = mt_result["translated_text"]
                    else:
                        translated[key] = value  # Keep original if translation fails
                elif isinstance(value, (dict, list)):
                    # Recursively translate nested structures
                    translated[key] = self._translate_json_fields(value, source, target)
                else:
                    # Keep non-string values as is (numbers, booleans, None)
                    translated[key] = value
            return translated
        
        elif isinstance(data, list):
            return [self._translate_json_fields(item, source, target) for item in data]
        
        else:
            # For primitive types, return as is
            return data
    
    def _create_prompt(self, text: str, document_type: Optional[str]) -> str:
        """Create prompt based on document type"""
        
        if document_type == "prescription":
            instruction = """This is a PRESCRIPTION. Extract medicine information and return ONLY a valid JSON object with this exact structure:
{
  "medicines": [
    {
      "medicine_name": "name of medicine",
      "dosage_mg": "dosage in mg (number only, or 'not specified')",
      "timing": {
        "morning": true/false,
        "afternoon": true/false,
        "evening": true/false,
        "night": true/false
      },
      "number_of_days": "number of days (number only, or 'not specified')"
    }
  ]
}

If information is not available, use "not specified" for strings or false for booleans. Do not include any text before or after the JSON."""
        
        elif document_type == "lab_report":
            instruction = """This is a LAB REPORT. Extract test information and return ONLY a valid JSON object with this exact structure:
{
  "tests": [
    {
      "test_name": "name of the test",
      "result": "test result value",
      "reference_range": "normal reference range",
      "status": "normal/abnormal/borderline"
    }
  ]
}

Analyze each result against its reference range to determine status. If information is not available, use "not specified". Do not include any text before or after the JSON."""
        
        elif document_type == "discharge_summary":
            instruction = """This is a DISCHARGE SUMMARY. Provide a concise summary and return ONLY a valid JSON object with this exact structure:
{
  "summary": "A clear, concise summary of the patient's hospital stay, diagnosis, treatments, and follow-up instructions"
}

Do not include any text before or after the JSON."""
        
        else:
            instruction = """Extract key medical information and return ONLY a valid JSON object with this structure:
{
  "summary": "A clear, concise summary of the medical document"
}

Do not include any text before or after the JSON."""
        
        return f"""You are a medical AI assistant. {instruction}

DOCUMENT TEXT:
{text}

JSON OUTPUT:"""
