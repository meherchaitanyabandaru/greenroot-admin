import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../../api/authStorage';
import type { User } from '../../api/apiTypes';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

const stored = typeof window !== 'undefined' ? getStoredAuth() : null;

const initialState: AuthState = {
  accessToken: stored?.accessToken ?? null,
  refreshToken: stored?.refreshToken ?? null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user?: unknown }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = (action.payload.user as User | undefined) ?? state.user;
      setStoredAuth({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      });
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      clearStoredAuth();
    },
  },
});

export const { clearAuth, setCredentials, setCurrentUser } = authSlice.actions;
export default authSlice.reducer;
