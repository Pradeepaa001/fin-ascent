import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div>
      {/* Simple Navigation */}
      <div style={styles.nav}>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("upload")}>Upload</button>
      </div>

      {/* Page Switch */}
      {page === "dashboard" ? <Dashboard /> : <Upload />}
    </div>
  );
}

export default App;

const styles = {
  nav: {
    display: "flex",
    gap: "10px",
    padding: "10px",
    background: "#eee",
  },
};