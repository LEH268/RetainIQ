import axios from "axios"; 
import { auth } from "./firebase"; 

const api = axios.create({   
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",   
  headers: {     
    "Content-Type": "application/json",   
  }, 
});

api.interceptors.request.use(async (config) => {   
  const user = auth.currentUser;   
  if (user) {     
    const token = await user.getIdToken();     
    config.headers.Authorization = `Bearer ${token}`;   
  }
  return config; 
});

api.interceptors.response.use(   
  (response) => response,   
  (error) => {     
    if (error.response?.status === 401) {       
      console.warn("Request rejected as unauthorized by the API.");     
    }     
    return Promise.reject(error); 
  }
);

export default api;