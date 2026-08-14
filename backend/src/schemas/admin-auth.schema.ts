import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
