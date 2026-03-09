#!/usr/bin/env python3
"""
Setup script for the AI Model Training System
Automates installation and initial configuration
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(message):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {message}")
    print("=" * 80 + "\n")

def run_command(command, cwd=None, check=True, use_list=False):
    """Run a shell command and return success status"""
    try:
        if isinstance(command, list) or use_list:
            print(f"Running: {' '.join(command) if isinstance(command, list) else command}")
            cmd = command if isinstance(command, list) else command.split()
        else:
            print(f"Running: {command}")
            cmd = command
        
        result = subprocess.run(
            cmd,
            shell=(not isinstance(command, list) and not use_list),
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is adequate"""
    print_header("Checking Python Version")
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print("❌ Python 3.10 or higher is required!")
        return False
    
    print("✅ Python version is adequate")
    return True

def install_python_dependencies():
    """Install Python dependencies"""
    print_header("Installing Python Dependencies")
    
    nlp_dir = Path(__file__).parent / "nlp_model"
    requirements_file = nlp_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    # Upgrade pip first
    print("Upgrading pip...")
    run_command([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], use_list=True)
    
    # Install dependencies
    print(f"Installing dependencies from {requirements_file}...")
    success = run_command(
        [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
        cwd=str(nlp_dir),
        use_list=True
    )
    
    if success:
        print("✅ Python dependencies installed successfully")
    else:
        print("❌ Failed to install some Python dependencies")
    
    return success

def download_nltk_data():
    """Download required NLTK data"""
    print_header("Downloading NLTK Data")
    
    try:
        import nltk
        print("Downloading punkt tokenizer...")
        nltk.download('punkt', quiet=False)
        print("Downloading stopwords...")
        nltk.download('stopwords', quiet=False)
        print("✅ NLTK data downloaded successfully")
        return True
    except Exception as e:
        print(f"❌ Error downloading NLTK data: {e}")
        return False

def check_tesseract():
    """Check if Tesseract OCR is installed"""
    print_header("Checking Tesseract OCR")
    
    try:
        result = subprocess.run(
            ["tesseract", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout.split('\n')[0])
        print("✅ Tesseract OCR is installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  Tesseract OCR not found")
        print("\nTo install Tesseract:")
        print("  Windows: https://github.com/UB-Mannheim/tesseract/wiki")
        print("  Linux:   sudo apt-get install tesseract-ocr")
        print("  macOS:   brew install tesseract")
        print("\nNote: Tesseract is optional but recommended for image processing")
        return False

def create_directories():
    """Create necessary directories"""
    print_header("Creating Directories")
    
    root = Path(__file__).parent
    dirs = [
        root / "nlp_model" / "data" / "raw" / "uploads",
        root / "nlp_model" / "models" / "question_generator",
        root / "nlp_model" / "checkpoints" / "question_gen",
        root / "nlp_model" / "logs",
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {dir_path}")
    
    return True

def check_node():
    """Check if Node.js is installed"""
    print_header("Checking Node.js")
    
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        version = result.stdout.strip()
        print(f"Node.js version: {version}")
        
        # Check if version is adequate (18+)
        major_version = int(version.lstrip('v').split('.')[0])
        if major_version < 18:
            print("⚠️  Node.js 18 or higher is recommended")
        else:
            print("✅ Node.js version is adequate")
        
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not found")
        print("Please install Node.js from https://nodejs.org/")
        return False

def install_node_dependencies():
    """Install Node.js dependencies"""
    print_header("Installing Node.js Dependencies")
    
    root = Path(__file__).parent
    
    # Check if package.json exists
    if not (root / "package.json").exists():
        print("❌ package.json not found")
        return False
    
    # Install dependencies
    print("Running npm install...")
    success = run_command("npm install", cwd=root)
    
    if success:
        print("✅ Node.js dependencies installed successfully")
    else:
        print("❌ Failed to install Node.js dependencies")
    
    return success

def create_env_file():
    """Create .env.local file if it doesn't exist"""
    print_header("Checking Environment Configuration")
    
    root = Path(__file__).parent
    env_file = root / ".env.local"
    
    if env_file.exists():
        print("✅ .env.local already exists")
        return True
    
    print("Creating .env.local file...")
    
    env_content = """# NLP API Configuration
NLP_API_URL=http://localhost:8000

# Database (if using PostgreSQL)
# DATABASE_URL=postgresql://user:password@localhost:5432/feedmind

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Optional: API Keys for fallback AI providers
# GROQ_API_KEY=your-groq-api-key
# GOOGLE_API_KEY=your-google-api-key
"""
    
    try:
        env_file.write_text(env_content)
        print("✅ Created .env.local file")
        print("⚠️  Please update the values in .env.local as needed")
        return True
    except Exception as e:
        print(f"❌ Error creating .env.local: {e}")
        return False

def print_next_steps():
    """Print instructions for next steps"""
    print_header("Setup Complete! 🎉")
    
    print("Next steps:\n")
    print("1. Start the Python NLP API:")
    print("   cd nlp_model")
    print("   python run_api.py")
    print()
    print("2. In a new terminal, start the Next.js app:")
    print("   npm run dev")
    print()
    print("3. Open your browser:")
    print("   http://localhost:3000")
    print()
    print("4. Upload training data:")
    print("   Navigate to /data-upload")
    print("   Upload PDFs, CSVs, images, etc.")
    print("   Click 'Start Training'")
    print()
    print("5. Generate questions:")
    print("   Create a new form")
    print("   Use the AI Suggestion panel")
    print()
    print("📚 Documentation:")
    print("   - QUICK_START.md")
    print("   - AI_TRAINING_SYSTEM_README.md")
    print()
    print("=" * 80)

def main():
    """Main setup function"""
    print_header("FeedMind AI Training System - Setup")
    print("This script will set up your development environment\n")
    
    steps = [
        ("Checking Python version", check_python_version),
        ("Creating directories", create_directories),
        ("Installing Python dependencies", install_python_dependencies),
        ("Downloading NLTK data", download_nltk_data),
        ("Checking Tesseract OCR", check_tesseract),
        ("Checking Node.js", check_node),
        ("Installing Node.js dependencies", install_node_dependencies),
        ("Creating environment file", create_env_file),
    ]
    
    results = []
    
    for step_name, step_func in steps:
        try:
            success = step_func()
            results.append((step_name, success))
        except Exception as e:
            print(f"❌ Error in {step_name}: {e}")
            results.append((step_name, False))
    
    # Print summary
    print_header("Setup Summary")
    for step_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {step_name}")
    
    # Check if all critical steps passed
    critical_failures = [name for name, success in results if not success and name not in ["Checking Tesseract OCR"]]
    
    if not critical_failures:
        print_next_steps()
        return 0
    else:
        print("\n⚠️  Some critical steps failed. Please address the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
