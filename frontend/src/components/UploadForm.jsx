import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/upload/receipt`,
        formData
      );

      setResult(res?.data?.data ?? res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{ marginTop: "10px" }}
      >
        {loading ? "Processing…" : "Upload"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 12,
            background: "#fee3e2",
            border: "1px solid #fecdd2",
            color: "#b91c1c",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <pre
          style={{
            marginTop: "20px",
            background: "rgba(0,0,0,0.04)",
            padding: "12px",
            borderRadius: "12px",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}