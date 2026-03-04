import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { LoginUserDTO, LoginResponse } from "../types";
import { loginService } from "../services/authServices";

interface LoginState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  token: null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk<
  LoginResponse,
  LoginUserDTO,
  { rejectValue: string }
>("login/login", async (data, { rejectWithValue }) => {
  try {
    const response = await loginService(data);

    if (response.status !== "success") {
      return rejectWithValue(response.message || "Login failed");
    }

    return response;
  } catch {
    return rejectWithValue("Server error");
  }
});

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
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
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      });
  },
});

export const { logout } = loginSlice.actions;
export default loginSlice.reducer;