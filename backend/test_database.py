#!/usr/bin/env python3
"""
Test script for AP Police Database functionality
"""

import json
from datetime import datetime
from database import db

def test_database_operations():
    """Test basic database operations"""
    print("🧪 Testing Database Operations")
    print("=" * 40)
    
    # Test document insertion
    test_document = {
        'id': 'test-001',
        'caseId': 'AP-123456',
        'type': 'medical-leave',
        'fields': {
            'name': 'John Doe',
            'rank': 'PC',
            'date': '2024-01-15',
            'reason': 'Medical emergency'
        },
        'originalImage': 'uploads/test_image.jpg',
        'stampImage': 'stamps/test_stamp.jpg',
        'extractedText': 'Sample extracted text',
        'status': 'validated',
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }
    
    print("1. Testing document insertion...")
    success = db.insert_document(test_document)
    print(f"   Result: {'✅ Success' if success else '❌ Failed'}")
    
    # Test document retrieval
    print("\n2. Testing document retrieval...")
    retrieved_doc = db.get_document_by_id('test-001')
    if retrieved_doc:
        print(f"   ✅ Document found: {retrieved_doc['caseId']}")
    else:
        print("   ❌ Document not found")
    
    # Test get all documents
    print("\n3. Testing get all documents...")
    all_docs = db.get_all_documents()
    print(f"   ✅ Found {len(all_docs)} documents")
    
    # Test search functionality
    print("\n4. Testing search functionality...")
    search_results = db.search_documents('John')
    print(f"   ✅ Search results: {len(search_results)} documents")
    
    # Test statistics
    print("\n5. Testing statistics...")
    stats = db.get_statistics()
    print(f"   ✅ Total documents: {stats.get('total_documents', 0)}")
    print(f"   ✅ Documents by type: {stats.get('documents_by_type', {})}")
    
    # Test export functionality
    print("\n6. Testing export functionality...")
    csv_path = db.export_to_csv()
    json_path = db.export_to_json()
    excel_path = db.export_to_excel()
    
    print(f"   ✅ CSV export: {'Success' if csv_path else 'Failed'}")
    print(f"   ✅ JSON export: {'Success' if json_path else 'Failed'}")
    print(f"   ✅ Excel export: {'Success' if excel_path else 'Failed'}")
    
    # Test document deletion
    print("\n7. Testing document deletion...")
    delete_success = db.delete_document('test-001')
    print(f"   Result: {'✅ Success' if delete_success else '❌ Failed'}")
    
    # Verify deletion
    deleted_doc = db.get_document_by_id('test-001')
    if not deleted_doc:
        print("   ✅ Document successfully deleted")
    else:
        print("   ❌ Document still exists after deletion")
    
    print("\n🎉 Database test completed!")

if __name__ == "__main__":
    test_database_operations() 