import { Clipboard, PackageCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminTable } from "../../components/AdminTable";
import { addSupplierTracking, getSupplierPayload, listSupplierOrders, markSupplierSubmitted } from "../../services/adminService";
import type { SupplierOrderPayload } from "../../types/admin";
import type { Order } from "../../types/checkout";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminIntegrationsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<SupplierOrderPayload | null>(null);
  const [supplierOrderId, setSupplierOrderId] = useState("");
  const [supplierCost, setSupplierCost] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("CJPacket");

  useEffect(() => {
    listSupplierOrders().then(setOrders);
  }, []);

  async function loadPayload(orderNumber: string) {
    setSelected(await getSupplierPayload(orderNumber));
  }

  async function submitSupplier() {
    if (!selected || !supplierOrderId) return;
    await markSupplierSubmitted(selected.order_number, supplierOrderId, supplierCost);
    setSelected(await getSupplierPayload(selected.order_number));
  }

  async function submitTracking() {
    if (!selected || !trackingNumber || !carrier) return;
    await addSupplierTracking(selected.order_number, trackingNumber, carrier);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <div>
        <PageTitle title="Supplier integrations" />
        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Manual CJ Dropshipping workflow</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Orders are prepared as copyable supplier payloads. The provider can later be swapped for CJ automation without changing checkout or order logic.
              </p>
            </div>
          </div>
        </section>
        <AdminTable columns={["Order", "Customer", "Total", "Supplier", "Action"]}>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-semibold">{order.order_number}</td>
              <td className="px-4 py-3 text-slate-600">{order.customer_email}</td>
              <td className="px-4 py-3">{order.currency} {order.total_amount}</td>
              <td className="px-4 py-3"><Status value={order.supplier_status} /></td>
              <td className="px-4 py-3">
                <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => loadPayload(order.order_number)}>
                  Prepare
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Supplier handoff</h2>
        {!selected ? (
          <p className="mt-4 text-sm text-slate-600">Select an order to prepare manual supplier submission.</p>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="rounded-md bg-mist p-4">
              <p className="text-sm text-slate-500">Order</p>
              <p className="font-semibold">{selected.order_number}</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(selected.copyable_payload, null, 2))}
            >
              <Clipboard className="h-4 w-4" />
              Copy payload
            </button>
            <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-white">{JSON.stringify(selected.copyable_payload, null, 2)}</pre>

            <div className="grid gap-3">
              <label className="text-sm font-medium">
                CJ order ID
                <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3" value={supplierOrderId} onChange={(event) => setSupplierOrderId(event.target.value)} />
              </label>
              <label className="text-sm font-medium">
                Real supplier cost
                <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3" value={supplierCost} onChange={(event) => setSupplierCost(event.target.value)} />
              </label>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={submitSupplier}>
                Register supplier order
              </button>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Truck className="h-4 w-4" />
                Tracking
              </div>
              <label className="text-sm font-medium">
                Tracking number
                <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
              </label>
              <label className="mt-3 block text-sm font-medium">
                Carrier
                <input className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
              </label>
              <button className="mt-3 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={submitTracking}>
                Add tracking
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

