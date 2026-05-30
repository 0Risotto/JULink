// services/authServices.ts
import { post, del, request } from "@/util/api/axios";
import {
  LoginUserDTO,
  LoginResponse,
  RegisterUserDTO,
  SimpleResponse,
  OtpVerificationDTO,
  SendOtpDTO,
  ForgotPasswordOtpDTO,
  ResetPasswordDTO,
  DeleteAccountOtpDTO,
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

export const sendForgotPasswordOtpService = (email: string) => {
  const dto: ForgotPasswordOtpDTO = { email };
  return post<{ status: string; message?: string }>("/auth/password/forgot/send-otp", dto);
};

export const resetPasswordWithOtpService = (data: ResetPasswordDTO) =>
  post<{ status: string; message?: string }>("/auth/password/forgot/reset", data);

export const sendDeleteOtpService = () =>
  post<{ status: string; message?: string }>("/auth/delete/send-otp", {});

export const deleteAccountWithOtpService = (data: DeleteAccountOtpDTO) =>
  request<{ status: string; message?: string }>("DELETE", "/auth/delete/verify", data);
