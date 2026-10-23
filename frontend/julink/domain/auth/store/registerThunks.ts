import { createAsyncThunk } from "@reduxjs/toolkit";
import { RegisterUserDTO, SimpleResponse } from "../types";
import { createUserService, sendOtpService, verifyOtpService } from "../services/authServices";

export const registerUserThunk = createAsyncThunk<
  SimpleResponse,
  RegisterUserDTO,
  { rejectValue: string }
>("register/createUser", async (userData, { rejectWithValue }) => {
  try {
    const response = await createUserService(userData);
    return response;
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail || "Registration failed";
    return rejectWithValue(message);
  }
});

export const sendOtpThunk = createAsyncThunk<
  SimpleResponse,
  string,
  { rejectValue: string }
>("register/sendOtp", async (email, { rejectWithValue }) => {
  try {
    return await sendOtpService(email);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail || "Failed to send OTP";
    return rejectWithValue(message);
  }
});

export const verifyOtpThunk = createAsyncThunk<
  SimpleResponse,
  { email: string; otp: string },
  { rejectValue: string }
>("register/verifyOtp", async (data, { rejectWithValue }) => {
  try {
    return await verifyOtpService(data);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail || "OTP verification failed";
    return rejectWithValue(message);
  }
});
