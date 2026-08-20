# 📄 PDF Buddy - All-in-One Full-Stack PDF Management Suite

A modern, fast, and secure full-stack web application designed for seamless PDF processing and manipulation.

🔗 **Live Demo:** [https://pdf-buddy-eta.vercel.app](https://pdf-buddy-eta.vercel.app)

---

## ✨ Features
* **Merge PDF:** Combine multiple PDF documents into a single file.
* **Split PDF:** Extract specific page ranges into new documents.
* **Rotate PDF:** Rotate pages by 90°, 180°, or 270°.
* **Protect PDF:** Add password encryption to sensitive PDF files.
* **PDF to Images:** Extract and convert PDF pages into image formats.
* **PDF to Word:** Convert document layouts into editable `.docx` files.

---

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Modern Glassmorphism UI
* **Backend:** Python FastAPI, Uvicorn, PyPDF / PyMuPDF / pdf2docx
* **Deployment:** Vercel (Frontend), Render (Backend), GitHub CI/CD

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd pdf-tools-backend
python -m venv venv
# On Windows:
source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload
