import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Auto-attach JWT token to every request ──────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ────────────────────────────────────────────
export const register = async (data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const login = async (email: string, password: string) => {
  const res = await api.post(
    "/auth/login",
    new URLSearchParams({ username: email, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post(`/auth/forgot-password?email=${email}`);
  return res.data;
};

export const resetPassword = async (token: string, new_password: string) => {
  const res = await api.post(
    `/auth/reset-password?token=${token}&new_password=${new_password}`
  );
  return res.data;
};

// ── Crop recommendation ─────────────────────────────
export const getRecommendation = async (
  latitude: number,
  longitude: number,
  soilOverride?: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    ph?: number;
  }
) => {
  const res = await api.post("/crop", {
    location: { latitude, longitude },
    soil_override: soilOverride || null,
  });
  return res.data;
};

export const getHistory = async (limit = 10) => {
  const res = await api.get(`/crop/history?limit=${limit}`);
  return res.data;
};

// ── Soil & Weather ──────────────────────────────────
export const getSoil = async (lat: number, lon: number) => {
  const res = await api.get(`/soil?lat=${lat}&lon=${lon}`);
  return res.data;
};

export const getWeather = async (lat: number, lon: number) => {
  const res = await api.get(`/weather?lat=${lat}&lon=${lon}`);
  return res.data;
};

export default api;