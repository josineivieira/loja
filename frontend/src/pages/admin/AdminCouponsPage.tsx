import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminCoupons } from "../../services/adminService";
import type { Coupon } from "../../types/admin";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    listAdminCoupons().then(setCoupons);
  }, []);

  return (
    <div>
      <PageTitle title="Coupons" action="New coupon" />
      <AdminTable columns={["Code", "Name", "Type", "Value", "Minimum", "Status"]}>
        {coupons.map((coupon) => (
          <tr key={coupon.id}>
            <td className="px-4 py-3 font-semibold">{coupon.code}</td>
            <td className="px-4 py-3 text-slate-600">{coupon.name}</td>
            <td className="px-4 py-3">{coupon.discount_type}</td>
            <td className="px-4 py-3">{coupon.value}</td>
            <td className="px-4 py-3">{coupon.minimum_amount}</td>
            <td className="px-4 py-3"><Status value={coupon.active ? "active" : "inactive"} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

