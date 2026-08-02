import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import { createAdminProduct, listAdminProducts } from "../../services/adminService";
import type { Product } from "../../types/catalog";
import { formatMoney } from "../../utils/currency";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", sale_price: "49.00", cost_price: "20.00", stock: "10", short_description: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminProducts().then(setProducts);
  }, []);

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const product = await createAdminProduct({
        name: form.name,
        slug: slugify(form.name),
        sku: form.sku.toUpperCase(),
        sale_price: Number(form.sale_price),
        cost_price: Number(form.cost_price),
        stock: Number(form.stock),
        status: "active",
        short_description: form.short_description,
      });
      setProducts((items) => [product, ...items]);
      setShowForm(false);
      setForm({ name: "", sku: "", sale_price: "49.00", cost_price: "20.00", stock: "10", short_description: "" });
    } catch {
      setError("Nao foi possivel criar o produto. Confira se SKU e slug ainda nao existem.");
    }
  }

  return (
    <div>
      <PageTitle title="Products" action="New product" onAction={() => setShowForm((value) => !value)} />
      {showForm ? (
        <form onSubmit={submitProduct} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger md:col-span-6">{error}</div> : null}
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Sale price" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Cost" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-5" placeholder="Short description" value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Save</button>
        </form>
      ) : null}
      <AdminTable columns={["Product", "SKU", "Price", "Stock", "Status"]}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-3 font-semibold">{product.name}</td>
            <td className="px-4 py-3 text-slate-600">{product.sku}</td>
            <td className="px-4 py-3">{formatMoney(Number(product.sale_price), product.currency)}</td>
            <td className="px-4 py-3">{product.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
            <td className="px-4 py-3"><Status value={product.status} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}

export function PageTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {action ? <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={onAction}>{action}</button> : null}
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{value}</span>;
}
