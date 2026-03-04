import { configureStore } from "@reduxjs/toolkit";
import loginReducer from "@/domain/auth/store/loginSlice";
import registerReducer from "@/domain/auth/store/registerSlice";

export const store = configureStore({
  reducer: {
    login: loginReducer,
    register:registerReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
