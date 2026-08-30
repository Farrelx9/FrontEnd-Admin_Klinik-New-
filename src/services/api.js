import axios from "axios";

// Base URL of the REST API. Set in .env via VITE_API_URL.
const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach token to every outgoing request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("klinik_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: if the token is invalid/expired, clear it and
// send the user back to login. AuthContext listens for this event so
// it can also reset in-memory state (not just storage).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("klinik_token");
      window.dispatchEvent(new Event("klinik:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default api;

