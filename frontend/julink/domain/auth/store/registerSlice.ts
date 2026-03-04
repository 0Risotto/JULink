import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RegisterUserDTO, SimpleResponse } from "../types";
import { createUserService, sendOtpService, verifyOtpService } from "../services/authServices";

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

// First step: Create user account
export const registerUserThunk = createAsyncThunk<
  SimpleResponse,
  RegisterUserDTO,
  { rejectValue: string }
>("register/createUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await createUserService(userData);
    
    // Backend returns "success" string on success
    if (response !== "success") {
      return rejectWithValue("Registration failed");
    }
    
    return response;
  } catch (error: any) {
    if (error.response?.data?.message) {
      return rejectWithValue(error.response.data.message);
    }
    return rejectWithValue("Server error during registration");
  }
});

// Second step: Send OTP
export const sendOtpThunk = createAsyncThunk<
  SimpleResponse,
  string,
  { rejectValue: string }
>("register/sendOtp", async (email, { rejectWithValue }) => {
  try {
    const response = await sendOtpService(email);
    
    if (response !== "success") {
      return rejectWithValue("Failed to send OTP");
    }
    
    return response;
  } catch (error: any) {
    if (error.response?.data?.message) {
      return rejectWithValue(error.response.data.message);
    }
    return rejectWithValue("Server error sending OTP");
  }
});

// Third step: Verify OTP
export const verifyOtpThunk = createAsyncThunk<
  SimpleResponse,
  { email: string; otp: string },
  { rejectValue: string }
>("register/verifyOtp", async (data, { rejectWithValue }) => {
  try {
    const response = await verifyOtpService(data);
    
    if (response !== "success") {
      return rejectWithValue("OTP verification failed");
    }
    
    return response;
  } catch (error: any) {
    if (error.response?.data?.message) {
      return rejectWithValue(error.response.data.message);
    }
    return rejectWithValue("Server error verifying OTP");
  }
});

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