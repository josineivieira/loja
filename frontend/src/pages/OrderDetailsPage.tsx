import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getOrder } from "../services/checkoutService";
import type { Order } from "../types/checkout";
import { formatMoney } from "../utils/currency";

export function OrderDetailsPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    getOrder(orderNumber).then(setOrder).catch(() => setError("Order not found."));
  }, [orderNumber]);

  if (error) return <section className="mx-auto max-w-7xl px-4 py-12 text-danger">{error}</section>;
  if (!order) return <section className="mx-auto max-w-7xl px-4 py-12 text-slate-600">Loading order...</section>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Order {order.order_number}</h1>
      <p className="mt-2 text-sm text-slate-600">Status: {order.status} - Payment: {order.payment_status}</p>
      <div className="mt-6 rounded-lg border border-slate-200 p-5 shadow-sm">
        {order.items.map((item) => (
          <div key={item.variant_id} className="flex justify-between border-b border-slate-100 py-3 text-sm last:border-0">
            <span>{item.product_name} x {item.quantity}</span>
            <span>{formatMoney(Number(item.total_price), item.currency)}</span>
          </div>
        ))}
        {order.shipping_method_name ? (
          <div className="mt-4 rounded-md bg-mist p-3 text-sm">
            <p className="font-semibold">{order.shipping_method_name}</p>
            {order.shipping_min_days && order.shipping_max_days ? (
              <p className="mt-1 text-slate-600">Estimated delivery: {order.shipping_min_days}-{order.shipping_max_days} business days.</p>
            ) : null}
            <p className="mt-1 text-slate-600">Tracking: {order.shipping_tracking_available ? "available after supplier dispatch" : "not available"}</p>
          </div>
        ) : null}
        <div className="mt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(Number(order.total_amount), order.currency)}</span>
        </div>
      </div>
    </section>
  );
}
