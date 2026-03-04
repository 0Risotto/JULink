import axios, { AxiosResponse } from "axios";
import {
  LoginUserDTO,
  LoginResponse,
  RegisterUserDTO,
  SimpleResponse,
  OtpVerificationDTO,
  SendOtpDTO,
} from "../types";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

const postRequest = async <T>(
  url: string,
  data?: unknown
): Promise<T> => {
  const response: AxiosResponse<T> = await api.post(url, data);
  return response.data;
};

export const loginService = (data: LoginUserDTO) =>
  postRequest<LoginResponse>("/entry/loginUser", data);

export const createUserService = (data: RegisterUserDTO) =>
  postRequest<SimpleResponse>("/entry/createUser", data);

export const sendOtpService = (email: string) => {
  const dto: SendOtpDTO = { email };
  return postRequest<SimpleResponse>("/entry/sendOTP", dto);
};

export const verifyOtpService = (data: OtpVerificationDTO) =>
  postRequest<SimpleResponse>("/entry/checkOTPValidity", data);