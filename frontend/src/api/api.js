import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL
      ? `${process.env.REACT_APP_API_BASE_URL}/api/dashboard`
      : "http://localhost:8000/api/dashboard",
});

export default api;