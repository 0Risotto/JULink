import { createAsyncThunk } from "@reduxjs/toolkit";
import { LoginUserDTO, LoginResponse } from "../types";
import { loginService } from "../services/authServices";
import { rememberAccessToken } from "@/util/api/axios";

export const loginThunk = createAsyncThunk<
  LoginResponse,
  LoginUserDTO,
  { rejectValue: string }
>("login/login", async (data, { rejectWithValue }) => {
  try {
    const response = await loginService(data);

    if (!response.access_token) {
      return rejectWithValue("Login failed");
    }

    rememberAccessToken(response.access_token);
    return response;
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail || "Server error";
    return rejectWithValue(message);
  }
});
