import sqlite3
import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd

class APPoliceDatabase:
    def __init__(self, db_path: str = "app_police.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def init_database(self):
        """Initialize database and create tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                document_type TEXT NOT NULL,
                fields TEXT NOT NULL,
                original_image TEXT,
                stamp_image TEXT,
                signature_image TEXT,
                extracted_text TEXT,
                status TEXT DEFAULT 'validated',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create processing_logs table for tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processing_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents (id)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_document_type ON documents(document_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_created_at ON documents(created_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON documents(status)')
        
        # Migrate existing database to add signature_image column if it doesn't exist
        try:
            cursor.execute('ALTER TABLE documents ADD COLUMN signature_image TEXT')
            print("✅ Added signature_image column to existing database")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("✅ signature_image column already exists")
            else:
                print(f"⚠️ Migration note: {e}")
        
        conn.commit()
        conn.close()
        print(f"✅ Database initialized: {self.db_path}")
    
    def insert_document(self, document: Dict[str, Any]) -> bool:
        """Insert a new document record"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO documents (
                    id, case_id, document_type, fields, original_image, 
                    stamp_image, signature_image, extracted_text, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                document['id'],
                document['caseId'],
                document['type'],
                json.dumps(document['fields']),
                document.get('originalImage'),
                document.get('stampImage'),
                document.get('signatureImage'),
                document.get('extractedText'),
                document.get('status', 'validated'),
                document['createdAt'],
                document['updatedAt']
            ))
            
            # Log the insertion
            cursor.execute('''
                INSERT INTO processing_logs (document_id, action, details)
                VALUES (?, ?, ?)
            ''', (
                document['id'],
                'INSERT',
                f"Document type: {document['type']}, Case ID: {document['caseId']}"
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error inserting document: {e}")
            return False
    
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM documents ORDER BY created_at DESC')
            rows = cursor.fetchall()
            
            documents = []
            for row in rows:
                doc = dict(row)
                doc['fields'] = json.loads(doc['fields'])
                doc['createdAt'] = doc['created_at']
                doc['updatedAt'] = doc['updated_at']
                doc['caseId'] = doc['case_id']
                # Map signature_image to signatureImage for frontend compatibility
                doc['signatureImage'] = doc.get('signature_image')
                documents.append(doc)
            
            conn.close()
            return documents
            
        except Exception as e:
            print(f"❌ Error fetching documents: {e}")
            return []
    
    def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM documents WHERE id = ?', (document_id,))
            row = cursor.fetchone()
            
            if row:
                doc = dict(row)
                doc['fields'] = json.loads(doc['fields'])
                doc['createdAt'] = doc['created_at']
                doc['updatedAt'] = doc['updated_at']
                doc['caseId'] = doc['case_id']
                # Map signature_image to signatureImage for frontend compatibility
                doc['signatureImage'] = doc.get('signature_image')
                conn.close()
                return doc
            
            conn.close()
            return None
            
        except Exception as e:
            print(f"❌ Error fetching document: {e}")
            return None
    
    def delete_document(self, document_id: str) -> bool:
        """Delete document by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM documents WHERE id = ?', (document_id,))
            
            # Log the deletion
            cursor.execute('''
                INSERT INTO processing_logs (document_id, action, details)
                VALUES (?, ?, ?)
            ''', (document_id, 'DELETE', 'Document deleted'))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error deleting document: {e}")
            return False
    
    def search_documents(self, query: str, document_type: str = None) -> List[Dict[str, Any]]:
        """Search documents by query and optional type filter"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if document_type:
                cursor.execute('''
                    SELECT * FROM documents 
                    WHERE (case_id LIKE ? OR fields LIKE ?) AND document_type = ?
                    ORDER BY created_at DESC
                ''', (f'%{query}%', f'%{query}%', document_type))
            else:
                cursor.execute('''
                    SELECT * FROM documents 
                    WHERE case_id LIKE ? OR fields LIKE ?
                    ORDER BY created_at DESC
                ''', (f'%{query}%', f'%{query}%'))
            
            rows = cursor.fetchall()
            
            documents = []
            for row in rows:
                doc = dict(row)
                doc['fields'] = json.loads(doc['fields'])
                doc['createdAt'] = doc['created_at']
                doc['updatedAt'] = doc['updated_at']
                doc['caseId'] = doc['case_id']
                # Map signature_image to signatureImage for frontend compatibility
                doc['signatureImage'] = doc.get('signature_image')
                documents.append(doc)
            
            conn.close()
            return documents
            
        except Exception as e:
            print(f"❌ Error searching documents: {e}")
            return []
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Total documents
            cursor.execute('SELECT COUNT(*) FROM documents')
            total_documents = cursor.fetchone()[0]
            
            # Documents by type
            cursor.execute('''
                SELECT document_type, COUNT(*) as count 
                FROM documents 
                GROUP BY document_type
            ''')
            documents_by_type = dict(cursor.fetchall())
            
            # Documents by status
            cursor.execute('''
                SELECT status, COUNT(*) as count 
                FROM documents 
                GROUP BY status
            ''')
            documents_by_status = dict(cursor.fetchall())
            
            # Recent activity (last 7 days)
            cursor.execute('''
                SELECT COUNT(*) FROM documents 
                WHERE created_at >= datetime('now', '-7 days')
            ''')
            recent_documents = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'total_documents': total_documents,
                'documents_by_type': documents_by_type,
                'documents_by_status': documents_by_status,
                'recent_documents': recent_documents
            }
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {}
    
    def export_to_csv(self, filepath: str = None) -> str:
        """Export all documents to CSV format"""
        try:
            documents = self.get_all_documents()
            
            if not documents:
                return ""
            
            # Flatten the data for CSV
            csv_data = []
            for doc in documents:
                row = {
                    'ID': doc['id'],
                    'Case ID': doc['caseId'],
                    'Document Type': doc['type'],
                    'Status': doc['status'],
                    'Created At': doc['createdAt'],
                    'Updated At': doc['updatedAt'],
                    'Original Image': doc.get('originalImage', ''),
                    'Stamp Image': doc.get('stampImage', ''),
                    'Extracted Text': doc.get('extractedText', '')
                }
                
                # Add fields as separate columns
                for field_name, field_value in doc['fields'].items():
                    row[f'Field_{field_name}'] = str(field_value)
                
                csv_data.append(row)
            
            # Generate filename if not provided
            if not filepath:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filepath = f"exports/ap_police_documents_{timestamp}.csv"
            
            # Ensure exports directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Write CSV
            df = pd.DataFrame(csv_data)
            df.to_csv(filepath, index=False)
            
            return filepath
            
        except Exception as e:
            print(f"❌ Error exporting to CSV: {e}")
            return ""
    
    def export_to_json(self, filepath: str = None) -> str:
        """Export all documents to JSON format"""
        try:
            documents = self.get_all_documents()
            
            if not documents:
                return ""
            
            # Generate filename if not provided
            if not filepath:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filepath = f"exports/ap_police_documents_{timestamp}.json"
            
            # Ensure exports directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Write JSON
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(documents, f, indent=2, ensure_ascii=False, default=str)
            
            return filepath
            
        except Exception as e:
            print(f"❌ Error exporting to JSON: {e}")
            return ""
    
    def export_to_excel(self, filepath: str = None) -> str:
        """Export all documents to Excel format"""
        try:
            documents = self.get_all_documents()
            
            if not documents:
                return ""
            
            # Flatten the data for Excel
            excel_data = []
            for doc in documents:
                row = {
                    'ID': doc['id'],
                    'Case ID': doc['caseId'],
                    'Document Type': doc['type'],
                    'Status': doc['status'],
                    'Created At': doc['createdAt'],
                    'Updated At': doc['updatedAt'],
                    'Original Image': doc.get('originalImage', ''),
                    'Stamp Image': doc.get('stampImage', ''),
                    'Extracted Text': doc.get('extractedText', '')
                }
                
                # Add fields as separate columns
                for field_name, field_value in doc['fields'].items():
                    row[f'Field_{field_name}'] = str(field_value)
                
                excel_data.append(row)
            
            # Generate filename if not provided
            if not filepath:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filepath = f"exports/ap_police_documents_{timestamp}.xlsx"
            
            # Ensure exports directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Write Excel
            df = pd.DataFrame(excel_data)
            df.to_excel(filepath, index=False, engine='openpyxl')
            
            return filepath
            
        except Exception as e:
            print(f"❌ Error exporting to Excel: {e}")
            return ""

# Global database instance
db = APPoliceDatabase() 