import axios from "axios";
import type { RegisterData } from "@/store/slices/authSlice";

const API_URL = "http://localhost:8080/entry"; 

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post(`${API_URL}/createUser`, data);
  return response.data;
};
