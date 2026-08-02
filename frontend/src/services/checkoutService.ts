import { api } from "./api";
import { demoProducts } from "../data/demoCatalog";
import type { CheckoutCalculateRequest, CheckoutCalculation, Order, PaymentSession } from "../types/checkout";

const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";

function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  }
  return fallback;
}

function calculateDemoCheckout(payload: CheckoutCalculateRequest): CheckoutCalculation {
  const lines = payload.items.map((item) => {
    const product = demoProducts.find((entry) => entry.id === item.product_id);
    const variant = product?.variants.find((entry) => entry.id === item.variant_id);
    if (!product || !variant) throw new Error("Produto indisponivel no carrinho.");
    if (variant.stock < item.quantity) throw new Error(`Estoque insuficiente para ${variant.sku}.`);
    const unitPrice = Number(variant.price);
    return {
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      variant_sku: variant.sku,
      quantity: item.quantity,
      unit_price: unitPrice.toFixed(2),
      total_price: (unitPrice * item.quantity).toFixed(2),
      currency: product.currency,
    };
  });
  const currency = lines[0]?.currency ?? payload.currency;
  const subtotal = lines.reduce((total, item) => total + Number(item.total_price), 0);
  const coupon = payload.coupon_code?.toUpperCase();
  const discount = coupon === "WELCOME10" && subtotal >= 25 ? subtotal * 0.1 : coupon === "NEXORA5" && subtotal >= 30 ? 5 : 0;
  const shippingMethods = [
    { code: "standard", name: "Standard Shipping", amount: subtotal >= 100 ? "0.00" : "9.90", currency, min_days: 10, max_days: 20, tracking_available: true },
    { code: "express", name: "Express Shipping", amount: "19.90", currency, min_days: 5, max_days: 9, tracking_available: true },
    { code: "free", name: "Free Shipping", amount: "0.00", currency, min_days: 12, max_days: 24, tracking_available: true },
  ];
  const selected = shippingMethods.find((method) => method.code === payload.shipping_method_code) ?? shippingMethods[0];
  const total = subtotal - discount + Number(selected.amount);
  return {
    items: lines,
    shipping_methods: shippingMethods,
    totals: {
      subtotal_amount: subtotal.toFixed(2),
      discount_amount: discount.toFixed(2),
      shipping_amount: Number(selected.amount).toFixed(2),
      tax_amount: "0.00",
      total_amount: total.toFixed(2),
      currency,
      coupon_code: coupon ?? null,
      shipping_method_code: selected.code,
    },
  };
}

export async function calculateCheckout(payload: CheckoutCalculateRequest) {
  try {
    const { data } = await api.post<CheckoutCalculation>("/checkout/calculate", payload);
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return calculateDemoCheckout(payload);
    throw new Error(apiErrorMessage(error, "Unable to calculate checkout."));
  }
}

export async function createOrder(payload: CheckoutCalculateRequest & { address: NonNullable<CheckoutCalculateRequest["address"]>; idempotency_key: string }) {
  try {
    const { data } = await api.post<Order>("/checkout/create-order", payload);
    return data;
  } catch (error) {
    if (!demoFallbackEnabled) throw new Error(apiErrorMessage(error, "Unable to create order."));
    const calculation = calculateDemoCheckout(payload);
    return {
      id: crypto.randomUUID(),
      order_number: `NX-DEMO-${Math.floor(Math.random() * 90000) + 10000}`,
      customer_email: payload.address.email,
      status: "awaiting_payment",
      payment_status: "pending",
      fulfillment_status: "pending",
      supplier_status: "supplier_pending",
      subtotal_amount: calculation.totals.subtotal_amount,
      discount_amount: calculation.totals.discount_amount,
      shipping_amount: calculation.totals.shipping_amount,
      tax_amount: calculation.totals.tax_amount,
      total_amount: calculation.totals.total_amount,
      currency: calculation.totals.currency,
      created_at: new Date().toISOString(),
      items: calculation.items,
    };
  }
}

export async function createPaymentSession(orderNumber: string) {
  try {
    const { data } = await api.post<PaymentSession>("/checkout/payment-session", { order_number: orderNumber });
    return data;
  } catch (error) {
    if (!demoFallbackEnabled) throw new Error(apiErrorMessage(error, "Unable to create payment session."));
    return {
      order_number: orderNumber,
      gateway: "stripe",
      status: "pending",
      amount: "0.00",
      currency: "USD",
      checkout_session_id: `cs_test_demo_${orderNumber}`,
      payment_url: null,
      mode: "test_placeholder",
    };
  }
}

export async function getOrder(orderNumber: string) {
  const { data } = await api.get<Order>(`/orders/${orderNumber}`);
  return data;
}
