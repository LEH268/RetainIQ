import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (import.meta.env.DEV) {
      console.error(`[api] ${status || "network"} ${error.config?.url}`, detail || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;