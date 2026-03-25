import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "http://localhost:8000/api/upload/receipt",
      formData
    );

    setResult(res.data.data);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <button onClick={handleUpload} style={{ marginTop: "10px" }}>
        Upload
      </button>

      {result && (
        <pre style={{ marginTop: "20px", background: "#eee", padding: "10px" }}>
          {result}
        </pre>
      )}
    </div>
  );
}