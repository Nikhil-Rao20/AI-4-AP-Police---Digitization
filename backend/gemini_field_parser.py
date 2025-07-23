import json
import requests
from typing import Dict, Any

class GeminiFieldParser:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        
        # Define document templates with required fields
        self.document_templates = {
            "medical_leave": {
                "name": "NONE",
                "dateOfSubmission": "NONE",
                "coyBelongsTo": "NONE",
                "rank": "NONE",
                "leaveReason": "NONE",
                "phoneNumber": "NONE",
                "unitAndDistrict": "NONE"
            },
            "earned_leave_letter": {
                "rcNo": "NONE",
                "hodNo": "NONE",
                "pcNo": "NONE",
                "name": "NONE",
                "date": "NONE",
                "numberOfDays": "NONE",
                "leaveFromDate": "NONE",
                "leaveToDate": "NONE",
                "leaveReason": "NONE"
            },
            "probation_letter": {
                "serviceClassCategory": "NONE",
                "nameOfProbationer": "NONE",
                "dateOfRegularization": "NONE",
                "periodOfProbation": "NONE",
                "leaveTakenDuringProbation": "NONE",
                "dateOfCompletion": "NONE",
                "testsToBePassed": "NONE",
                "punishmentsDuringProbation": "NONE",
                "pendingPROE": "NONE",
                "characterAndConduct": "NONE",
                "firingPracticeCompleted": "NONE",
                "remarksOfICOfficer": "NONE",
                "remarksOfCommandant": "NONE",
                "remarksOfDIG": "NONE",
                "adgpOrders": "NONE",
                "dateOfBirth": "NONE",
                "salary": "NONE",
                "qualification": "NONE",
                "acceptanceOfSelfAppraisal": "NONE",
                "assessmentOfPerformance": "NONE"
            },
            "punishment_letter": {
                "rcNo": "NONE",
                "doNo": "NONE",
                "orderDate": "NONE",
                "punishmentAwarded": "NONE",
                "delinquencyDescription": "NONE",
                "issuedBy": "NONE",
                "issuedDate": "NONE"
            },
            "reward_letter": {
                "rcNo": "NONE",
                "hooNo": "NONE",
                "date": "NONE",
                "issuedBy": "NONE",
                "subject": "NONE",
                "referenceOrders": "NONE",
                "rewardDetails": "NONE",
                "reasonForReward": "NONE"
            }
        }
        
        # Detailed field descriptions for better extraction
        self.field_descriptions = {
            "medical_leave": {
                "name": "Full name of the person requesting leave",
                "dateOfSubmission": "Date when leave was submitted (DD-MM-YYYY format)",
                "coyBelongsTo": "Company designation (e.g., 'A coy Vijayawada')",
                "rank": "Rank or position (e.g., 'HC - 881')",
                "leaveReason": "Reason for leave (e.g., 'SICK LEAVE')",
                "phoneNumber": "10-digit phone number",
                "unitAndDistrict": "Unit and district details"
            },
            "earned_leave_letter": {
                "rcNo": "RC No in the format of xx/xx/xxxx",
                "hodNo": "HOD No",
                "pcNo": "PC No",
                "name": "Full name of the person requesting leave",
                "date": "Date of the letter (DD-MM-YYYY format)",
                "numberOfDays": "Count of leave days requested",
                "leaveFromDate": "Leave start date (DD-MM-YYYY format)",
                "leaveToDate": "Leave end date (DD-MM-YYYY format)",
                "leaveReason": "Reason for leave"
            },
            "probation_letter": {
                "serviceClassCategory": "Service class and category",
                "nameOfProbationer": "Full name of the probationer",
                "dateOfRegularization": "Date of regularization (DD-MM-YYYY format)",
                "periodOfProbation": "Period of probation (e.g., '2 years')",
                "leaveTakenDuringProbation": "Leave taken during probation (e.g., 'NONE' if no leave taken)",
                "dateOfCompletion": "Date of completion of probation (DD-MM-YYYY format)",
                "testsToBePassed": "Tests to be passed during probation (e.g., 'Physical Test')",
                "punishmentsDuringProbation": "Punishments during probation (e.g., 'NONE' if no punishments)",
                "pendingPROE": "Pending PR/OE (e.g., 'NONE' if none pending)",
                "characterAndConduct": "Character and conduct remarks (e.g., 'Excellent')",
                "firingPracticeCompleted": "Firing practice completed (e.g., 'Yes' or 'No')",
                "remarksOfICOfficer": "Remarks of I/C Officer (e.g., 'Good performance')",
                "remarksOfCommandant": "Remarks of Commandant (e.g., 'Satisfactory')",
                "remarksOfDIG": "Remarks of DIG (e.g., 'Commendable')",
                "adgpOrders": "ADGP orders (e.g., 'Approved')",
                "dateOfBirth": "Date of birth (DD-MM-YYYY format)",
                "salary": "Salary details (e.g., 'Rs. 30,000')",
                "qualification": "Education Qualification details",
                "acceptanceOfSelfAppraisal": "Acceptance of self-appraisal report (e.g., 'Accepted')",
                "assessmentOfPerformance": "Assessment of performance during the year (e.g., 'Good')"
            },
            "punishment_letter": {
                "rcNo": "RC No in the format of xx/xx/xxxx",
                "doNo": "D.O No",
                "orderDate": "Date of the order (DD-MM-YYYY format)",
                "punishmentAwarded": "Punishment awarded",
                "delinquencyDescription": "Description of delinquency",
                "issuedBy": "Name of the issuing authority",
                "issuedDate": "Date of issue (DD-MM-YYYY format)"
            },
            "reward_letter": {
                "rcNo": "RC No in the format of xx/xx/xxxx",
                "hooNo": "HOO No",
                "date": "Date of the letter (DD-MM-YYYY format)",
                "issuedBy": "Name of the issuing authority",
                "subject": "Subject of the reward letter",
                "referenceOrders": "Reference orders related to the reward",
                "rewardDetails": "Details of the reward (e.g., 'Certificate of Appreciation')",
                "reasonForReward": "Reason for the reward (e.g., 'Outstanding performance in duty')"
            }
            # Similar descriptions for other document types...
        }

    def call_gemini_api(self, prompt: str) -> str:
        """Call Gemini API with the given prompt"""
        try:
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json"
                }
            }
            
            url = f"{self.base_url}?key={self.api_key}"
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                return result['candidates'][0]['content']['parts'][0]['text']
            else:
                return f"Error {response.status_code}: {response.text}"
                
        except Exception as e:
            return f"API Error: {str(e)}"

    def generate_extraction_prompt(self, raw_text: str, doc_type: str) -> str:
        """Generate precise extraction prompt for Gemini"""
        template = self.document_templates[doc_type]
        
        prompt = f"""
**ROLE**: You are a military document processing expert specializing in {doc_type.replace('_', ' ').title()} documents.

**TASK**: Extract structured data from the following document text. 
Output ONLY valid JSON using EXACTLY these fields with these data types:
{json.dumps(template, indent=2)}

**RULES**:
1. Use "NONE" for missing values
2. Maintain original values from document - DO NOT modify
3. Format dates as DD-MM-YYYY
4. Output ONLY pure JSON - no additional text

**DOCUMENT TEXT**:
{raw_text}

**OUTPUT**:
"""
        return prompt

    def extract_fields(self, raw_text: str, doc_type: str) -> Dict[str, Any]:
        """Extract and validate fields from raw text"""
        # Generate tailored prompt
        prompt = self.generate_extraction_prompt(raw_text, doc_type)
        
        # Get Gemini response
        response_text = self.call_gemini_api(prompt)
        
        try:
            # Try direct JSON parsing
            extracted_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback to manual JSON extraction
            try:
                json_str = response_text.split("```json")[1].split("```")[0]
                extracted_data = json.loads(json_str)
            except:
                return {"error": f"JSON parsing failed: {response_text[:100]}..."}
        
        # Validate and complete fields
        template = self.document_templates[doc_type]
        validated = {**template, **extracted_data}  # Merge with defaults
        return validated

    def parse_document(self, raw_text: str, doc_type: str) -> Dict[str, Any]:
        """Main processing function"""
        try:
            if doc_type not in self.document_templates:
                return {"error": f"Unknown document type: {doc_type}"}
                
            parsed_fields = self.extract_fields(raw_text, doc_type)
            
            return {
                "document_type": doc_type,
                "raw_text": raw_text,
                "parsed_fields": parsed_fields
            }
        except Exception as e:
            return {
                "document_type": doc_type,
                "raw_text": raw_text,
                "error": f"Processing error: {str(e)}"
            }

