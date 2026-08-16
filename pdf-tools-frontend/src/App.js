import React, { useState } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("merge");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [outputFileName, setOutputFileName] = useState("");
  const [splitRange, setSplitRange] = useState({ start: 1, end: 1 });
  const [rotationAngle, setRotationAngle] = useState(90);
  const [password, setPassword] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setDownloadUrl(null);
    }
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      alert("Please upload at least one file!");
      return;
    }

    const API_URL = "https://pdf-buddy-backend-qpeh.onrender.com";
    const formData = new FormData();
    setLoading(true);
    setDownloadUrl(null);

    try {
      let endpoint = "";
      let filename = "result.pdf";

      if (activeTab === "merge") {
        if (selectedFiles.length < 2) {
          alert("Please select at least 2 PDF files to merge!");
          setLoading(false);
          return;
        }
        endpoint = API_URL + "/merge";
        selectedFiles.forEach((file) => formData.append("files", file));
        filename = "merged.pdf";
      } else if (activeTab === "split") {
        endpoint = API_URL + "/split?start_page=" + splitRange.start + "&end_page=" + splitRange.end;
        formData.append("file", selectedFiles[0]);
        filename = "split.pdf";
      } else if (activeTab === "rotate") {
        endpoint = API_URL + "/rotate?angle=" + rotationAngle;
        formData.append("file", selectedFiles[0]);
        filename = "rotated.pdf";
      } else if (activeTab === "protect") {
        if (!password.trim()) {
          alert("Please enter a password to protect the PDF!");
          setLoading(false);
          return;
        }
        endpoint = API_URL + "/protect?password=" + encodeURIComponent(password);
        formData.append("file", selectedFiles[0]);
        filename = "protected.pdf";
      } else if (activeTab === "pdf-to-images") {
        endpoint = API_URL + "/pdf-to-images";
        formData.append("file", selectedFiles[0]);
        filename = "extracted_images.zip";
      } else if (activeTab === "pdf-to-word") {
        endpoint = API_URL + "/pdf-to-word";
        formData.append("file", selectedFiles[0]);
        filename = "converted.docx";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process file on backend");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setOutputFileName(filename);
    } catch (err) {
      console.error(err);
      alert("Processing failed. Please check your backend connection!");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "merge", label: "Merge PDF" },
    { id: "split", label: "Split PDF" },
    { id: "rotate", label: "Rotate PDF" },
    { id: "protect", label: "Protect PDF" },
    { id: "pdf-to-images", label: "PDF to Images" },
    { id: "pdf-to-word", label: "PDF to Word" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-lg text-lg tracking-wider">
            PDF
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">PDF BUDDY</h1>
        </div>
        <span className="text-sm text-gray-500 font-medium">All-in-One Online PDF Tool</span>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col items-center">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 bg-gray-200/60 p-2 rounded-2xl mb-8 w-full max-w-2xl justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedFiles([]);
                setDownloadUrl(null);
              }}
              className={
                "py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-200 " +
                (activeTab === tab.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900 bg-transparent")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upload Container */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <div className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-8 text-center bg-gray-50/50 transition-colors flex flex-col items-center justify-center">
            <p className="text-gray-500 text-sm mb-4">Drag and drop your file(s) here, or</p>
            <label className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-6 py-2 rounded-lg text-sm transition-colors border border-blue-200">
              Browse Files
              <input
                type="file"
                multiple={activeTab === "merge"}
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {selectedFiles.length > 0 && (
              <p className="mt-4 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Selected ({selectedFiles.length}): {selectedFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>

          {/* Conditional Controls */}
          {activeTab === "split" && (
            <div className="flex space-x-4 mt-6 items-center">
              <label className="text-sm font-semibold text-gray-700">
                From Page:
                <input
                  type="number"
                  min="1"
                  value={splitRange.start}
                  onChange={(e) => setSplitRange({ ...splitRange, start: parseInt(e.target.value) || 1 })}
                  className="ml-2 border border-gray-300 rounded px-2 py-1 w-16 text-center"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700">
                To Page:
                <input
                  type="number"
                  min="1"
                  value={splitRange.end}
                  onChange={(e) => setSplitRange({ ...splitRange, end: parseInt(e.target.value) || 1 })}
                  className="ml-2 border border-gray-300 rounded px-2 py-1 w-16 text-center"
                />
              </label>
            </div>
          )}

          {activeTab === "rotate" && (
            <div className="mt-6 flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">Rotate By:</span>
              <select
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value={90}>90° Clockwise</option>
                <option value={180}>180° Upside Down</option>
                <option value={270}>270° Counter-Clockwise</option>
              </select>
            </div>
          )}

          {activeTab === "protect" && (
            <div className="mt-6 w-full max-w-xs">
              <input
                type="password"
                placeholder="Enter password to lock PDF"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleProcess}
            disabled={loading || selectedFiles.length === 0}
            className={
              "mt-6 w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md " +
              (loading || selectedFiles.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99]")
            }
          >
            {loading ? "Processing Document..." : "Execute Tool"}
          </button>

          {/* Download Button */}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={outputFileName}
              className="mt-4 w-full text-center py-3.5 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all animate-bounce"
            >
              Download {outputFileName}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
