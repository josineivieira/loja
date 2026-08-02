import { api } from "./api";
import type { Notification, Review, Tracking } from "../types/engagement";

const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_FALLBACK !== "false";

const demoReviews: Review[] = [
  {
    id: "review-demo-1",
    product_id: "",
    customer_name: "Maya Chen",
    rating: 5,
    title: "Clean and premium",
    comment: "The finish feels better than most gadget shops I have tried.",
    status: "approved",
    verified_purchase: true,
    admin_reply: "Thank you for choosing Nexora.",
    created_at: new Date().toISOString(),
  },
];

export async function listProductReviews(productId: string) {
  try {
    const { data } = await api.get<Review[]>(`/products/${productId}/reviews`);
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return demoReviews.map((review) => ({ ...review, product_id: productId }));
    throw error;
  }
}

export async function trackOrder(orderNumber: string) {
  try {
    const { data } = await api.get<Tracking>(`/tracking/${orderNumber}`);
    return data;
  } catch (error) {
    if (!demoFallbackEnabled) throw error;
    return {
      order_number: orderNumber,
      tracking_number: "NXTRACK-DEMO",
      carrier: "Nexora Logistics",
      status: "in_transit",
      events: [
        { status: "supplier_confirmed", location: "Shenzhen", description: "Supplier confirmed the package.", created_at: new Date().toISOString() },
        { status: "in_transit", location: "International hub", description: "Package is moving through the export network.", created_at: new Date().toISOString() },
      ],
    };
  }
}

export async function listAdminReviews() {
  try {
    const { data } = await api.get<Review[]>("/admin/reviews");
    return data;
  } catch (error) {
    if (demoFallbackEnabled) return demoReviews;
    throw error;
  }
}

export async function listAdminNotifications() {
  try {
    const { data } = await api.get<Notification[]>("/admin/notifications");
    return data;
  } catch (error) {
    if (!demoFallbackEnabled) throw error;
    return [
      {
        id: "notification-demo-1",
        audience: "admin",
        title: "Order awaiting supplier",
        message: "NX-DEMO-10482 is ready for manual supplier submission.",
        type: "supplier_pending",
        read: false,
        related_order_number: "NX-DEMO-10482",
        created_at: new Date().toISOString(),
      },
    ];
  }
}

