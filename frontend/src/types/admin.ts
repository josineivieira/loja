import type { Order } from "./checkout";
import type { Product } from "./catalog";

export type AdminDashboard = {
  sales_today: string;
  sales_month: string;
  total_orders: number;
  pending_orders: number;
  paid_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  average_order_value: string;
  new_customers: number;
  low_stock: number;
  failed_payments: number;
  supplier_pending: number;
};

export type AdminCustomer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  roles: string[];
};

export type Coupon = {
  id: string;
  code: string;
  name: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  value: string;
  minimum_amount: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  code: string;
  origin_country: string;
  countries: string[];
  min_days: number;
  max_days: number;
  amount: string;
  currency: string;
  tracking_available: boolean;
  active: boolean;
  free_over_amount?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminCollections = {
  dashboard: AdminDashboard;
  products: Product[];
  orders: Order[];
  customers: AdminCustomer[];
  coupons: Coupon[];
  shippingMethods: ShippingMethod[];
};

export type SupplierOrderPayload = {
  order_number: string;
  customer_email: string;
  shipping_address: Record<string, unknown> | null;
  items: Array<{
    product_name: string;
    variant_sku: string;
    supplier_sku?: string | null;
    supplier_variant_id?: string | null;
    quantity: number;
    unit_price: string;
  }>;
  supplier_status: string;
  supplier_order_id?: string | null;
  supplier_real_cost?: string | null;
  copyable_payload: Record<string, unknown>;
};

export type IntegrationStatus = {
  stripe_secret_configured: boolean;
  stripe_webhook_configured: boolean;
  supplier_provider: string;
  cj_configured: boolean;
  cj_sandbox: boolean;
  aliexpress_configured: boolean;
  aliexpress_sandbox: boolean;
  email_provider: string;
  email_configured: boolean;
  frontend_url: string;
};
