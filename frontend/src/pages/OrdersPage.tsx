import { PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { listMyOrders } from "../services/checkoutService";
import { useAuthStore } from "../stores/authStore";
import type { Order } from "../types/checkout";
import { formatMoney } from "../utils/currency";

export function OrdersPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    listMyOrders().then(setOrders).catch(() => setOrders([]));
  }, [accessToken]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold">My orders</h1>
      <p className="mt-2 text-sm text-slate-600">Use o numero recebido na confirmacao para consultar status, pagamento e itens do pedido.</p>
      <form
        className="mt-6 rounded-lg border border-slate-200 p-5 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (orderNumber.trim()) navigate(`/orders/${encodeURIComponent(orderNumber.trim())}`);
        }}
      >
        <label className="text-sm font-medium">
          Order number
          <div className="mt-2 flex gap-2">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm uppercase outline-none focus:border-primary" placeholder="NX-..." value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.toUpperCase())} />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
              <PackageSearch className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </label>
      </form>
      {accessToken ? (
        <section className="mt-8 rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Order history</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No orders linked to this account yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {orders.map((order) => (
                <Link key={order.id} to={`/orders/${order.order_number}`} className="grid gap-2 py-3 text-sm hover:bg-mist md:grid-cols-[1fr_auto_auto]">
                  <span className="font-semibold">{order.order_number}</span>
                  <span className="text-slate-600">{order.payment_status} / {order.supplier_status}</span>
                  <span>{formatMoney(Number(order.total_amount), order.currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
      <Link to="/account" className="mt-5 inline-flex text-sm font-semibold text-primary">Voltar para minha conta</Link>
    </section>
  );
}
