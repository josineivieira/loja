import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
});

