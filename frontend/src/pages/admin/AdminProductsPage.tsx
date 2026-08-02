import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import { createAdminProduct, importCjProduct, listAdminProducts, searchCjProducts, updateAdminProduct } from "../../services/adminService";
import type { Product, SupplierProduct, SupplierProductVariant } from "../../types/catalog";
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
  const [showCjImport, setShowCjImport] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", sale_price: "49.00", cost_price: "20.00", stock: "10", short_description: "" });
  const [cjQuery, setCjQuery] = useState("");
  const [cjProducts, setCjProducts] = useState<SupplierProduct[]>([]);
  const [cjLoading, setCjLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", sale_price: "", cost_price: "", short_description: "", description: "" });

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

  async function searchCj(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCjLoading(true);
    try {
      setCjProducts(await searchCjProducts(cjQuery));
    } catch {
      setError("Nao foi possivel buscar na CJ. Confira CJ_API_KEY e SUPPLIER_PROVIDER=cj no Render backend.");
    } finally {
      setCjLoading(false);
    }
  }

  async function importProduct(product: SupplierProduct, variant: SupplierProductVariant) {
    setError(null);
    try {
      const cost = Number(variant.cost || variant.price || 0);
      const sale = Number(variant.price || cost * 2 || 0);
      const imported = await importCjProduct({
        supplier_product_id: product.supplier_product_id,
        name: product.name,
        sku: product.sku || variant.sku,
        sale_price: sale,
        cost_price: cost,
        stock: variant.stock,
        supplier_variant_id: variant.supplier_variant_id,
        supplier_sku: variant.sku,
        description: product.description,
        image_url: variant.image_url || product.image_url,
      });
      setProducts((items) => [imported, ...items]);
      setCjProducts((items) => items.filter((item) => item.supplier_product_id !== product.supplier_product_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel importar. O produto pode ja existir ou a variante CJ nao veio com ID valido.");
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      sale_price: product.sale_price,
      cost_price: product.cost_price ?? "0",
      short_description: product.short_description ?? "",
      description: product.description ?? "",
    });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setError(null);
    try {
      const updated = await updateAdminProduct(editingId, {
        name: editForm.name,
        sale_price: Number(editForm.sale_price),
        cost_price: Number(editForm.cost_price),
        short_description: editForm.short_description,
        description: editForm.description,
      });
      setProducts((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
    } catch {
      setError("Nao foi possivel atualizar o produto.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Products</h2>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setShowCjImport((value) => !value)}>Import from CJ</button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowForm((value) => !value)}>New product</button>
        </div>
      </div>
      {error ? <div className="mb-5 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div> : null}
      {showCjImport ? (
        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={searchCj} className="flex flex-col gap-3 md:flex-row">
            <input className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm" placeholder="Search CJ by keyword, SKU, product ID or variant ID" value={cjQuery} onChange={(event) => setCjQuery(event.target.value)} required />
            <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white" disabled={cjLoading}>{cjLoading ? "Searching..." : "Search CJ"}</button>
          </form>
          <div className="mt-5 grid gap-3">
            {cjProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <article key={product.supplier_product_id} className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-[88px_1fr_auto]">
                  <div className="h-20 w-20 overflow-hidden rounded-md bg-mist">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">CJ ID: {product.supplier_product_id}</p>
                    <p className="mt-1 text-sm text-slate-600">Variant: {variant?.supplier_variant_id || "missing"} - {variant?.sku}</p>
                    <p className="mt-1 text-sm text-slate-600">CJ cost: USD {variant?.cost ?? "0"} - Stock {variant?.stock ?? 0}</p>
                    <p className="mt-1 text-xs text-slate-500">Sale price is calculated with the backend CJ markup settings.</p>
                  </div>
                  <button type="button" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-slate-300" disabled={!variant?.supplier_variant_id} onClick={() => variant && importProduct(product, variant)}>
                    Import
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      {showForm ? (
        <form onSubmit={submitProduct} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Sale price" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Cost" value={form.cost_price} onChange={(event) => setForm({ ...form, cost_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-5" placeholder="Short description" value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Save</button>
        </form>
      ) : null}
      {editingId ? (
        <form onSubmit={saveEdit} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-6">
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Product name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Your sale price" value={editForm.sale_price} onChange={(event) => setEditForm({ ...editForm, sale_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="CJ cost" value={editForm.cost_price} onChange={(event) => setEditForm({ ...editForm, cost_price: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm md:col-span-2" placeholder="Short description" value={editForm.short_description} onChange={(event) => setEditForm({ ...editForm, short_description: event.target.value })} />
          <textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-5" placeholder="Full description" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} />
          <div className="flex gap-2">
            <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Save</button>
            <button type="button" className="rounded-md border border-slate-200 px-4 text-sm font-semibold" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </form>
      ) : null}
      <AdminTable columns={["Product", "SKU", "Price", "Stock", "Status", "Action"]}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-4 py-3 font-semibold">{product.name}</td>
            <td className="px-4 py-3 text-slate-600">{product.sku}</td>
            <td className="px-4 py-3">{formatMoney(Number(product.sale_price), product.currency)}</td>
            <td className="px-4 py-3">{product.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
            <td className="px-4 py-3"><Status value={product.status} /></td>
            <td className="px-4 py-3">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => startEdit(product)}>Edit</button>
            </td>
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
