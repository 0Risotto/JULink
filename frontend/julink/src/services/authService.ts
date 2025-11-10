import axios from "axios";
import type { RegisterData, verifyOTPData } from "@/store/slices/authSlice";

const API_URL = "http://localhost:8080/entry"; 

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(`${API_URL}/createUser`, data);
  return response.data;
};

export const sendOTP = async (data: { email: string }) => {
  const response = await axios.post(`${API_URL}/sendOTP`, { email: data.email });
  return response.data;
};

export const verifyOTP = async (data: verifyOTPData) => {
  const response = await axios.post(`${API_URL}/checkOTPValidity`, data);
  return response.data;
};
