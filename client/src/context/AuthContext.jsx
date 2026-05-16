/**
 * Auth Context – EcoReward
 * Provides global auth state via React Context + useReducer.
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';

/* ─── State ─────────────────────────────────────────────────────── */
const initialState = {
  user:    null,
  token:   localStorage.getItem('eco_token') || null,
  loading: true,
  error:   null,
};

const AuthContext = createContext(null);

/* ─── Reducer ───────────────────────────────────────────────────── */
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.user, token: action.token, loading: false, error: null };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false };
    case 'SET_USER':
      return { ...state, user: action.user, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message, loading: false };
    default:
      return state;
  }
}

/* ─── Provider ──────────────────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount, re-hydrate user from stored token
  useEffect(() => {
    const rehydrate = async () => {
      if (!state.token) return dispatch({ type: 'SET_LOADING', value: false });
      try {
        const { data } = await authService.profile();
        dispatch({ type: 'SET_USER', user: data.data.user });
      } catch {
        dispatch({ type: 'LOGOUT' });
        localStorage.removeItem('eco_token');
      }
    };
    rehydrate();
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const { data } = await authService.login({ email, password });
      localStorage.setItem('eco_token', data.token);
      dispatch({ type: 'LOGIN_SUCCESS', user: data.data.user, token: data.token });
      return data;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.response?.data?.message || 'Login failed' });
      throw err;
    }
  };

  const register = async (payload) => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const { data } = await authService.register(payload);
      localStorage.setItem('eco_token', data.token);
      dispatch({ type: 'LOGIN_SUCCESS', user: data.data.user, token: data.token });
      return data;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.response?.data?.message || 'Registration failed' });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('eco_token');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (updates) => {
    dispatch({ type: 'SET_USER', user: { ...state.user, ...updates } });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────────────── */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
