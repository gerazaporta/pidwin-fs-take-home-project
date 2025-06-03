// Action types
export enum ActionType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT"
  }

  // Auth data type
  export interface AuthData {
    token: string;
  }

  // Actions interfaces
  export interface LoginAction {
    type: ActionType.LOGIN;
    data: AuthData;
  }

  export interface LogoutAction {
    type: ActionType.LOGOUT;
  }

  export type AuthAction = LoginAction | LogoutAction;

  // State interfaces
  export interface AuthState {
    authData: AuthData | null;
  }

  // Form data interfaces
  export interface LoginFormData {
    email: string;
    password: string;
  }

  export interface SignupFormData extends LoginFormData {
    firstName: string;
    lastName: string;
    confirmPassword: string;
  }

  export interface PasswordChangeFormData {
    email: string;
    oldPassword: string;
    newPassword: string;
  }

export interface PlaceWagerFormData {
  amount: number;
  isLucky7Wager: boolean;
}

  // User interface
  export interface UserData {
    _id: string;
    name: string;
    email: string;
    password: string;
    tokens: number;
    exp?: number;
    picture?: string;
  }
