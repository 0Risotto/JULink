import { createAsyncThunk } from "@reduxjs/toolkit";
import { LoginUserDTO, LoginResponse } from "../types";
import { loginService } from "../services/authServices";

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
