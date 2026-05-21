import { createSlice } from "@reduxjs/toolkit";
import { loginThunk } from "./loginThunks";

interface LoginState {
  token: string | null;
  isFirstLogin: boolean | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isFirstLogin: null,
  loading: false,
  error: null,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.isFirstLogin = null;
      localStorage.removeItem("token");
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
        state.token = action.payload.token || null;
        state.isFirstLogin = action.payload.isFirstLogin ?? null;

        if (action.payload.token) {
          localStorage.setItem("token", action.payload.token);
        }
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { logout } = loginSlice.actions;
export default loginSlice.reducer;