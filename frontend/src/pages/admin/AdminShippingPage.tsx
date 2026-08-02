import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminShippingMethods } from "../../services/adminService";
import type { ShippingMethod } from "../../types/admin";
import { formatMoney } from "../../utils/currency";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);

  useEffect(() => {
    listAdminShippingMethods().then(setMethods);
  }, []);

  return (
    <div>
      <PageTitle title="Shipping methods" action="New method" />
      <AdminTable columns={["Name", "Code", "Countries", "ETA", "Amount", "Tracking", "Status"]}>
        {methods.map((method) => (
          <tr key={method.id}>
            <td className="px-4 py-3 font-semibold">{method.name}</td>
            <td className="px-4 py-3 text-slate-600">{method.code}</td>
            <td className="px-4 py-3">{method.countries.length ? method.countries.join(", ") : "Global"}</td>
            <td className="px-4 py-3">{method.min_days}-{method.max_days} days</td>
            <td className="px-4 py-3">{formatMoney(Number(method.amount), method.currency)}</td>
            <td className="px-4 py-3"><Status value={method.tracking_available ? "yes" : "no"} /></td>
            <td className="px-4 py-3"><Status value={method.active ? "active" : "inactive"} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

