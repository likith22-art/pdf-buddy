import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfWriter, PdfReader
from pdf2docx import Converter

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "PDF Buddy Backend is live!"}

@app.post("/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least two PDF files to merge.")
    
    merger = PdfWriter()
    for file in files:
        pdf_bytes = await file.read()
        merger.append(io.BytesIO(pdf_bytes))
    
    output = io.BytesIO()
    merger.write(output)
    merger.close()
    output.seek(0)
    
    return StreamingResponse(
        output, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=merged.pdf"}
    )

@app.post("/split")
async def split_pdf(
    file: UploadFile = File(...), 
    start_page: int = Query(1), 
    end_page: int = Query(1)
):
    pdf_bytes = await file.read()
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    total_pages = len(reader.pages)
    if start_page < 1 or end_page > total_pages or start_page > end_page:
        raise HTTPException(status_code=400, detail="Invalid page range.")

    for page_num in range(start_page - 1, end_page):
        writer.add_page(reader.pages[page_num])

    output = io.BytesIO()
    writer.write(output)
    writer.close()
    output.seek(0)

    return StreamingResponse(
        output, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=split.pdf"}
    )

@app.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    pdf_stream = io.BytesIO(pdf_bytes)
    
    # Save temporary PDF for converter
    temp_pdf_path = "/tmp/temp.pdf" if hasattr(io, "tmp") else "temp_input.pdf"
    temp_docx_path = "temp_output.docx"
    
    with open(temp_pdf_path, "wb") as f:
        f.write(pdf_stream.getbuffer())
        
    cv = Converter(temp_pdf_path)
    cv.convert(temp_docx_path, start=0, end=None)
    cv.close()

    with open(temp_docx_path, "rb") as f:
        docx_bytes = f.read()

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=converted.docx"}
    )