// services/authServices.ts
import { del, get, post } from "@/util/api/axios";
import {
  AuthUser,
  DeleteAccountOtpDTO,
  ForgotPasswordOtpDTO,
  LoginResponse,
  LoginUserDTO,
  OtpVerificationDTO,
  RegisterUserDTO,
  ResetPasswordDTO,
  SendOtpDTO,
  SimpleResponse,
} from "../types";

export const loginService = (data: LoginUserDTO) =>
  post<LoginResponse>("/auth/login", {
    identifier: data.email,
    password: data.password,
  });

export const createUserService = (data: RegisterUserDTO) => {
  const displayName = [data.firstName, data.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  return post<SimpleResponse>("/auth/register", {
    username: data.username,
    email: data.email,
    password: data.password,
    display_name: displayName || data.username,
    college: data.college,
  });
};

export const sendOtpService = (email: string) => {
  const dto: SendOtpDTO = { email };
  return post<SimpleResponse>("/auth/otp/resend", {
    ...dto,
    purpose: "register",
  });
};

export const verifyOtpService = (data: OtpVerificationDTO) =>
  post<SimpleResponse>("/auth/verify-otp", {
    email: data.email,
    code: data.otp,
    purpose: "register",
  });

export const deleteAccountService = async () => {
  await del<void>("/auth/me");
  return { status: "success", message: "Account deleted" };
};

export const sendDeleteOtpService = () =>
  post<SimpleResponse>("/auth/delete/send-otp", {});

export const deleteAccountWithOtpService = async (_data: DeleteAccountOtpDTO) => {
  await del<void>("/auth/me");
  return { status: "success", message: "Account deleted" };
};

export const sendForgotPasswordOtpService = (email: string) => {
  const dto: ForgotPasswordOtpDTO = { email };
  return post<SimpleResponse>("/auth/password/forgot", dto);
};

export const resetPasswordWithOtpService = (data: ResetPasswordDTO) =>
  post<SimpleResponse>("/auth/password/reset", {
    email: data.email,
    code: data.otp,
    new_password: data.newPassword,
  });

export const logoutService = () => post<void>("/auth/logout");

export const logoutAllService = () => post<void>("/auth/logout-all");

export const getMeService = () => get<AuthUser>("/auth/me");
