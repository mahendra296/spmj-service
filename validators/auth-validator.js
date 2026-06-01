import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .trim()
    .toLowerCase(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const validateAdminLogin = (data) => {
  return adminLoginSchema.safeParse(data);
};
