import { LOGIN, LOGOUT } from '../constants/actionTypes';
import { AuthAction, AuthState } from '../types/actionTypes';

const initialState: AuthState = { authData: null };

const loginReducer = (state: AuthState = initialState, action: AuthAction): AuthState => {
    switch (action.type) {
        case LOGIN:
            localStorage.setItem('profile', JSON.stringify({ ...action.data }));
            return { ...state, authData: action.data };

        case LOGOUT:
            localStorage.clear();
            return { ...state, authData: null };

        default:
            return state;
    }
}

export default loginReducer;