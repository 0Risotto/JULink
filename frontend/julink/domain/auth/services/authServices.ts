// services/authServices.ts
import { post, del } from "@/util/api/axios";
import {
  LoginUserDTO,
  LoginResponse,
  RegisterUserDTO,
  SimpleResponse,
  OtpVerificationDTO,
  SendOtpDTO,
} from "../types";

export const loginService = (data: LoginUserDTO) =>
  post<LoginResponse>("/auth/login", data);

export const createUserService = (data: RegisterUserDTO) =>
  post<SimpleResponse>("/auth/register", data);

export const sendOtpService = (email: string) => {
  const dto: SendOtpDTO = { email };
  return post<SimpleResponse>("/auth/send-otp", dto);
};

export const verifyOtpService = (data: OtpVerificationDTO) =>
  post<SimpleResponse>("/auth/verify-otp", data);

export const deleteAccountService = () =>
  del<{ status: string; message: string }>("/auth/kill");
