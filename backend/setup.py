#!/usr/bin/env python3
"""
Setup script for AP Police Document Processing Backend
"""

import os
import sys
import subprocess
import requests
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def create_directories():
    """Create necessary directories"""
    print("Creating directories...")
    directories = ["uploads", "stamps", "models"]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def download_stamp_model():
    """Download the stamp detection model"""
    print("Setting up stamp detection model...")
    
    # Check if stamp model exists
    stamp_model_path = "stamp_detection.pt"
    if os.path.exists(stamp_model_path):
        print("✅ Stamp detection model already exists")
        return True
    
    print("⚠️  Stamp detection model not found. Please:")
    print("   1. Place your 'stamp_detection.pt' file in the backend directory")
    print("   2. Or train/download a YOLO model for stamp detection")
    print("   3. Rename it to 'stamp_detection.pt'")
    
    return False

def setup_environment():
    """Setup environment variables"""
    print("Setting up environment...")
    
    # Create .env file if it doesn't exist
    env_file = ".env"
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("# AP Police Document Processing Environment Variables\n")
            f.write("FLASK_ENV=development\n")
            f.write("FLASK_DEBUG=1\n")
            f.write("UPLOAD_FOLDER=uploads\n")
            f.write("STAMP_FOLDER=stamps\n")
        print("✅ Created .env file")

def main():
    """Main setup function"""
    print("🚀 Setting up AP Police Document Processing Backend...")
    print("=" * 50)
    
    # Create directories
    create_directories()
    
    # Install requirements
    if not install_requirements():
        print("❌ Setup failed during requirements installation")
        return False
    
    # Setup environment
    setup_environment()
    
    # Check stamp model
    download_stamp_model()
    
    print("=" * 50)
    print("✅ Setup completed!")
    print("\n📋 Next steps:")
    print("1. Ensure you have the stamp_detection.pt model file")
    print("2. Update the model_name in app.py to use your actual vision model")
    print("3. Run: python app.py")
    print("4. The API will be available at: http://localhost:5000")
    
    return True

if __name__ == "__main__":
    main() 