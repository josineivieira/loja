import { Activity, AlertTriangle, ExternalLink } from "lucide-react";

import { PageTitle } from "./AdminProductsPage";

export function AdminLogsPage() {
  return (
    <div>
      <PageTitle title="Logs" />
      <section className="grid gap-4 md:grid-cols-3">
        <LogCard title="Render backend logs" text="Use Live tail to inspect API errors, CJ freight failures, Stripe webhook events and deploy issues." />
        <LogCard title="Stripe events" text="Webhook payloads are stored in payment_events and failed payments affect dashboard metrics." />
        <LogCard title="CJ operations" text="Supplier responses are saved on the order payload during handoff and sync." />
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">When testing live sales</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {["CJ freight quote", "Stripe checkout", "Stripe webhook", "CJ supplier order", "CJ tracking sync"].map((step) => (
            <div key={step} className="rounded-md bg-mist p-4 text-sm font-semibold">{step}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LogCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Activity className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ExternalLink className="h-4 w-4" />
        Operational source
      </div>
    </article>
  );
}
