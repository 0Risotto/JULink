import axios from "axios";
import type { RegisterData, verifyOTPData ,loginUserData} from "@/store/slices/authSlice";

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

// to do here -> make a storage state where user's token can be saved.
export const loginUser = async (data:loginUserData)=>{
  const response = await axios.post(`${API_URL}/loginUser`, data);
  return response.data;
};
