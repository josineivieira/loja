import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().trim().max(max).optional());

const phoneText = z
  .string()
  .trim()
  .min(8, "Phone is required")
  .max(40)
  .refine((value) => value.replace(/\D/g, "").length >= 8, "Phone looks invalid");

const realText = (label: string, min = 2, max = 120) =>
  z
    .string()
    .trim()
    .min(min, `${label} is too short`)
    .max(max)
    .refine((value) => /[aeiouaeiou]/i.test(value), `${label} looks invalid`)
    .refine((value) => !/^(.)\1{2,}$/i.test(value.replace(/\s/g, "")), `${label} looks invalid`);

export const checkoutAddressSchema = z.object({
  first_name: realText("First name", 2, 80),
  last_name: realText("Last name", 2, 80),
  email: z.string().trim().email(),
  phone: phoneText,
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  state: realText("State", 2, 100),
  city: realText("City", 2, 120),
  address_line1: z
    .string()
    .trim()
    .min(8)
    .max(255)
    .refine((value) => /\d/.test(value), "Address must include a street number")
    .refine((value) => /[a-z]{3,}/i.test(value), "Address looks invalid")
    .refine((value) => !/^(.)\1{4,}$/i.test(value.replace(/\s/g, "")), "Address looks invalid"),
  address_line2: optionalText(255),
  district: optionalText(120),
  postal_code: z.string().trim().min(5).max(30).refine((value) => /\d{5,}/.test(value.replace(/\D/g, "")), "Postal code looks invalid"),
  notes: optionalText(1000),
});

export type CheckoutAddressForm = z.infer<typeof checkoutAddressSchema>;
