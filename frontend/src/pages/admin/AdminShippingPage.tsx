import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import { createAdminShippingMethod, listAdminShippingMethods } from "../../services/adminService";
import type { ShippingMethod } from "../../types/admin";
import { formatMoney } from "../../utils/currency";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", countries: "", min_days: "7", max_days: "18", amount: "0", currency: "USD" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminShippingMethods().then(setMethods);
  }, []);

  async function submitMethod(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const method = await createAdminShippingMethod({
        name: form.name,
        code: form.code.toLowerCase(),
        countries: form.countries ? form.countries.split(",").map((country) => country.trim().toUpperCase()).filter(Boolean) : [],
        min_days: Number(form.min_days),
        max_days: Number(form.max_days),
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
      });
      setMethods((items) => [method, ...items]);
      setShowForm(false);
      setForm({ name: "", code: "", countries: "", min_days: "7", max_days: "18", amount: "0", currency: "USD" });
    } catch {
      setError("Nao foi possivel criar o frete. Confira se o codigo ja existe.");
    }
  }

  return (
    <div>
      <PageTitle title="Shipping methods" action="New method" onAction={() => setShowForm((value) => !value)} />
      {showForm ? (
        <form onSubmit={submitMethod} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-7">
          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger md:col-span-7">{error}</div> : null}
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Countries BR,US" value={form.countries} onChange={(event) => setForm({ ...form, countries: event.target.value })} />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Min days" value={form.min_days} onChange={(event) => setForm({ ...form, min_days: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Max days" value={form.max_days} onChange={(event) => setForm({ ...form, max_days: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white md:col-span-7">Save method</button>
        </form>
      ) : null}
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
