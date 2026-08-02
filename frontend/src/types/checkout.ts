export type CheckoutItemPayload = {
  product_id: string;
  variant_id: string;
  quantity: number;
};

export type CheckoutAddress = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  district?: string;
  postal_code: string;
  notes?: string;
};

export type CheckoutCalculateRequest = {
  items: CheckoutItemPayload[];
  address?: CheckoutAddress;
  shipping_method_code?: string;
  coupon_code?: string;
  currency: string;
};

export type CheckoutLine = {
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  currency: string;
};

export type ShippingQuote = {
  code: string;
  name: string;
  amount: string;
  currency: string;
  min_days: number;
  max_days: number;
  tracking_available: boolean;
};

export type CheckoutTotals = {
  subtotal_amount: string;
  discount_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  coupon_code?: string | null;
  shipping_method_code?: string | null;
};

export type CheckoutCalculation = {
  items: CheckoutLine[];
  shipping_methods: ShippingQuote[];
  totals: CheckoutTotals;
};

export type Order = {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  supplier_status: string;
  supplier_order_id?: string | null;
  subtotal_amount: string;
  discount_amount: string;
  shipping_amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  shipping_method_code?: string | null;
  shipping_method_name?: string | null;
  shipping_min_days?: number | null;
  shipping_max_days?: number | null;
  shipping_tracking_available?: boolean;
  created_at: string;
  items: CheckoutLine[];
};

export type PaymentSession = {
  order_number: string;
  gateway: string;
  status: string;
  amount: string;
  currency: string;
  checkout_session_id?: string | null;
  payment_url?: string | null;
  mode: string;
};
