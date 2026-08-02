import { api } from "./api";
import { AxiosError } from "axios";
import { demoAdmin } from "../data/demoAdmin";
import type { AdminCustomer, AdminDashboard, Coupon, IntegrationStatus, ShippingMethod, SupplierOrderPayload } from "../types/admin";
import type { Order } from "../types/checkout";
import type { Product, SupplierProduct, SupplierShippingEstimate } from "../types/catalog";

const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";

async function withFallback<T>(request: () => Promise<T>, fallback: T) {
  try {
    return await request();
  } catch (error) {
    if (demoFallbackEnabled) return fallback;
    throw error;
  }
}

export function getAdminDashboard() {
  return withFallback(async () => (await api.get<AdminDashboard>("/admin/dashboard")).data, demoAdmin.dashboard);
}

export function getIntegrationStatus() {
  return withFallback(
    async () => (await api.get<IntegrationStatus>("/admin/integrations/status")).data,
    {
      stripe_secret_configured: false,
      stripe_webhook_configured: false,
      supplier_provider: "manual",
      cj_configured: false,
      cj_sandbox: false,
      email_provider: "log",
      email_configured: false,
      frontend_url: window.location.origin,
    },
  );
}

export function listAdminProducts() {
  return withFallback(async () => (await api.get<Product[]>("/admin/products")).data, demoAdmin.products);
}

export async function createAdminProduct(payload: {
  name: string;
  slug: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  stock: number;
  status: string;
  short_description?: string;
}) {
  const { data } = await api.post<Product>("/admin/products", {
    name: payload.name,
    slug: payload.slug,
    sku: payload.sku,
    sale_price: payload.sale_price,
    cost_price: payload.cost_price,
    status: payload.status,
    short_description: payload.short_description,
    variants: [
      {
        sku: `${payload.sku}-DEFAULT`,
        price: payload.sale_price,
        cost: payload.cost_price,
        stock: payload.stock,
        status: "active",
      },
    ],
  });
  return data;
}

export async function updateAdminProduct(
  productId: string,
  payload: {
    name?: string;
    short_description?: string;
    description?: string;
    sale_price?: number;
    cost_price?: number;
    status?: string;
  },
) {
  const { data } = await api.patch<Product>(`/admin/products/${productId}`, payload);
  return data;
}

export async function searchCjProducts(query: string) {
  const { data } = await api.get<SupplierProduct[]>("/admin/supplier/cj/products", { params: { q: query } });
  return data;
}

export async function previewCjProduct(productId: string) {
  const { data } = await api.get<SupplierProduct>(`/admin/supplier/cj/products/${productId}`);
  return data;
}

export async function estimateCjVariantShipping(payload: {
  supplier_variant_id: string;
  quantity: number;
  country: string;
  state: string;
  city: string;
  postal_code: string;
}) {
  const { data } = await api.post<SupplierShippingEstimate[]>("/admin/supplier/cj/shipping-estimate", payload);
  return data;
}

export async function importCjProduct(payload: {
  supplier_product_id: string;
  name: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  stock: number;
  supplier_variant_id: string;
  supplier_sku?: string;
  description?: string | null;
  image_url?: string | null;
  images?: string[];
  variants?: Array<{
    supplier_variant_id: string;
    sku: string;
    name?: string | null;
    options?: Record<string, string>;
    sale_price: number;
    cost_price: number;
    stock: number;
    image_url?: string | null;
    selected: boolean;
  }>;
}) {
  try {
    const { data } = await api.post<Product>("/admin/supplier/cj/import", payload);
    return data;
  } catch (error) {
    const detail = error instanceof AxiosError ? error.response?.data?.detail : undefined;
    throw new Error(typeof detail === "string" ? detail : "Nao foi possivel importar este produto da CJ.");
  }
}

export async function createAdminCategory(payload: { name: string; slug: string; description?: string }) {
  const { data } = await api.post("/admin/categories", payload);
  return data;
}

export function listAdminOrders() {
  return withFallback(async () => (await api.get<Order[]>("/admin/orders")).data, demoAdmin.orders);
}

