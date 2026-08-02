import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listCategories } from "../../services/catalogService";
import { createAdminCategory } from "../../services/adminService";
import type { Category } from "../../types/catalog";
import { PageTitle, Status } from "./AdminProductsPage";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const category = await createAdminCategory({ name: form.name, slug: slugify(form.name), description: form.description });
      setCategories((items) => [category, ...items]);
      setForm({ name: "", description: "" });
      setShowForm(false);
    } catch {
      setError("Nao foi possivel criar a categoria. Confira se o nome/slug ja existe.");
    }
  }

  return (
    <div>
      <PageTitle title="Categories" action="New category" onAction={() => setShowForm((value) => !value)} />
      {showForm ? (
        <form onSubmit={submitCategory} className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[260px_1fr_120px]">
          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-danger md:col-span-3">{error}</div> : null}
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Category name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="h-10 rounded-md border border-slate-200 px-3 text-sm" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-white">Save</button>
        </form>
      ) : null}
      <AdminTable columns={["Name", "Slug", "Description", "Status"]}>
        {categories.map((category) => (
          <tr key={category.id}>
            <td className="px-4 py-3 font-semibold">{category.name}</td>
            <td className="px-4 py-3 text-slate-600">{category.slug}</td>
            <td className="px-4 py-3 text-slate-600">{category.description ?? "-"}</td>
            <td className="px-4 py-3"><Status value={category.is_active ? "active" : "inactive"} /></td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
