import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().max(max).optional());

export const checkoutAddressSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  phone: optionalText(40),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  state: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(120),
  address_line1: z.string().trim().min(3).max(255),
  address_line2: optionalText(255),
  district: optionalText(120),
  postal_code: z.string().trim().min(3).max(30),
  notes: optionalText(1000),
});

export type CheckoutAddressForm = z.infer<typeof checkoutAddressSchema>;
