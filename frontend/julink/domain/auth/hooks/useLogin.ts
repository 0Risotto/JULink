"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginThunk } from "../store/loginSlice";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { loading, error, token } = useAppSelector((state) => state.login);

  const login = useCallback(
    async (email: string, password: string) => {
      const resultAction = await dispatch(loginThunk({ email, password }));

      if (loginThunk.fulfilled.match(resultAction)) {
        console.log("Login successful, token:", resultAction.payload.token);
        const token = resultAction.payload.token;
        setTimeout(() => {
          router.push("/profile"); 
        }, 100);
      } else if (loginThunk.rejected.match(resultAction)) {
        console.error("Login failed:", resultAction.payload);
      }
    },
    [dispatch, router],
  );

  return {
    login,
    loading,
    error,
    token,
    isAuthenticated: !!token,
  };
};