import { CreditCard, RotateCcw, ShieldCheck, Webhook } from "lucide-react";
import { useEffect, useState } from "react";

import { getIntegrationStatus } from "../../services/adminService";
import type { IntegrationStatus } from "../../types/admin";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminPaymentsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    getIntegrationStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <div>
      <PageTitle title="Payments" />
      <section className="grid gap-4 md:grid-cols-3">
        <PaymentCard icon={CreditCard} title="Stripe Checkout" value="Implemented" text="Customers are redirected to Stripe for card payment." />
        <PaymentCard icon={Webhook} title="Webhook" value={status?.stripe_webhook_configured ? "Configured" : "Missing"} text="/api/webhooks/stripe confirms paid and failed orders." />
        <PaymentCard icon={ShieldCheck} title="Production secret" value={status?.stripe_secret_configured ? "Configured" : "Missing"} text="Set STRIPE_SECRET_KEY on the backend service." />
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Operational flow</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {["Order created", "Stripe paid webhook", "Supplier handoff", "Tracking sync"].map((item) => (
            <div key={item} className="rounded-md bg-mist p-4 text-sm font-semibold">{item}</div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <RotateCcw className="h-4 w-4" />
          Refunds are initiated in Stripe Dashboard until a refund tool is added here.
        </div>
      </section>
    </div>
  );
}

function PaymentCard({ icon: Icon, title, value, text }: { icon: typeof CreditCard; title: string; value: string; text: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <div className="mt-2"><Status value={value} /></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
