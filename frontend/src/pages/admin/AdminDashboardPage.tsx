import { AlertTriangle, DollarSign, PackageCheck, ShoppingCart, Truck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { getAdminDashboard } from "../../services/adminService";
import type { AdminDashboard } from "../../types/admin";
import { formatMoney } from "../../utils/currency";

const cards = [
  ["sales_month", "Sales month", DollarSign],
  ["total_orders", "Total orders", ShoppingCart],
  ["paid_orders", "Paid orders", PackageCheck],
  ["supplier_pending", "Supplier pending", Truck],
  ["new_customers", "New customers", Users],
  ["failed_payments", "Failed payments", AlertTriangle],
] as const;

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    getAdminDashboard().then(setData);
  }, []);

  if (!data) return <div className="text-slate-600">Loading dashboard...</div>;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, label, Icon]) => {
          const rawValue = data[key];
          const value = key === "sales_month" ? formatMoney(Number(rawValue), "USD") : rawValue;
          return (
            <section key={key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">{label}</p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{value}</p>
            </section>
          );
        })}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Operational snapshot</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Metric label="Pending" value={data.pending_orders} />
          <Metric label="Shipped" value={data.shipped_orders} />
          <Metric label="Delivered" value={data.delivered_orders} />
          <Metric label="Low stock" value={data.low_stock} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-mist p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

