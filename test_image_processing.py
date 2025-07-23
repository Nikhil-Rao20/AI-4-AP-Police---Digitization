#!/usr/bin/env python3
"""
Test script to process a specific image file and show results
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append('backend')

def test_image_processing():
    """Process the specific image and show results"""
    
    # Image path
    image_path = r"C:\Users\nikhi\Downloads\content\all_images\Earned Leave sample_1.jpg"
    
    print("🔍 Processing Image: Earned Leave sample_1.jpg")
    print("=" * 60)
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    print(f"✅ Image found: {image_path}")
    
    try:
        # Import backend functions
        from backend.database import db
        from backend.app import RUN_THE_MAIN_PROCESSING, DETECT_STAMPS
        
        print("\n📋 Step 1: Document Classification and Field Extraction")
        print("-" * 50)
        
        # Process the image
        result = RUN_THE_MAIN_PROCESSING(image_path)
        
        print(f"📄 Document Type: {result['document_type']}")
        print(f"📝 Extracted Fields: {result['parsed_fields']}")
        
        print("\n🖼️  Step 2: Stamp Detection")
        print("-" * 50)
        
        # Detect stamps
        stamp_path = DETECT_STAMPS(image_path)
        
        if stamp_path:
            print(f"✅ Stamp detected and saved to: {stamp_path}")
        else:
            print("❌ No stamp detected")
        
        print("\n💾 Step 3: Save to Database")
        print("-" * 50)
        
        # Create document record
        document = {
            'id': f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'caseId': f"AP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'type': result['document_type'].replace('_', '-'),
            'fields': {
                'extracted_text': result['parsed_fields'],
                'original_image': image_path,
                'stamp_image': stamp_path if stamp_path else None
            },
            'originalImage': image_path,
            'stampImage': stamp_path if stamp_path else None,
            'extractedText': result['parsed_fields'],
            'status': 'validated',
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        # Save to database
        success = db.insert_document(document)
        
        if success:
            print(f"✅ Document saved to database with ID: {document['id']}")
            
            # Retrieve and show the saved document
            saved_doc = db.get_document_by_id(document['id'])
            if saved_doc:
                print(f"📊 Database Record:")
                print(f"   - Case ID: {saved_doc.get('caseId', 'N/A')}")
                print(f"   - Type: {saved_doc.get('type', 'N/A')}")
                print(f"   - Status: {saved_doc.get('status', 'N/A')}")
                print(f"   - Created: {saved_doc.get('createdAt', 'N/A')}")
                print(f"   - Fields: {json.dumps(saved_doc.get('fields', {}), indent=2)}")
        else:
            print("❌ Failed to save document to database")
        
        print("\n📈 Step 4: Database Statistics")
        print("-" * 50)
        
        stats = db.get_statistics()
        print(f"📊 Total Documents: {stats.get('total_documents', 0)}")
        print(f"📊 Documents by Type: {stats.get('documents_by_type', {})}")
        
        print("\n🎉 Processing Complete!")
        
    except Exception as e:
        print(f"❌ Error processing image: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_image_processing() 