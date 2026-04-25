import { createAsyncThunk } from "@reduxjs/toolkit";
import { RegisterUserDTO, SimpleResponse } from "../types";
import { createUserService, sendOtpService, verifyOtpService } from "../services/authServices";

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
