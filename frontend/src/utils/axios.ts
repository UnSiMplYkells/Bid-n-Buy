import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://bid-n-buy.onrender.com";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Needed to send refresh token cookie to Render
});

// Request Interceptor: Automatically inject dynamic JWT bearer tokens
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-logout user if unauthorized (e.g. Token Expired)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If unauthorized and not already retrying, logout or refresh can be handled here.
      // For simplicity, we can log the user out if they hit a expired access token.
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);
