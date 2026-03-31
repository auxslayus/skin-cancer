# DermAI: Deep Learning Skin Lesion Triage Platform

An AI-powered web application for analyzing dermatoscopic images and classifying skin lesions as either **Benign** or **Malignant (Potential Concern)**. The platform features an aggressive ImageNet anti-distractor filter and multi-model inference.

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
1. [Node.js](https://nodejs.org/) (v16+)
2. [Python](https://www.python.org/) 3.9+
3. [MongoDB Community Server](https://www.mongodb.com/try/download/community) (Running locally on port `27017`)

---

## 🚀 Installation & Setup

Since large machine learning datasets, model binaries, and security files are ignored in Git, you will need to set up your environment manually.

### 1. Database & Environment Setup
Navigate to the `server` directory and create an environment file.

```bash
cd server
touch .env
```

Add the following to your `.env` file:
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/skin-cancer-db
AI_SERVICE_URL=http://localhost:8001
JWT_SECRET=your_super_secret_jwt_key_here
```

### 2. Install Node Dependencies
You will need to install the Node modules for both the frontend (React) and the backend (Express).

```bash
# Open a new terminal for the Backend
cd server
npm install
node index.js  # Runs on http://localhost:5001

# Open a new terminal for the Frontend
cd ../client
npm install
npm run dev    # Runs on http://localhost:3000
```

### 3. Setup the AI Microservice (Python)
The AI engine runs on a dedicated FastAPI server. You must create a virtual environment and install the deep learning dependencies.

```bash
# Open a new terminal for the AI Service
cd ai_service

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn tensorflow pillow python-multipart requests tqdm

# Start the server
python main.py  # Runs on http://localhost:8001
```

---

## 🧠 Note regarding the AI Model (`skin_cancer_model.keras`)
Because the fully-trained AI model (`skin_cancer_model.keras`) is a massive binary file (often >50MB), it is blocked by `.gitignore`.

**What happens if the model is missing?**
- The `main.py` script has a **built-in fallback mechanism**. If it does not detect `skin_cancer_model.keras`, it will automatically load a generic ImageNet placeholder model so the application won't crash, but it will not be medically accurate. 

**How to get the real medical model:**
Run the training pipeline yourself! 
```bash
cd ai_service
source venv/bin/activate

# 1. Download the massive 2.7GB HAM10000 clinical dataset
python download_ham10000.py

# 2. Partition the 10,000 images into Benign/Malignant clinical mapping
python prepare_data.py

# 3. Train the neural network (Warning: Can take several hours on CPU)
python train.py
```
*Once training finishes, `skin_cancer_model.keras` will be dynamically generated and your platform will be clinically highly accurate.*
