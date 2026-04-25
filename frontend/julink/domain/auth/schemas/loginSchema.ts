import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
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
