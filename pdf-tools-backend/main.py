import os
import io
import zipfile
from typing import List
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader, PdfWriter
from pdf2docx import Converter
from pdf2image import convert_from_bytes

app = FastAPI(title="PDF Buddy Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "PDF Buddy Backend is Running!"}

@app.post("/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    writer = PdfWriter()
    for file in files:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        for page in reader.pages:
            writer.add_page(page)
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=merged.pdf"}
    )

@app.post("/split")
async def split_pdf(
    file: UploadFile = File(...),
    start_page: int = Query(1, ge=1),
    end_page: int = Query(1, ge=1)
):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    total_pages = len(reader.pages)
    
    if start_page > total_pages or end_page > total_pages or start_page > end_page:
        raise HTTPException(status_code=400, detail="Invalid page range")
        
    writer = PdfWriter()
    for p in range(start_page - 1, end_page):
        writer.add_page(reader.pages[p])
        
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=split.pdf"}
    )

@app.post("/rotate")
async def rotate_pdf(
    file: UploadFile = File(...),
    angle: int = Query(90, enum=[90, 180, 270])
):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(angle)
        writer.add_page(page)
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rotated.pdf"}
    )

@app.post("/protect")
async def protect_pdf(
    file: UploadFile = File(...),
    password: str = Query(...)
):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=protected.pdf"}
    )

@app.post("/pdf-to-images")
async def pdf_to_images(file: UploadFile = File(...)):
    contents = await file.read()
    images = convert_from_bytes(contents)
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for i, img in enumerate(images):
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG')
            zip_file.writestr(f"page_{i + 1}.jpg", img_byte_arr.getvalue())
    zip_buffer.seek(0)
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=extracted_images.zip"}
    )

@app.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    temp_pdf = f"temp_{file.filename}"
    temp_docx = temp_pdf.replace(".pdf", ".docx")
    with open(temp_pdf, "wb") as f:
        f.write(await file.read())
    try:
        cv = Converter(temp_pdf)
        cv.convert(temp_docx)
        cv.close()
        with open(temp_docx, "rb") as f:
            docx_data = f.read()
        return Response(
            content=docx_data,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=converted.docx"}
        )
    finally:
        if os.path.exists(temp_pdf):
            os.remove(temp_pdf)
        if os.path.exists(temp_docx):
            os.remove(temp_docx)
