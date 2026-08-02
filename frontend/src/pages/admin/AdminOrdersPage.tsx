import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminOrders } from "../../services/adminService";
import type { Order } from "../../types/checkout";
import { formatMoney } from "../../utils/currency";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    listAdminOrders().then(setOrders);
  }, []);

  return (
    <div>
      <PageTitle title="Orders" action="Export CSV" />
      <AdminTable columns={["Order", "Customer", "Total", "Payment", "Supplier", "Created"]}>
        {orders.map((order) => (
          <tr key={order.id}>
            <td className="px-4 py-3 font-semibold">{order.order_number}</td>
            <td className="px-4 py-3 text-slate-600">{order.customer_email}</td>
            <td className="px-4 py-3">{formatMoney(Number(order.total_amount), order.currency)}</td>
            <td className="px-4 py-3"><Status value={order.payment_status} /></td>
            <td className="px-4 py-3"><Status value={order.supplier_status} /></td>
            <td className="px-4 py-3 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

