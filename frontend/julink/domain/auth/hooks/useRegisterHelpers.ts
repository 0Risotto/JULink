import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "../store/registerSlice";

export const useRegisterErrorClear = () => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.register);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const clearRegisterError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return { error, clearRegisterError };
};

export const useOtpExpiry = () => {
  const { otpExpiry } = useAppSelector((state) => state.register);

  const isOtpExpired = useCallback(() => {
    if (!otpExpiry) return false;
    return Date.now() > otpExpiry;
  }, [otpExpiry]);

  return { otpExpiry, isOtpExpired };
};
