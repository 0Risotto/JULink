import { z } from "zod";
import { Colleges } from "../types";

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  email: z.string().email("Invalid email address").endsWith("@ju.edu.jo", "Must be a valid @ju.edu.jo email"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  college: z.string().min(1, "Please select a valid faculty"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const validateRegisterForm = (data: any) => {
  const result = registerSchema.safeParse(data);
  if (result.success) {
    return { success: true, errors: null };
  } else {
    const errorMessages: Record<string, string> = {};
    result.error.issues.forEach((err: any) => {
      if (err.path) {
        errorMessages[err.path[0]] = err.message;
      }
    });
    return { success: false, errors: errorMessages };
  }
};
