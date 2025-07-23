#!/usr/bin/env python3
"""
Setup script for AP Police Document Processing System
Initializes SQLite database and creates necessary directories
"""

import os
import sys
from pathlib import Path

def create_directories():
    """Create necessary directories for the application"""
    directories = [
        'uploads',
        'stamps', 
        'exports',
        'logs'
    ]
    
    print("📁 Creating directories...")
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"   ✅ Created: {directory}/")

def setup_database():
    """Initialize the SQLite database"""
    try:
        from database import db
        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = [
        'flask',
        'flask-cors', 
        'pillow',
        'opencv-python',
        'numpy',
        'pandas',
        'openpyxl'
    ]
    
    print("📦 Checking dependencies...")
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} (missing)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("   Install them using: pip install -r requirements.txt")
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚀 AP Police Document Processing System Setup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Setup failed: Missing dependencies")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Setup database
    if not setup_database():
        print("\n❌ Setup failed: Database initialization error")
        sys.exit(1)
    
    print("\n✅ Setup completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Start the backend server: python app.py")
    print("   2. Start the frontend: npm run dev")
    print("   3. Access the application at: http://localhost:5173")
    print("\n📚 For more information, see README.md")

if __name__ == "__main__":
    main() 