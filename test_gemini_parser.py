#!/usr/bin/env python3
"""
Test script for the new Gemini field parser
"""

import sys
import json
from datetime import datetime

# Add backend to path
sys.path.append('backend')

def test_gemini_parser():
    """Test the Gemini field parser with the provided example"""
    
    # Test data - your provided JSON
    test_json = {
        "Name": "D. Narasimhudu",
        "Date of Submission": "24-02-2022",
        "Coy Belongs to": "A' coy Vijayawada",
        "Rank": "HC - 881",
        "Leave Reason": "SICK LEAVE",
        "Phone Number": "9963367131",
        "Unit and District": "14th BN APSP 'A' coy Vijayawada"
    }
    
    print("🧪 Testing Gemini Field Parser")
    print("=" * 50)
    
    try:
        # Import the Gemini parser
        from backend.gemini_field_parser import gemini_parser
        
        # Convert JSON to string (as it would come from AI model)
        raw_text = json.dumps(test_json, indent=2)
        
        print(f"📄 Document Type: medical_leave")
        print(f"📝 Raw AI Output:")
        print(raw_text)
        print("\n" + "-" * 50)
        
        # Test the parser
        print("🔄 Processing with Gemini API...")
        parsed_fields = gemini_parser.parse_fields_from_text(raw_text, "medical_leave")
        
        print("\n✅ Parsed Fields:")
        print(json.dumps(parsed_fields, indent=2))
        
        # Test with missing fields
        print("\n" + "=" * 50)
        print("🧪 Testing with missing fields...")
        
        incomplete_json = {
            "Name": "D. Narasimhudu",
            "Rank": "HC - 881",
            "Leave Reason": "SICK LEAVE"
            # Missing other fields
        }
        
        incomplete_text = json.dumps(incomplete_json, indent=2)
        incomplete_fields = gemini_parser.parse_fields_from_text(incomplete_text, "medical_leave")
        
        print("\n✅ Parsed Fields (with missing data):")
        print(json.dumps(incomplete_fields, indent=2))
        
        # Test with different document type
        print("\n" + "=" * 50)
        print("🧪 Testing with earned leave letter...")
        
        earned_leave_json = {
            "R c No.": "B4/149/2020",
            "H.O.D No.": "72/2020",
            "Name": "John Doe",
            "Date": "15-01-2024",
            "Number of Days": "7",
            "Leave From Date": "20-01-2024",
            "Leave To Date": "27-01-2024",
            "Leave Reason": "Personal emergency"
        }
        
        earned_leave_text = json.dumps(earned_leave_json, indent=2)
        earned_leave_fields = gemini_parser.parse_fields_from_text(earned_leave_text, "earned_leave_letter")
        
        print("\n✅ Parsed Fields (Earned Leave):")
        print(json.dumps(earned_leave_fields, indent=2))
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Error testing Gemini parser: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gemini_parser() 