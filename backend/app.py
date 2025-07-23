from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
import torch
from gemini_field_parser import GeminiFieldParser
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
import json
import re
from database import db
from gemini_field_parser import GeminiFieldParser
from transformers import Qwen2_5_VLForConditionalGeneration, AutoTokenizer, AutoProcessor, BitsAndBytesConfig
from qwen_vl_utils import process_vision_info
import torch
import warnings
warnings.filterwarnings("ignore")
import warnings
warnings.filterwarnings("ignore")
import cv2
import requests
from PIL import Image
import fitz  # PyMuPDF for PDF processing
import tempfile
from datetime import datetime

try:
    from transformers import AutoProcessor, AutoModelForCausalLM
    import torch
    from ultralytics import YOLO
    import cv2
    import base64
    from PIL import Image
    import io
except ImportError as e:
    print(f"Warning: Some ML libraries not available: {e}")


app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
STAMP_FOLDER = 'stamps'
SIGNATURE_FOLDER = 'signatures'
EXPORT_FOLDER = 'exports'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STAMP_FOLDER'] = STAMP_FOLDER
app.config['SIGNATURE_FOLDER'] = SIGNATURE_FOLDER
app.config['EXPORT_FOLDER'] = EXPORT_FOLDER

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STAMP_FOLDER, exist_ok=True)
os.makedirs(SIGNATURE_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)

# =====================
# MODEL INITIALIZATION
# =====================
print("Initializing models...")

# Initialize models only once at startup
model = None
processor = None
stamp_model = None
gemini_parser = None
signature_model = None
def initialize_models():
    global model, processor, stamp_model, gemini_parser, signature_model
    
    # Initialize Gemini parser
    from gemini_field_parser import GeminiFieldParser
    gemini_parser = GeminiFieldParser(os.environ.get("GEMINI_API_KEY"))
    
    try:
        # Configure and load Qwen model
        from transformers import BitsAndBytesConfig, AutoProcessor
        from transformers import Qwen2_5_VLForConditionalGeneration
        
        quantization_config = BitsAndBytesConfig(
            load_in_8bit=True,
            llm_int8_threshold=6.0,
            llm_int8_enable_fp32_cpu_offload=True
        )

        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            "Qwen/Qwen2.5-VL-3B-Instruct",
            quantization_config=quantization_config,
            device_map={
                "": 0,
                "language_model.layers": "auto",
                "vision_model": "cpu"
            }
        )

        processor = AutoProcessor.from_pretrained(
            "Qwen/Qwen2.5-VL-3B-Instruct",
            min_pixels=256 * 28 * 28,
            max_pixels=1280 * 28 * 28
        )
        
        # Initialize stamp detection model
        from ultralytics import YOLO
        stamp_model = YOLO('OD_Models/stamp_detection.pt')
        
        # Initialize signature detection model
        signature_model = YOLO('OD_Models/signature_detection.pt')
        
        print("All models initialized successfully")
        return True
    except ImportError as e:
        print(f"Warning: ML libraries not available: {e}")
        return False
    except Exception as e:
        print(f"Error initializing models: {e}")
        return False

# Initialize models on app startup
initialize_models()

if model is not None and processor is not None and stamp_model is not None and signature_model is not None:
    print("Models initialized successfully!!!!!!!!!!!!!")
else:
    print("Models not initialized")

# Prompts
classification_msg = "Classify the document image as one of the following types based on the content in it: Medical Leave, Reward Letter, Punishment Letter, Probation Letter, Earned Leave Letter. Do NOT return me any value other than the class name."

