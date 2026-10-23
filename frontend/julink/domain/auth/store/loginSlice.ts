import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loginThunk } from "./loginThunks";
import { clearAccessToken, getAccessToken } from "@/util/api/axios";

interface LoginState {
  token: string | null;
  sessionReady: boolean;
  firstLogin: boolean | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  token: getAccessToken(),
  sessionReady: false,
  firstLogin: null,
  loading: false,
  error: null,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setSessionReady: (state, action: PayloadAction<boolean>) => {
      state.sessionReady = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.firstLogin = null;
      clearAccessToken();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.firstLogin = action.payload.user.first_login;
        state.sessionReady = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { setToken, setSessionReady, logout } = loginSlice.actions;
export default loginSlice.reducer;
