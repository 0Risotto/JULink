"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetRegistration } from "../store/registerSlice";
import { registerUserThunk, sendOtpThunk, verifyOtpThunk } from "../store/registerThunks";
import { RegisterUserDTO } from "../types";
import { useRegisterErrorClear, useOtpExpiry } from "./useRegisterHelpers";

export const useRegister = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { userData, loading, step } = useAppSelector((state) => state.register);
  const { error, clearRegisterError } = useRegisterErrorClear();
  const { otpExpiry, isOtpExpired } = useOtpExpiry();

  // Step 1: Create user account
  const registerUser = useCallback(
    async (userData: RegisterUserDTO) => {
      const resultAction = await dispatch(registerUserThunk(userData));
      
      if (registerUserThunk.fulfilled.match(resultAction)) {
        return true;
      }
      return false;
    },
    [dispatch]
  );

  // Step 2: Send OTP (can be called separately if needed)
  const sendOtp = useCallback(
    async (email: string) => {
      const resultAction = await dispatch(sendOtpThunk(email));
      return registerUserThunk.fulfilled.match(resultAction);
    },
    [dispatch]
  );

  // Step 3: Verify OTP
  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!userData?.email) {
        return false;
      }

      if (isOtpExpired()) {
        // Automatically resend OTP if expired
        await sendOtp(userData.email);
        return false;
      }

      const resultAction = await dispatch(
        verifyOtpThunk({ email: userData.email, otp })
      );

      if (verifyOtpThunk.fulfilled.match(resultAction)) {
        // After successful verification, redirect to login with success message
        router.push("/login?registration=success");
        // Reset registration state after successful completion
        setTimeout(() => {
          dispatch(resetRegistration());
        }, 100);
        return true;
      }
      return false;
    },
    [dispatch, router, userData?.email, sendOtp, isOtpExpired]
  );

  // Resend OTP
  const resendOtp = useCallback(async () => {
    if (!userData?.email) return false;
    return await sendOtp(userData.email);
  }, [userData?.email, sendOtp]);

  // Reset the entire registration process
  const reset = useCallback(() => {
    dispatch(resetRegistration());
  }, [dispatch]);

  return {
    // Actions
    registerUser,
    sendOtp,
    verifyOtp,
    resendOtp,
    reset,
    clearError: clearRegisterError,
    
    // State
    userData,
    loading,
    error,
    step,
    otpExpiry,
    
    // Helper flags
    isRegistering: step === 'registering',
    isOtpSent: step === 'otp-sent',
    isVerifying: step === 'verifying',
    isCompleted: step === 'completed',
    isIdle: step === 'idle',
    isOtpExpired: isOtpExpired(),
    
    // Derived state
    email: userData?.email,
  };
};