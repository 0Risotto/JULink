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
        router.push("/");
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
