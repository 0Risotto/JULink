"use client";

import { useRegister } from "../hooks/useRegister";
import { RegisterForm } from "./RegisterForm";
import { OtpVerificationForm } from "./OtpVerificationForm";

export function RegisterCard() {
  const { isOtpSent } = useRegister();

  if (isOtpSent) {
    return <OtpVerificationForm />;
  }

  return <RegisterForm />;
}
