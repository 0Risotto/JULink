import { createSlice } from "@reduxjs/toolkit";
import { RegisterUserDTO } from "../types";
import { registerUserThunk, sendOtpThunk, verifyOtpThunk } from "./registerThunks";

interface RegisterState {
  userData: RegisterUserDTO | null;
  loading: boolean;
  error: string | null;
  step: 'idle' | 'registering' | 'otp-sent' | 'verifying' | 'completed';
  otpExpiry?: number;
}

const initialState: RegisterState = {
  userData: null,
  loading: false,
  error: null,
  step: 'idle',
};

const registerSlice = createSlice({
  name: "register",
  initialState,
  reducers: {
    resetRegistration: (state) => {
      state.userData = null;
      state.loading = false;
      state.error = null;
      state.step = 'idle';
      state.otpExpiry = undefined;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOtpExpiry: (state, action) => {
      state.otpExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register user cases
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.step = 'registering';
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.meta.arg;
        state.step = 'otp-sent';
        // Set OTP expiry (e.g., 5 minutes from now)
        state.otpExpiry = Date.now() + 5 * 60 * 1000;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
        state.step = 'idle';
      })
      
      // Send OTP cases
      .addCase(sendOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state) => {
        state.loading = false;
        state.step = 'otp-sent';
        state.otpExpiry = Date.now() + 5 * 60 * 1000; // Reset expiry
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send OTP";
      })
      
      // Verify OTP cases
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.step = 'verifying';
      })
      .addCase(verifyOtpThunk.fulfilled, (state) => {
        state.loading = false;
        state.step = 'completed';
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "OTP verification failed";
        state.step = 'otp-sent'; // Go back to OTP sent state so user can try again
      });
  },
});

export const { resetRegistration, clearError, setOtpExpiry } = registerSlice.actions;
export default registerSlice.reducer;