medical_msg = """
You are an expert in document field extraction. Extract the following fields from the uploaded document image.

Instructions:
- If any field is written in Telugu, do NOT translate it. Just write the Telugu text using English letters (e.g., పాండు → Paandu).
- Extract only the required fields listed below.
- If a required field is missing, return "NULL" as the value.
- For the "Name" field, use the main name filled in the form, not the name from the signature or inside the body of the letter.

Required Fields:

1. Name – Full name of the personnel submitting the form. Only alphabets, dots, and spaces. Use the name written in the form section, not the one from the signature or letter body.
2. Date of Submission – Date in DD-MM-YYYY format.
3. Coy Belongs to – Company or division (e.g., A Coy, B Coy, HQ Coy).
4. Rank – Official police rank (e.g., PC, HC, SI).
5. Leave Reason – A short sentence about why leave is being taken.
6. Phone Number – Valid 10-digit Indian mobile number (starting with 6–9).
7. Unit and District – Full unit name followed by district (e.g., 5th Bn. APSP, Vizianagaram).

Output Format (JSON):
{
  "Name": "...",
  "Date of Submission": "...",
  "Coy Belongs to": "...",
  "Rank": "...",
  "Leave Reason": "...",
  "Phone Number": "...",
  "Unit and District": "..."
}
Only return the final JSON output. No explanations or extra text.
"""
probation_msg = """
You are an expert in document field extraction.

Instructions:
- This is a multi-page document. Each page will be sent as a separate image.
- Only extract the fields present on this page. Ignore the fields not found on this page.
- If a field value is found, return it with its correct name and format.
- If the field is not present on this page, simply omit it from the output (do not return "Not found").
- Do not translate Telugu content. If a name or value is in Telugu, write it using English letters (e.g., వెంకట్ → Venkat).
- Maintain original casing, formatting, and expected formats (e.g., DD-MM-YYYY for dates, 'YES'/'NO', 'NIL').

Fields to extract (if available on this page):

1. Service Class Category
2. Name of Probationer
3. Date of Regularization
4. Period of Probation Prescribed
5. Leave Taken During Probation
6. Date of Completion of Probation
7. Tests to be Passed During Probation
8. Punishments During Probation
9. Pending PR/OE
10. Character and Conduct
11. Firing Practice Completed
12. Remarks of I/C Officer
13. Remarks of Commandant
14. Remarks of DIG
15. ADGP Orders
16. Date of Birth
17. Salary
18. Qualification
19. Acceptance of Self Appraisal Report – Part-I
20. Assessment of Officer's Performance During the Year

Nested Fields:
- Reporting Officer:
    - Name
    - Designation
    - Date (Optional)

- Countersigning Officer:
    - Name
    - Designation
    - Date (Optional)
    - Remarks

- Head of Department Opinion:
    - Opinion
    - Date (Optional)
    - Name
    - Designation

Output Format:
Return a clean JSON object with only the fields extracted from this page. Do not include fields that are not present on this page. Do not give any explanations.
"""
reward_msg = """
You are an expert in document field extraction.

Instructions:
- This is a reward order document. Extract only the required fields listed below from the document image.
- Do NOT translate any Telugu content. If a name or value is in Telugu, write it in English letters (e.g., రాజు → Raju).
- Extract only the fields present on this page. If a required field is not found, return "NULL" as the value.
- Follow the specified format rules for each field exactly.

Required Fields:

1. R c No – Format: SectionCode/SerialNumber/Year (e.g., B4/149/2020)
2. H. O. O No – Format: ReferenceNumber/YYYY (e.g., 709/2020)
3. Date – Format: DD-MM-YYYY
4. Issued By – Name and designation of the issuing authority.
5. Subject – Title or heading line from the document.
6. Reference Orders – List of references cited (as an array).
7. Reward Details – Array of officer entries with:
    - Rank (e.g., HC, SI)
    - Name
    - Reward amount or description
8. Reason for Reward – Descriptive sentence stating why the reward was granted.

Output Format:
Return a JSON object with only the fields found on this page. For Reward Details, use this structure:
"Reward Details": [
  { "Rank": "...", "Name": "...", "Reward": "..." },
  ...
]
Do not include any explanation or commentary—only return the JSON.
"""

