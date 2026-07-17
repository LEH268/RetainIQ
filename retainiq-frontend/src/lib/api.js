// Axios client for the FastAPI backend
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("retainiq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
