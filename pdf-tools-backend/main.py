from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pypdf import PdfWriter, PdfReader
from pdf2docx import Converter
import os
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. MERGE PDF
@app.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    merger = PdfWriter()
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        merger.append(file_path)
    
    output_path = os.path.join(OUTPUT_DIR, "merged.pdf")
    merger.write(output_path)
    merger.close()
    return FileResponse(output_path, filename="merged.pdf")

# 2. PDF TO WORD
@app.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    output_path = os.path.join(OUTPUT_DIR, f"{os.path.splitext(file.filename)[0]}.docx")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    cv = Converter(input_path)
    cv.convert(output_path)
    cv.close()
    
    return FileResponse(output_path, filename=os.path.basename(output_path))

# 3. SPLIT PDF
@app.post("/split")
async def split_pdf(file: UploadFile = File(...), start_page: int = Form(1), end_page: int = Form(1)):
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    output_path = os.path.join(OUTPUT_DIR, "split_output.pdf")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    for page_num in range(start_page - 1, min(end_page, len(reader.pages))):
        writer.add_page(reader.pages[page_num])
        
    with open(output_path, "wb") as f:
        writer.write(f)
        
    return FileResponse(output_path, filename="split_output.pdf")

# 4. COMPRESS PDF
@app.post("/compress")
async def compress_pdf(file: UploadFile = File(...)):
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    output_path = os.path.join(OUTPUT_DIR, "compressed.pdf")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    reader = PdfReader(input_path)
    writer = PdfWriter()
    
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)
        
    with open(output_path, "wb") as f:
        writer.write(f)
        
    return FileResponse(output_path, filename="compressed.pdf")