punishment_msg = """
You are an expert in document field extraction.

Instructions:
- This is a punishment order document. Extract only the required fields listed below from the document image.
- Do NOT translate Telugu content. If any name or detail is in Telugu, write it using English letters (e.g., వెంకట్ → Venkat).
- Only extract fields that are present in this page else return "NULL" as the value.
- Follow all formatting rules as specified below.

Required Fields:

1. R c. No – Combination of:
   - Reference number (digits),
   - Section code (e.g., A6, B4),
   - Case type (PR),
   - Hyphenated serial number (e.g., PR-309),
   - Year range (e.g., 23-24)
   Example: 123/B4/PR-309/23-24

2. D. O No – Format: ReferenceNumber/YYYY (e.g., 709/2022)

3. Order_date – Format: DD-MM-YYYY or DD/MM/YY

4. Punishment_awarded – e.g., PP I or PP II followed by duration and conditions (like "PP I for 3 months w.e.f. 01-01-2023")

5. Deliquency_Description – Describes the offense or misconduct with details. Should include w.e.f. date if mentioned.

6. Issued By – Officer designation and unit (e.g., Commandant, 5th Bn. APSP)

7. Issued Date – Final signed date in DD-MM-YYYY or DD/MM/YY format

Output Format:
Return the extracted result as a JSON object with only the fields found in this page.

Example structure:
{
  "R c. No": "...",
  "D. O No": "...",
  "Order_date": "...",
  "Punishment_awarded": "...",
  "Deliquency_Description": "...",
  "Issued By": "...",
  "Issued Date": "..."
}

Only return the JSON. No extra explanations or text.
"""
earned_leave_msg = """
You are an expert in document field extraction.

Instructions:
- This is a document related to earned leave. Extract only the required fields listed below from the image of this page.
- If any field is written in Telugu, do NOT translate it. Just write the Telugu words using English letters (e.g., శ్రీను → Srinu).
- Extract only fields that are present in this page else return "NULL" as the value.
- Follow the format exactly as described.

Required Fields:

1. R c No. – Format: SectionCode/SerialNumber/Year (e.g., B4/149/2020)
2. H.O.D No. – Format: SerialNumber/Year (e.g., 72/2020)
3. PC No. / HC No. / ARSI No. – Required only if the designation includes 'PC', 'HC', or 'ARSI'. Format: e.g., PC-1158 or HC-230 or ARSI-87
4. Name – Example: S. Praveen Kumar or Praveen Kumar (only alphabets, spaces, dots)
5. Date – Format: DD-MM-YYYY (e.g., issue date or sanction date)
6. Number of Days – Total leave days. Format: Positive whole number (e.g., 7)
7. Leave From Date – Format: DD-MM-YYYY
8. Leave To Date – Format: DD-MM-YYYY
9. Leave Reason – Descriptive text explaining the reason for leave

Output Format:
Return the extracted result as a JSON object. Only include fields found on this page.

Example structure:
{
  "R c No.": "...",
  "H.O.D No.": "...",
  "PC No.": "...",
  "Name": "...",
  "Date": "...",
  "Number of Days": ...,
  "Leave From Date": "...",
  "Leave To Date": "...",
  "Leave Reason": "..."
}

Note:
- If the PC/HC/ARSI number is not required based on designation, do not include it, and if it is optional, include it if it's present else ignore it.
- Do not add explanations—only return the final JSON.
"""
system_Message = "You are an expert in Document Classification and Parsing!"

def RUN_THE_MAIN_PROCESSING(INPUT_IMAGE_PATH):
    """Main processing function that combines classification and field detection"""
    try:
        if model is None or processor is None:
            return {
                "document_type": "medical_leave",
                "parsed_fields": "Mock response - models not initialized"
            }
        # First: Classification Step
        classification_messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": INPUT_IMAGE_PATH},
                    {"type": "text", "text": classification_msg},
                ],
            },
        ]
        # Prepare classification inputs
        class_text = processor.apply_chat_template(
            classification_messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(classification_messages)
        class_inputs = processor(
            text=[class_text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")
        class_output_ids = model.generate(**class_inputs, max_new_tokens=32)
        class_trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(class_inputs.input_ids, class_output_ids)
        ]
        class_output_text = processor.batch_decode(
            class_trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()
        # Now: Decide on parsing message based on document type
        doc_type = class_output_text.lower()
        # print(f"Document Type Detected: {doc_type}")
        if "medical" in doc_type:
            parsing_msg = medical_msg
        elif "reward" in doc_type:
            parsing_msg = reward_msg
        elif "punishment" in doc_type:
            parsing_msg = punishment_msg
        elif "probation" in doc_type:
            parsing_msg = probation_msg
        elif "earned" in doc_type:
            parsing_msg = earned_leave_msg
        else:
            return {
                "document_type": "unknown",
                "parsed_fields": f"Unknown document type: {class_output_text}"
            }
        # Second: Parsing Step
        parsing_messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": INPUT_IMAGE_PATH},
                    {"type": "text", "text": parsing_msg},
                ],
            },
        ]

        parse_text = processor.apply_chat_template(
            parsing_messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(parsing_messages)
        parse_inputs = processor(
            text=[parse_text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")

        parse_output_ids = model.generate(**parse_inputs, max_new_tokens=256)
        parse_trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(parse_inputs.input_ids, parse_output_ids)
        ]
        parse_output_text = processor.batch_decode(
            parse_trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()

        return {
            "document_type": class_output_text,
            "parsed_fields": parse_output_text,
        }
    
    except Exception as e:
        print(f"Error in RUN_THE_MAIN_PROCESSING: {e}")
        return {
            "document_type": "medical_leave",
            "parsed_fields": f"Error processing document: {str(e)}"
        }

def DETECT_STAMPS(INPUT_IMAGE_PATH):
    """Detect stamps from the image using YOLO model"""
    try:
        if stamp_model is None:
            return ""
        
        results = stamp_model(INPUT_IMAGE_PATH)

        # Load the image
        img = cv2.imread(INPUT_IMAGE_PATH)
        if img is None:
            return ""

        # Process results to get bounding boxes
        for r in results:
            for box in r.boxes:
                if box.conf > 0.5:  # Confidence threshold
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cropped_img = img[y1:y2, x1:x2]

                    # Generate a unique filename for the cropped image
                    base_filename = os.path.splitext(os.path.basename(INPUT_IMAGE_PATH))[0]
                    cropped_filename = f"{base_filename}_stamp_cropped_{box.id if box.id is not None else ''}.jpg"
                    
                    # Save in stamps folder
                    stamp_path = os.path.join(app.config['STAMP_FOLDER'], cropped_filename)
                    cv2.imwrite(stamp_path, cropped_img)
                    
                    return stamp_path
        
        return ""  # No stamp detected
    
    except Exception as e:
        print(f"Error in DETECT_STAMPS: {e}")
        return ""

def DETECT_SIGNATURES(INPUT_IMAGE_PATH):
    """Detect signatures from the image using YOLO model"""
    try:
        if signature_model is None:
            return ""
        
        results = signature_model(INPUT_IMAGE_PATH)

        # Load the image
        img = cv2.imread(INPUT_IMAGE_PATH)
        if img is None:
            return ""

        # Process results to get bounding boxes
        for r in results:
            for box in r.boxes:
                if box.conf > 0.5:  # Confidence threshold
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cropped_img = img[y1:y2, x1:x2]

                    # Generate a unique filename for the cropped image
                    base_filename = os.path.splitext(os.path.basename(INPUT_IMAGE_PATH))[0]
                    cropped_filename = f"{base_filename}_signature_cropped_{box.id if box.id is not None else ''}.jpg"
                    
                    # Save in signatures folder
                    signature_path = os.path.join(app.config['SIGNATURE_FOLDER'], cropped_filename)
                    cv2.imwrite(signature_path, cropped_img)
                    
                    return signature_path
        
        return ""  # No signature detected
    
    except Exception as e:
        print(f"Error in DETECT_SIGNATURES: {e}")
        return ""

def classify_document(image_path):
    """Classify document type only"""
    try:
        if model is None or processor is None:
            return "medical_leave"
        
        from qwen_vl_utils import process_vision_info
        
        messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_path},
                    {"type": "text", "text": classification_msg},
                ],
            },
        ]
        
        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")
        
        output_ids = model.generate(**inputs, max_new_tokens=32)
        trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, output_ids)
        ]
        output_text = processor.batch_decode(
            trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()
        
        return output_text.lower()
    
    except Exception as e:
        print(f"Classification error: {e}")
        return "medical_leave"

def classify_document_multiple_images(image_paths):
    """Classify document type using multiple images"""
    try:
        if model is None or processor is None:
            return "medical_leave"
        
        from qwen_vl_utils import process_vision_info
        
        # Create content array with multiple images
        content = []
        for image_path in image_paths:
            content.append({"type": "image", "image": image_path})
            break
        content.append({"type": "text", "text": classification_msg})
        
        messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": content,
            },
        ]
        
        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")
        
        output_ids = model.generate(**inputs, max_new_tokens=32)
        trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, output_ids)
        ]
        output_text = processor.batch_decode(
            trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()
        
        return output_text.lower()
    
    except Exception as e:
        print(f"Multi-image classification error: {e}")
        return "medical_leave"

def parse_document(image_path, doc_type):
    """Parse fields from document based on type"""
    try:
        if model is None or processor is None:
            return "Mock response - models not initialized"
        
        from qwen_vl_utils import process_vision_info
        
        # Select appropriate prompt
        if "medical" in doc_type:
            parsing_msg = medical_msg
        elif "reward" in doc_type:
            parsing_msg = reward_msg
        elif "punishment" in doc_type:
            parsing_msg = punishment_msg
        elif "probation" in doc_type:
            parsing_msg = probation_msg
        elif "earned" in doc_type:
            parsing_msg = earned_leave_msg
        else:
            return f"Unknown document type: {doc_type}"
        
        messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_path},
                    {"type": "text", "text": parsing_msg},
                ],
            },
        ]

        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")

        output_ids = model.generate(**inputs, max_new_tokens=256)
        trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, output_ids)
        ]
        output_text = processor.batch_decode(
            trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()

        return output_text
    
    except Exception as e:
        print(f"Parsing error: {e}")
        return f"Error processing document: {str(e)}"

def parse_document_multiple_images(image_paths, doc_type):
    """Parse fields from document using multiple images"""
    try:
        if model is None or processor is None:
            return "Mock response - models not initialized"
        
        from qwen_vl_utils import process_vision_info
        
        # Select appropriate prompt
        if "medical" in doc_type:
            parsing_msg = medical_msg
        elif "reward" in doc_type:
            parsing_msg = reward_msg
        elif "punishment" in doc_type:
            parsing_msg = punishment_msg
        elif "probation" in doc_type:
            parsing_msg = probation_msg
        elif "earned" in doc_type:
            parsing_msg = earned_leave_msg
        else:
            return f"Unknown document type: {doc_type}"
        
        # Create content array with multiple images
        content = []
        for image_path in image_paths:
            content.append({"type": "image", "image": image_path})
        content.append({"type": "text", "text": parsing_msg})
        
        messages = [
            {"role": "system", "content": system_Message},
            {
                "role": "user",
                "content": content,
            },
        ]

        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to("cuda" if torch.cuda.is_available() else "cpu")

        output_ids = model.generate(**inputs, max_new_tokens=256)
        trimmed_ids = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, output_ids)
        ]
        output_text = processor.batch_decode(
            trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()

        return output_text
    
    except Exception as e:
        print(f"Multi-image parsing error: {e}")
        return f"Error processing document: {str(e)}"

gemini_parser = GeminiFieldParser("AIzaSyAlOnQfpmg_snHpvVnVPxIiWrDBKMBe97k")

def parse_fields_from_text(text, doc_type):
    return gemini_parser.parse_document(text, doc_type)

# Configuration
UPLOAD_FOLDER = 'uploads'
STAMP_FOLDER = 'stamps'
SIGNATURE_FOLDER = 'signatures'
EXPORT_FOLDER = 'exports'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STAMP_FOLDER'] = STAMP_FOLDER
app.config['SIGNATURE_FOLDER'] = SIGNATURE_FOLDER
app.config['EXPORT_FOLDER'] = EXPORT_FOLDER

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STAMP_FOLDER, exist_ok=True)
os.makedirs(SIGNATURE_FOLDER, exist_ok=True)
os.makedirs(EXPORT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
def convert_pdf_to_images(pdf_path: str) -> list:
    """Convert PDF pages to images and return list of image paths"""
    try:
        # Open the PDF
        pdf_document = fitz.open(pdf_path)
        image_paths = []
        
        # Use the uploads folder instead of temporary directory
        upload_dir = app.config['UPLOAD_FOLDER']
        
        # Convert each page to image
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            
            # Set zoom factor for better quality (2x)
            mat = fitz.Matrix(2.0, 2.0)
            
            # Render page to image
            pix = page.get_pixmap(matrix=mat)
            
            # Generate image path in uploads folder
            image_filename = f"page_{page_num + 1}_{uuid.uuid4().hex[:8]}.jpg"
            image_path = os.path.join(upload_dir, image_filename)
            
            # Save image
            pix.save(image_path)
            image_paths.append(image_path)
        
        pdf_document.close()
        print(f"✅ Converted PDF to {len(image_paths)} images in uploads folder")
        return image_paths
        
    except Exception as e:
        print(f"❌ Error converting PDF to images: {e}")
        return []
# def convert_pdf_to_images(pdf_path: str) -> list:
#     """Convert PDF pages to images and return list of image paths"""
#     try:
#         # Open the PDF
#         pdf_document = fitz.open(pdf_path)
#         image_paths = []
        
#         # Create a temporary directory for the images
#         temp_dir = tempfile.mkdtemp()
        
#         # Convert each page to image
#         for page_num in range(len(pdf_document)):
#             page = pdf_document.load_page(page_num)
            
#             # Set zoom factor for better quality (2x)
#             mat = fitz.Matrix(2.0, 2.0)
            
#             # Render page to image
#             pix = page.get_pixmap(matrix=mat)
            
#             # Generate image path
#             image_filename = f"page_{page_num + 1}_{uuid.uuid4().hex[:8]}.jpg"
#             image_path = os.path.join(temp_dir, image_filename)
            
#             # Save image
#             pix.save(image_path)
#             image_paths.append(image_path)
        
#         pdf_document.close()
#         print(f"✅ Converted PDF to {len(image_paths)} images")
#         return image_paths
        
#     except Exception as e:
#         print(f"❌ Error converting PDF to images: {e}")
#         return []

# In your Flask backend

@app.route('/save-image', methods=['POST'])
def save_image():
    """Save uploaded image or PDF to server"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save file
            file.save(filepath)
            
            # Check if it's a PDF
            if filename.lower().endswith('.pdf'):
                # Convert PDF to images
                image_paths = convert_pdf_to_images(filepath)
                
                if image_paths:
                    # Convert image paths to URLs
                    image_urls = []
                    for img_path in image_paths:
                        img_filename = os.path.basename(img_path)
                        img_url = f"http://localhost:5000/uploads/{img_filename}"
                        image_urls.append(img_url)
                    
                    return jsonify({
                        'image_path': filepath,
                        'image_url': image_urls[0],  # First image for compatibility
                        'filename': unique_filename,
                        'is_pdf': True,
                        'image_paths': image_paths,
                        'image_urls': image_urls,
                        'page_count': len(image_paths)
                    })
                else:
                    return jsonify({'error': 'Failed to convert PDF to images'}), 500
            else:
                # Regular image file
                image_url = f"http://localhost:5000/uploads/{unique_filename}"
                
                return jsonify({
                    'image_path': filepath,
                    'image_url': image_url,
                    'filename': unique_filename,
                    'is_pdf': False,
                    'image_paths': [filepath],
                    'image_urls': [image_url],
                    'page_count': 1
                })
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/classify', methods=['POST'])
def classify_letter():
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        image_paths = data.get('image_paths', [])  # For multi-page PDFs
        
        if not image_path and not image_paths:
            return jsonify({'error': 'No image provided'}), 404
        
        # Handle multiple images (PDF pages)
        if image_paths and len(image_paths) > 1:
            print(f"📄 Processing {len(image_paths)} PDF pages")
            doc_type = classify_document_multiple_images(image_paths)
        else:
            # Single image processing (existing functionality)
            if not os.path.exists(image_path):
                return jsonify({'error': 'Image not found'}), 404
            doc_type = classify_document(image_path)
        
        # Normalize document type before mapping
        doc_type = normalize_document_type(doc_type)
        
        # Convert to frontend format
        type_mapping = {
            "medical_leave": "medical-leave",
            "reward_letter": "reward-letter", 
            "punishment_letter": "punishment-letter",
            "probation_letter": "probation-letter",
            "earned_leave_letter": "earned-leave"
        }
        
        letter_type = type_mapping.get(doc_type, "medical-leave")
        return jsonify({
            'letterType': letter_type,
            'confidence': 0.85
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-fields', methods=['POST'])
def detect_fields():
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        image_paths = data.get('image_paths', [])  # For multi-page PDFs
        
        if not image_path and not image_paths:
            return jsonify({'error': 'No image provided'}), 404
        
        # Handle multiple images (PDF pages)
        if image_paths and len(image_paths) > 1:
            print(f"📄 Processing {len(image_paths)} PDF pages for field extraction")
            # First classify
            doc_type = classify_document_multiple_images(image_paths)
            # Normalize document type
            doc_type = normalize_document_type(doc_type)
            # Then parse with multiple images
            parsed_text = parse_document_multiple_images(image_paths, doc_type)
        else:
            # Single image processing (existing functionality)
            if not os.path.exists(image_path):
                return jsonify({'error': 'Image not found'}), 404
            # First classify, then parse
            doc_type = classify_document(image_path)
            # Normalize document type
            doc_type = normalize_document_type(doc_type)
            parsed_text = parse_document(image_path, doc_type)
        
        # Parse into structured fields
        
        fields = gemini_parser.parse_document(parsed_text, doc_type)
        print('Detected fields: ', fields)
        return jsonify({
            'parsed_fields': fields['parsed_fields']  # This is the key!
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-stamp', methods=['POST'])
def detect_stamp():
    """Detect and save stamp from the image(s)"""
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        image_paths = data.get('image_paths', [])  # For multi-page PDFs
        
        if not image_path and not image_paths:
            return jsonify({'error': 'No image provided'}), 404
        
        # Handle multiple images (PDF pages)
        if image_paths and len(image_paths) > 1:
            print(f"📄 Processing {len(image_paths)} PDF pages for stamp detection")
            stamp_paths = []
            
            for img_path in image_paths:
                if os.path.exists(img_path):
                    stamp_path = DETECT_STAMPS(img_path)
                    if stamp_path:
                        stamp_paths.append(stamp_path)
            
            # Return the first detected stamp (or empty if none found)
            if stamp_paths:
                stamp_filename = os.path.basename(stamp_paths[0])
                stamp_url = f"http://localhost:5000/stamps/{stamp_filename}"
                return jsonify({
                    'stampImagePath': stamp_url
                })
            else:
                return jsonify({
                    'stampImagePath': ""
                })
        else:
            # Single image processing
            if not os.path.exists(image_path):
                return jsonify({'error': 'Image not found'}), 404
            
            # Use the stamp detection function
            stamp_path = DETECT_STAMPS(image_path)
            print('Stamp Detected Done', stamp_path)
            
            if stamp_path:
                # Convert local path to URL
                stamp_filename = os.path.basename(stamp_path)
                stamp_url = f"http://localhost:5000/stamps/{stamp_filename}"
                return jsonify({
                    'stampImagePath': stamp_url
                })
            else:
                return jsonify({
                    'stampImagePath': ""
                })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-signature', methods=['POST'])
def detect_signature():
    """Detect and save signature from the image(s)"""
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        image_paths = data.get('image_paths', [])  # For multi-page PDFs
        
        if not image_path and not image_paths:
            return jsonify({'error': 'No image provided'}), 404
        
        # Handle multiple images (PDF pages)
        if image_paths and len(image_paths) > 1:
            print(f"📄 Processing {len(image_paths)} PDF pages for signature detection")
            signature_paths = []
            
            for img_path in image_paths:
                if os.path.exists(img_path):
                    signature_path = DETECT_SIGNATURES(img_path)
                    if signature_path:
                        signature_paths.append(signature_path)
            
            # Return the first detected signature (or empty if none found)
            if signature_paths:
                signature_filename = os.path.basename(signature_paths[0])
                signature_url = f"http://localhost:5000/signatures/{signature_filename}"
                return jsonify({
                    'signatureImagePath': signature_url
                })
            else:
                return jsonify({
                    'signatureImagePath': ""
                })
        else:
            # Single image processing
            if not os.path.exists(image_path):
                return jsonify({'error': 'Image not found'}), 404
            
            # Use the signature detection function
            signature_path = DETECT_SIGNATURES(image_path)
            print('Signature Detected Done', signature_path)
            
            if signature_path:
                # Convert local path to URL
                signature_filename = os.path.basename(signature_path)
                signature_url = f"http://localhost:5000/signatures/{signature_filename}"
                return jsonify({
                    'signatureImagePath': signature_url
                })
            else:
                return jsonify({
                    'signatureImagePath': ""
                })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Database endpoints
@app.route('/documents', methods=['GET'])
def get_documents():
    """Get all documents from database"""
    try:
        documents = db.get_all_documents()
        return jsonify({'documents': documents})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/documents/<document_id>', methods=['GET'])
def get_document(document_id):
    """Get document by ID"""
    try:
        document = db.get_document_by_id(document_id)
        if document:
            return jsonify({'document': document})
        else:
            return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/documents', methods=['POST'])
def save_document():
    """Save document to database"""
    try:
        document_data = request.get_json()
        print(f"📝 Saving document: {document_data.get('id', 'No ID')}")
        print(f"📝 Document type: {document_data.get('type', 'No type')}")
        print(f"📝 Case ID: {document_data.get('caseId', 'No case ID')}")
        
        success = db.insert_document(document_data)
        
        if success:
            print(f"✅ Document saved successfully: {document_data.get('id', 'No ID')}")
            return jsonify({'message': 'Document saved successfully', 'id': document_data['id']})
        else:
            print(f"❌ Failed to save document: {document_data.get('id', 'No ID')}")
            return jsonify({'error': 'Failed to save document'}), 500
    except Exception as e:
        print(f"❌ Error saving document: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete document by ID"""
    try:
        success = db.delete_document(document_id)
        if success:
            return jsonify({'message': 'Document deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete document'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['GET'])
def search_documents():
    """Search documents"""
    try:
        query = request.args.get('q', '')
        document_type = request.args.get('type', None)
        
        documents = db.search_documents(query, document_type)
        return jsonify({'documents': documents})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/statistics', methods=['GET'])
def get_statistics():
    """Get database statistics"""
    try:
        stats = db.get_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Export endpoints
@app.route('/export/csv', methods=['GET'])
def export_csv():
    """Export all documents to CSV"""
    try:
        filepath = db.export_to_csv()
        if filepath and os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))
        else:
            return jsonify({'error': 'No data to export'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export/json', methods=['GET'])
def export_json():
    """Export all documents to JSON"""
    try:
        filepath = db.export_to_json()
        if filepath and os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))
        else:
            return jsonify({'error': 'No data to export'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export/excel', methods=['GET'])
def export_excel():
    """Export all documents to Excel"""
    try:
        filepath = db.export_to_excel()
        if filepath and os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=os.path.basename(filepath))
        else:
            return jsonify({'error': 'No data to export'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'AP Police Document Processing API is running'})

@app.route('/stamps/<filename>', methods=['GET'])
def serve_stamp(filename):
    """Serve stamp images"""
    try:
        stamp_path = os.path.join(app.config['STAMP_FOLDER'], filename)
        if os.path.exists(stamp_path):
            return send_file(stamp_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'Stamp image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/signatures/<filename>', methods=['GET'])
def serve_signature(filename):
    """Serve signature images"""
    try:
        signature_path = os.path.join(app.config['SIGNATURE_FOLDER'], filename)
        if os.path.exists(signature_path):
            return send_file(signature_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'Signature image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    """Serve uploaded images"""
    try:
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(upload_path):
            return send_file(upload_path, mimetype='image/jpeg')
        else:
            return jsonify({'error': 'Uploaded image not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def normalize_document_type(doc_type):
    """Normalize document type to handle variations in AI model output"""
    doc_type = doc_type.lower().strip()
    
    # Handle space-separated formats
    if "earned leave letter" in doc_type or "earned_leave_letter" in doc_type:
        return "earned_leave_letter"
    elif "medical leave" in doc_type or "medical_leave" in doc_type:
        return "medical_leave"
    elif "reward letter" in doc_type or "reward_letter" in doc_type:
        return "reward_letter"
    elif "punishment letter" in doc_type or "punishment_letter" in doc_type:
        return "punishment_letter"
    elif "probation letter" in doc_type or "probation_letter" in doc_type:
        return "probation_letter"
    else:
        # Return as is if no match found
        return doc_type

RESULTS_FOLDER = 'results'
os.makedirs(RESULTS_FOLDER, exist_ok=True)

@app.route('/save-result-json', methods=['POST'])
def save_result_json():
    try:
        data = request.get_json()
        # Use a unique filename, e.g., by id or timestamp
        doc_id = data.get('id') or str(uuid.uuid4())
        filename = f"{doc_id}.json"
        filepath = os.path.join(RESULTS_FOLDER, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({'message': 'Result saved as JSON', 'filename': filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize models on startup
    app.run(debug=True, host='0.0.0.0', port=5000) 