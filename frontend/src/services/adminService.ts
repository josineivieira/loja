import { api } from "./api";
import { demoAdmin } from "../data/demoAdmin";
import type { AdminCustomer, AdminDashboard, Coupon, ShippingMethod, SupplierOrderPayload } from "../types/admin";
import type { Order } from "../types/checkout";
import type { Product } from "../types/catalog";

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

export function listAdminProducts() {
  return withFallback(async () => (await api.get<Product[]>("/admin/products")).data, demoAdmin.products);
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

export function listAdminShippingMethods() {
  return withFallback(async () => (await api.get<ShippingMethod[]>("/admin/shipping-methods")).data, demoAdmin.shippingMethods);
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

