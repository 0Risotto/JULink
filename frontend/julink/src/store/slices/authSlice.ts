import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { registerUser, sendOTP, verifyOTP } from "@/services/authService";

export interface RegisterData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  college: string;
  password: string;
}

export interface verifyOTPData{
  email: string;
  otp: string;
  
}
interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  success: false,
};

export const registerUserThunk = createAsyncThunk(
  "auth/register",
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const res = await registerUser(data);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || "Registration failed");
    }
  }
);

export const sendOTPThunk = createAsyncThunk(
  "auth/sendOTP",
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const res = await sendOTP(data);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || "OTP sending failed");
    }
  }
);

export const verifyOTPThunk = createAsyncThunk(
  "auth/verifyOTP",
  async (data: verifyOTPData, { rejectWithValue }) => {
    try {
      const res = await verifyOTP(data);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || "OTP verification failed");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetState } = authSlice.actions;
export default authSlice.reducer;
