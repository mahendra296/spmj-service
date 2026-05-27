import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(1, "Username is required")
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const validateAdminLogin = (data) => {
  return adminLoginSchema.safeParse(data);
};
