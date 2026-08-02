import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { trackOrder } from "../services/engagementService";
import type { Tracking } from "../types/engagement";

export function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      setTracking(await trackOrder(orderNumber.trim()));
    } catch {
      setError("Unable to find tracking information.");
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Track order</h1>
      <form onSubmit={submit} className="mt-6 flex gap-3">
        <input className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 px-3 outline-none focus:border-primary" placeholder="Order number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} />
        <button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
          <Search className="h-4 w-4" />
          Track
        </button>
      </form>
      {error ? <div className="mt-5 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div> : null}
      {tracking ? (
        <div className="mt-6 rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Order</p>
              <p className="font-semibold">{tracking.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Carrier</p>
              <p className="font-semibold">{tracking.carrier ?? "Pending"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tracking</p>
              <p className="font-semibold">{tracking.tracking_number ?? "Not assigned"}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {tracking.events.map((event, index) => (
              <div key={index} className="rounded-md bg-mist p-4">
                <p className="font-semibold">{event.status}</p>
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                <p className="mt-2 text-xs text-slate-500">{event.location ?? "Unknown location"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

