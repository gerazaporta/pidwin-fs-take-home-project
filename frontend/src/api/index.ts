import axios from "axios";
import { LoginFormData, SignupFormData, PasswordChangeFormData } from "../types/actionTypes";

const API = axios.create({ baseURL: "http://localhost:5000" });

API.interceptors.request.use((req) => {
  if (localStorage.getItem("profile")) {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${profile.token}`;
  }
  return req;
});

export const login = (formData: LoginFormData) => API.post("/api/user/login", formData);
export const signUp = (formData: SignupFormData) => API.post("/api/user/signup", formData);
export const changePassword = (formData: PasswordChangeFormData) =>
  API.post("/api/user/changePassword", formData);