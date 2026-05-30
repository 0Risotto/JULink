import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().refine(
    (val) => {
      const isEmail = z.string().email().safeParse(val).success;
      if (isEmail) return true;
      return val.length >= 3 && val.length <= 50;
    },
    {
      message: "Please enter a valid email or username (at least 3 characters)",
    }
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const validateLoginForm = (data: any) => {
  const result = loginSchema.safeParse(data);
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
