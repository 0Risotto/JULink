"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginThunk } from "../store/loginThunks";
import { handleLoginSuccess } from "./useLoginHelpers";

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { loading, error, token } = useAppSelector((state) => state.login);

  const login = useCallback(
    async (email: string, password: string) => {
      const resultAction = await dispatch(loginThunk({ email, password }));

      if (loginThunk.fulfilled.match(resultAction)) {
        console.log("Login successful, token:", resultAction.payload.token);
        await handleLoginSuccess(router, resultAction.payload);
      } else if (loginThunk.rejected.match(resultAction)) {
        console.log("Login failed:", resultAction.payload);
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
