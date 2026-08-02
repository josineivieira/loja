import { Settings, Truck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

import { getIntegrationStatus } from "../../services/adminService";
import type { IntegrationStatus } from "../../types/admin";
import { PageTitle, Status } from "./AdminProductsPage";

export function AdminSettingsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    getIntegrationStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <div>
      <PageTitle title="Settings" />
      <section className="grid gap-4 md:grid-cols-3">
        <SettingCard icon={Settings} title="Storefront" rows={[["Frontend URL", status?.frontend_url ?? "-"], ["Demo fallback", "Set VITE_ENABLE_DEMO_FALLBACK=false"]]} />
        <SettingCard icon={WalletCards} title="Payments" rows={[["Stripe secret", status?.stripe_secret_configured ? "Configured" : "Missing"], ["Stripe webhook", status?.stripe_webhook_configured ? "Configured" : "Missing"]]} />
        <SettingCard icon={Truck} title="Supplier" rows={[["Provider", status?.supplier_provider ?? "-"], ["CJ API", status?.cj_configured ? "Configured" : "Missing"]]} />
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Render environment checklist</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {["FRONTEND_URL", "CORS_ORIGINS", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPPLIER_PROVIDER=cj", "CJ_API_KEY", "CJ_PRICE_MARKUP_MULTIPLIER", "CJ_SHIPPING_MARKUP_MULTIPLIER"].map((item) => (
            <div key={item} className="rounded-md bg-mist p-3 text-sm">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingCard({ icon: Icon, title, rows }: { icon: typeof Settings; title: string; rows: [string, string][] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <div className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-slate-600">{label}</span>
            <Status value={value} />
          </div>
        ))}
      </div>
    </article>
  );
}