export function listAdminCustomers() {
  return withFallback(async () => (await api.get<AdminCustomer[]>("/admin/customers")).data, demoAdmin.customers);
}

export function listAdminCoupons() {
  return withFallback(async () => (await api.get<Coupon[]>("/admin/coupons")).data, demoAdmin.coupons);
}

export async function createAdminCoupon(payload: {
  code: string;
  name: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  value: number;
  minimum_amount: number;
}) {
  const { data } = await api.post<Coupon>("/admin/coupons", { ...payload, active: true });
  return data;
}

export function listAdminShippingMethods() {
  return withFallback(async () => (await api.get<ShippingMethod[]>("/admin/shipping-methods")).data, demoAdmin.shippingMethods);
}

export async function createAdminShippingMethod(payload: {
  name: string;
  code: string;
  countries: string[];
  min_days: number;
  max_days: number;
  amount: number;
  currency: string;
}) {
  const { data } = await api.post<ShippingMethod>("/admin/shipping-methods", {
    ...payload,
    origin_country: "CN",
    tracking_available: true,
    active: true,
  });
  return data;
}

export function listSupplierOrders() {
  return withFallback(async () => (await api.get<Order[]>("/admin/supplier/orders")).data, demoAdmin.orders);
}

export function getSupplierPayload(orderNumber: string) {
  const demoOrder = demoAdmin.orders.find((order) => order.order_number === orderNumber) ?? demoAdmin.orders[0];
  const fallback: SupplierOrderPayload = {
    order_number: demoOrder.order_number,
    customer_email: demoOrder.customer_email,
    shipping_address: {
      country: "US",
      state: "CA",
      city: "San Francisco",
      addressLine1: "1 Market Street",
      postalCode: "94105",
    },
    items: demoOrder.items.map((item) => ({
      product_name: item.product_name,
      variant_sku: item.variant_sku,
      supplier_sku: item.variant_sku,
      supplier_variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    supplier_status: demoOrder.supplier_status,
    supplier_order_id: null,
    supplier_real_cost: null,
    copyable_payload: {
      orderNumber: demoOrder.order_number,
      customer: { email: demoOrder.customer_email },
      shippingAddress: { country: "US", state: "CA", city: "San Francisco", addressLine1: "1 Market Street", postalCode: "94105" },
      items: demoOrder.items.map((item) => ({ variantSku: item.variant_sku, quantity: item.quantity })),
      shippingMethod: "standard",
      shippingMethodName: "Standard Shipping",
    },
  };
  return withFallback(async () => (await api.get<SupplierOrderPayload>(`/admin/supplier/orders/${orderNumber}/payload`)).data, fallback);
}

export async function markSupplierSubmitted(orderNumber: string, supplierOrderId: string, supplierRealCost?: string) {
  return withFallback(
    async () =>
      (
        await api.post<Order>(`/admin/supplier/orders/${orderNumber}/submitted`, {
          supplier_order_id: supplierOrderId,
          supplier_real_cost: supplierRealCost ? Number(supplierRealCost) : undefined,
        })
      ).data,
    { ...demoAdmin.orders[0], supplier_status: "supplier_confirmed", supplier_order_id: supplierOrderId } as Order,
  );
}

export async function addSupplierTracking(orderNumber: string, trackingNumber: string, carrier: string) {
  return withFallback(
    async () =>
      (
        await api.post<Order>(`/admin/supplier/orders/${orderNumber}/tracking`, {
          tracking_number: trackingNumber,
          carrier,
          status: "shipped",
          description: "Tracking number added manually.",
        })
      ).data,
    { ...demoAdmin.orders[0], status: "shipped", fulfillment_status: "shipped", supplier_status: "shipped" } as Order,
  );
}

export async function syncSupplierOrder(orderNumber: string) {
  return withFallback(
    async () => (await api.post<Order>(`/admin/supplier/orders/${orderNumber}/sync`)).data,
    { ...demoAdmin.orders[0], supplier_status: "in_transit", fulfillment_status: "in_transit" } as Order,
  );
}
