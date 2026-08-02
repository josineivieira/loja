import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import { createAdminCoupon, listAdminCoupons } from "../../services/adminService";
import type { Coupon } from "../../types/admin";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", discount_type: "percent" as Coupon["discount_type"], value: "10", minimum_amount: "0" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminCoupons().then(setCoupons);
  }, []);

  async function submitCoupon(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const coupon = await createAdminCoupon({
        code: form.code.toUpperCase(),
        name: form.name,
        discount_type: form.discount_type,
        value: Number(form.value),
        minimum_amount: Number(form.minimum_amount),
      });
      setCoupons((items) => [coupon, ...items]);
      setShowForm(false);
      setForm({ code: "", name: "", discount_type: "percent", value: "10", minimum_amount: "0" });
    } catch {
      setError("Nao foi possivel criar o cupom. Confira se o codigo ja existe.");
    }
  }

  return (
    <div>
      <PageTitle title="Coupons" action="New coupon" onAction={() => setShowForm((value) => !value)} />
      {showForm ? (
        <form onSubmit={submitCoupon} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger md:col-span-6">{error}</div> : null}
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as Coupon["discount_type"] })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
            <option value="free_shipping">Free shipping</option>
          </select>
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Value" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Minimum" value={form.minimum_amount} onChange={(event) => setForm({ ...form, minimum_amount: event.target.value })} required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-6">Save coupon</button>
        </form>
      ) : null}
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
