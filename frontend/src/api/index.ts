import axios from "axios";
import {LoginFormData, SignupFormData, PasswordChangeFormData, PlaceWagerFormData} from "../types/actionTypes";

const API = axios.create({ baseURL: "http://localhost:5500" });

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
export const changePassword = (formData: PasswordChangeFormData) => API.post("/api/user/changePassword", formData);
// Game related endpoints
export const placeWager = (formData: PlaceWagerFormData) => API.post("/api/game/placeWager", formData);
export const getWinStreaks = () => API.get("/api/game/winStreaks");
export const getRecentRolls = (userId: string) => API.get(`/api/game/recentRolls?userId=${userId}`);
