"""
Clinical Transcript Processor
Handles: Clinical transcripts → SOAP notes
         Patient consultations → Action items
"""
import requests
from typing import Dict, Optional
from .config import (
    GEMINI_API_KEY, 
    GEMINI_API_URL, 
    GEMINI_TIMEOUT,
    MT_ENDPOINT
)


class TranscriptProcessor:
    """Process clinical transcripts with MT and Gemini"""
    
    def __init__(self, api_base_url: str = None):
        """
        Initialize processor
        
        Args:
            api_base_url: Base URL for MT API (default from config)
        """
        self.mt_endpoint = MT_ENDPOINT if api_base_url is None else f"{api_base_url}/mt"
        self.gemini_api_key = GEMINI_API_KEY
        self.gemini_url = GEMINI_API_URL
    
    def process_clinical_transcript(
        self,
        transcript: str,
        source_language: str,
        target_language: str = None
    ) -> Dict:
        """
        Process clinical transcript to generate SOAP notes
        
        Args:
            transcript: Clinical transcript text
            source_language: Language of input transcript
            target_language: Language for output (default: same as source)
            
        Returns:
            Dict with SOAP notes in both English and native language
        """
        if target_language is None:
            target_language = source_language
        
        result = {
            "success": False,
            "source_language": source_language,
            "target_language": target_language,
            "processing_type": "soap_notes",
            "steps": {}
        }
        
        # Step 1: Translate to English (if needed)
        print(f"[Step 1/3] Translating to English...")
        if source_language != "English":
            mt_result = self._call_mt(transcript, source_language, "English")
            result["steps"]["translation_to_english"] = mt_result
            
            if not mt_result["success"]:
                result["error"] = f"Translation failed: {mt_result['error']}"
                return result
            
            english_text = mt_result["translated_text"]
        else:
            english_text = transcript
            print(f"[Step 1/3] Skipped (already English)")
        
        result["original_transcript"] = transcript
        result["english_transcript"] = english_text
        
        # Step 2: Generate SOAP notes with Gemini
        print(f"[Step 2/3] Generating SOAP notes with Gemini...")
        soap_result = self._generate_soap_notes(english_text)
        result["steps"]["soap_generation"] = soap_result
        
        if not soap_result["success"]:
            result["error"] = f"SOAP generation failed: {soap_result['error']}"
            return result
        
        result["soap_notes_english"] = soap_result["soap_notes"]
        
        # Step 3: Translate back to native language (if needed)
        if target_language != "English":
            print(f"[Step 3/3] Translating SOAP notes to {target_language}...")
            
            # Translate each section
            soap_native = {}
            for section, content in soap_result["soap_notes"].items():
                mt_back_result = self._call_mt(content, "English", target_language)
                result["steps"][f"translation_{section}_to_native"] = mt_back_result
                
                if mt_back_result["success"]:
                    soap_native[section] = mt_back_result["translated_text"]
                else:
                    soap_native[section] = content  # Fallback to English
                    result["warning"] = f"Translation of {section} failed, using English"
            
            result["soap_notes_native"] = soap_native
        else:
            print(f"[Step 3/3] Skipped (target is English)")
            result["soap_notes_native"] = soap_result["soap_notes"]
        
        result["success"] = True
        print("✓ Clinical transcript processing completed!")
        return result
    
    def process_patient_consultation(
        self,
        transcript: str,
        source_language: str,
        target_language: str = None
    ) -> Dict:
        """
        Process patient consultation to generate action items
        
        Args:
            transcript: Patient consultation transcript text
            source_language: Language of input transcript
            target_language: Language for output (default: same as source)
            
        Returns:
            Dict with action items in both English and native language
        """
        if target_language is None:
            target_language = source_language
        
        result = {
            "success": False,
            "source_language": source_language,
            "target_language": target_language,
            "processing_type": "action_items",
            "steps": {}
        }
        
        # Step 1: Translate to English (if needed)
        print(f"[Step 1/3] Translating to English...")
        if source_language != "English":
            mt_result = self._call_mt(transcript, source_language, "English")
            result["steps"]["translation_to_english"] = mt_result
            
            if not mt_result["success"]:
                result["error"] = f"Translation failed: {mt_result['error']}"
                return result
            
            english_text = mt_result["translated_text"]
        else:
            english_text = transcript
            print(f"[Step 1/3] Skipped (already English)")
        
        result["original_transcript"] = transcript
        result["english_transcript"] = english_text
        
        # Step 2: Generate action items with Gemini
        print(f"[Step 2/3] Generating action items with Gemini...")
        action_result = self._generate_action_items(english_text)
        result["steps"]["action_items_generation"] = action_result
        
        if not action_result["success"]:
            result["error"] = f"Action items generation failed: {action_result['error']}"
            return result
        
        result["action_items_english"] = action_result["action_items"]
        
        # Step 3: Translate back to native language (if needed)
        if target_language != "English":
            print(f"[Step 3/3] Translating action items to {target_language}...")
            
            # Translate the entire action items text
            mt_back_result = self._call_mt(
                action_result["action_items_text"], 
                "English", 
                target_language
            )
            result["steps"]["translation_to_native"] = mt_back_result
            
            if mt_back_result["success"]:
                result["action_items_native"] = mt_back_result["translated_text"]
            else:
                result["action_items_native"] = action_result["action_items_text"]
                result["warning"] = "Translation failed, using English"
        else:
            print(f"[Step 3/3] Skipped (target is English)")
            result["action_items_native"] = action_result["action_items_text"]
        
        result["success"] = True
        print("✓ Patient consultation processing completed!")
        return result
    
    def _call_mt(self, text: str, source: str, target: str) -> Dict:
        """Call MT API for translation"""
        try:
            payload = {
                "text": text,
                "source": source,
                "dest": target
            }
            
            response = requests.post(self.mt_endpoint, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if result.get("status") == "success" and "data" in result:
                translated_text = result["data"].get("translated_text") or result["data"].get("output_text")
                return {"success": True, "translated_text": translated_text}
            
            return {"success": False, "error": f"MT failed: {result}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_soap_notes(self, transcript: str) -> Dict:
        """Generate SOAP notes from clinical transcript using Gemini"""
        try:
            prompt = f"""You are a medical AI assistant. Based on the clinical transcript provided, generate detailed SOAP (Subjective, Objective, Assessment, and Plan) notes.

**Clinical Transcript:**
{transcript}

**Instructions:**
1. Extract and organize information into SOAP format
2. Be thorough and professional
3. Use medical terminology appropriately
4. If information is missing for any section, note it as "Not documented"

**Return the response in JSON format with these exact keys:**
{{
  "subjective": "Patient's reported symptoms, complaints, and history",
  "objective": "Observable findings, vital signs, physical examination results",
  "assessment": "Clinical diagnosis or impression based on S and O",
  "plan": "Treatment plan, medications, follow-up, and patient instructions"
}}

Return ONLY the JSON, no additional text."""

            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.3,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }
            
            url = f"{self.gemini_url}?key={self.gemini_api_key}"
            response = requests.post(url, json=payload, timeout=GEMINI_TIMEOUT)
            response.raise_for_status()
            
            result = response.json()
            gemini_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # Parse JSON from response
            import json
            import re
            
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```json\s*(.*?)\s*```', gemini_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = gemini_text
            
            soap_notes = json.loads(json_str.strip())
            
            # Validate required keys
            required_keys = ["subjective", "objective", "assessment", "plan"]
            if not all(key in soap_notes for key in required_keys):
                return {
                    "success": False,
                    "error": "Invalid SOAP notes structure from Gemini"
                }
            
            return {
                "success": True,
                "soap_notes": soap_notes
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _generate_action_items(self, transcript: str) -> Dict:
        """Generate patient action items from consultation transcript using Gemini"""
        try:
            prompt = f"""You are a medical AI assistant. Based on the patient consultation transcript provided, extract and generate clear, actionable items for the patient.

**Consultation Transcript:**
{transcript}

**Instructions:**
1. Identify all medications, dosages, and schedules
2. Extract follow-up appointments and timings
3. List lifestyle modifications or recommendations
4. Include any tests or procedures to be done
5. Highlight important precautions or warnings
6. Make it patient-friendly and easy to understand

**Return the response in JSON format with these exact keys:**
{{
  "medications": [
    {{
      "name": "medication name",
      "dosage": "dosage amount",
      "frequency": "how often",
      "duration": "how long",
      "instructions": "special instructions"
    }}
  ],
  "follow_up": {{
    "when": "time/date for next visit",
    "purpose": "reason for follow-up"
  }},
  "lifestyle_changes": [
    "recommendation 1",
    "recommendation 2"
  ],
  "tests_procedures": [
    "test or procedure to be done"
  ],
  "precautions": [
    "important warning or precaution"
  ],
  "summary": "Brief 2-3 sentence summary of what patient needs to do"
}}

Return ONLY the JSON, no additional text."""

            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.3,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            }
            
            url = f"{self.gemini_url}?key={self.gemini_api_key}"
            response = requests.post(url, json=payload, timeout=GEMINI_TIMEOUT)
            response.raise_for_status()
            
            result = response.json()
            gemini_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # Parse JSON from response
            import json
            import re
            
            # Extract JSON from markdown code blocks if present
            json_match = re.search(r'```json\s*(.*?)\s*```', gemini_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = gemini_text
            
            action_items = json.loads(json_str.strip())
            
            # Create a formatted text version
            action_items_text = self._format_action_items(action_items)
            
            return {
                "success": True,
                "action_items": action_items,
                "action_items_text": action_items_text
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _format_action_items(self, items: dict) -> str:
        """Format action items dict into readable text"""
        text_parts = []
        
        if items.get("summary"):
            text_parts.append(f"Summary: {items['summary']}\n")
        
        if items.get("medications"):
            text_parts.append("Medications:")
            for med in items["medications"]:
                text_parts.append(
                    f"- {med.get('name', 'N/A')}: {med.get('dosage', 'N/A')} "
                    f"{med.get('frequency', 'N/A')} for {med.get('duration', 'N/A')}"
                )
                if med.get('instructions'):
                    text_parts.append(f"  Instructions: {med['instructions']}")
            text_parts.append("")
        
        if items.get("follow_up"):
            fu = items["follow_up"]
            text_parts.append(f"Follow-up: {fu.get('when', 'N/A')} - {fu.get('purpose', 'N/A')}\n")
        
        if items.get("lifestyle_changes"):
            text_parts.append("Lifestyle Changes:")
            for change in items["lifestyle_changes"]:
                text_parts.append(f"- {change}")
            text_parts.append("")
        
        if items.get("tests_procedures"):
            text_parts.append("Tests/Procedures:")
            for test in items["tests_procedures"]:
                text_parts.append(f"- {test}")
            text_parts.append("")
        
        if items.get("precautions"):
            text_parts.append("Precautions:")
            for precaution in items["precautions"]:
                text_parts.append(f"⚠️ {precaution}")
        
        return "\n".join(text_parts)
