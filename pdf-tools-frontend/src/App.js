import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('merge');
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleProcess = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Please select file(s) first!");
      return;
    }

    setLoading(true);
    setDownloadUrl(null);
    const formData = new FormData();

    try {
      let endpoint = "http://localhost:8000/" + activeTab;
      let resultFileName = 'result.pdf';

      if (activeTab === 'merge') {
        resultFileName = 'merged.pdf';
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
      } else if (activeTab === 'img-to-pdf') {
        resultFileName = 'images_combined.pdf';
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append('files', selectedFiles[i]);
        }
      } else if (activeTab === 'pdf-to-word') {
        resultFileName = 'converted.docx';
        formData.append('file', selectedFiles[0]);
      } else if (activeTab === 'split') {
        resultFileName = 'split.pdf';
        formData.append('file', selectedFiles[0]);
        formData.append('start_page', startPage);
        formData.append('end_page', endPage);
      } else if (activeTab === 'compress') {
        resultFileName = 'compressed.pdf';
        formData.append('file', selectedFiles[0]);
      }

      const response = await axios.post(endpoint, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl({ url, name: resultFileName });
    } catch (error) {
      alert("Processing failed. Make sure your Python backend is active!");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files);
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7fe', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0', padding: '16px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '20px' }}>PDF</span>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#1f2937', fontWeight: '700' }}>PDF BUDDY</h1>
        </div>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>All-in-One Online Document Studio</span>
      </header>

      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {[
            { id: 'merge', label: 'Merge PDF' },
            { id: 'img-to-pdf', label: 'Image to PDF' },
            { id: 'pdf-to-word', label: 'PDF to Word' },
            { id: 'split', label: 'Split PDF' },
            { id: 'compress', label: 'Compress PDF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setDownloadUrl(null); setSelectedFiles(null); }}
              style={{
                padding: '12px 10px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === tab.id ? '#4f46e5' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#4b5563',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              borderStyle: 'dashed',
              borderWidth: '2px',
              borderColor: isDragging ? '#4f46e5' : '#cbd5e1',
              borderRadius: '10px',
              padding: '40px 20px',
              backgroundColor: isDragging ? '#eef2ff' : '#f8fafc',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
          >
            <p style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#475569', fontWeight: '500' }}>
              Drag and drop your file(s) here, or
            </p>
            <label style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}>
              Browse Files
              <input
                type="file"
                multiple={activeTab === 'merge' || activeTab === 'img-to-pdf'}
                accept={activeTab === 'img-to-pdf' ? "image/*" : ".pdf"}
                onChange={(e) => setSelectedFiles(e.target.files)}
                style={{ display: 'none' }}
              />
            </label>

            {selectedFiles && selectedFiles.length > 0 && (
              <div style={{ marginTop: '16px', color: '#059669', fontWeight: '600', fontSize: '14px' }}>
                Selected ({selectedFiles.length}): {Array.from(selectedFiles).map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {activeTab === 'split' && (
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                From Page:
                <input type="number" min="1" value={startPage} onChange={(e) => setStartPage(e.target.value)} style={{ width: '60px', marginLeft: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </label>
              <label style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                To Page:
                <input type="number" min="1" value={endPage} onChange={(e) => setEndPage(e.target.value)} style={{ width: '60px', marginLeft: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </label>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            {loading ? 'Processing Document...' : 'Execute Tool'}
          </button>

          {downloadUrl && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <a href={downloadUrl.url} download={downloadUrl.name} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '12px 28px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                  Download {downloadUrl.name}
                </button>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;