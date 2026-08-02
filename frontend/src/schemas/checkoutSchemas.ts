import { z } from "zod";

export const checkoutAddressSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  country: z.string().length(2),
  state: z.string().min(1).max(100),
  city: z.string().min(1).max(120),
  address_line1: z.string().min(3).max(255),
  address_line2: z.string().max(255).optional(),
  district: z.string().max(120).optional(),
  postal_code: z.string().min(3).max(30),
  notes: z.string().max(1000).optional(),
});

export type CheckoutAddressForm = z.infer<typeof checkoutAddressSchema>;

