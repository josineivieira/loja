import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { listAdminProducts } from "../../services/adminService";
import type { Product } from "../../types/catalog";
import { formatMoney } from "../../utils/currency";

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    listAdminProducts().then(setProducts);
  }, []);

  return (
    <div>
      <PageTitle title="Products" action="New product" />
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

export function PageTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {action ? <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">{action}</button> : null}
    </div>
  );
}

export function Status({ value }: { value: string }) {
  return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{value}</span>;
}

