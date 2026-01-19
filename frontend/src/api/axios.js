import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Add token ONLY if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // IMPORTANT: only attach Authorization if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export default api;



