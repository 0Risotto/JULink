"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useAppDispatch } from "@/store/hooks";
import { bootstrapSession, getAccessToken } from "@/util/api/axios";
import { setSessionReady, setToken } from "@/domain/auth/store/loginSlice";
import { fetchMyProfile } from "@/domain/profile/store/userSlice";

function SessionBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const restored = await bootstrapSession();
        if (cancelled) return;

        if (restored) {
          dispatch(setToken(getAccessToken()));
          dispatch(fetchMyProfile());
        }
      } finally {
        if (!cancelled) dispatch(setSessionReady(true));
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
    </Provider>
  );
}
