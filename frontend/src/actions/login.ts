import { LOGIN, LOGOUT } from "../constants/actionTypes";
import * as api from "../api";
import * as messages from "../messages";
import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import { NavigateFunction } from "react-router-dom";
import { SignupFormData, LoginFormData, PasswordChangeFormData } from "../types/actionTypes";

export const signup = (formData: SignupFormData, history: NavigateFunction) => 
  async (dispatch: ThunkDispatch<any, any, AnyAction>) => {
    try {
      const { data } = await api.signUp(formData);
      dispatch({ type: LOGIN, data });
      history("/");
      messages.success("Login Successful");
    } catch (error: any) {
      messages.error(error.response?.data?.message || "Signup failed");
    }
  };

export const login = (formData: LoginFormData, history: NavigateFunction) => 
  async (dispatch: ThunkDispatch<any, any, AnyAction>) => {
    try {
      const { data } = await api.login(formData);
      dispatch({ type: LOGIN, data });
      history("/");
      messages.success("Login Successful");
    } catch (error: any) {
      messages.error(error.response?.data?.message || "Login failed");
    }
  };

export const changePassword = (formData: PasswordChangeFormData, history: NavigateFunction) => 
  async (dispatch: ThunkDispatch<any, any, AnyAction>) => {
    try {
      const { data } = await api.changePassword(formData);
      dispatch({ type: LOGOUT, data });
      messages.success("Password Change Was Successful");
      history("/");
    } catch (error: any) {
      messages.error(error.response?.data?.message || "Password change failed");
    }
  };