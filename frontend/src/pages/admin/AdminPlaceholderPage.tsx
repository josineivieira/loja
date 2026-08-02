import { PageTitle } from "./AdminProductsPage";

const moduleContent: Record<string, { summary: string; items: string[] }> = {
  Variants: {
    summary: "Variant stock is created with each product. Use Products to add the base product and first sellable variant.",
    items: ["SKU, price, cost and stock are stored per variant.", "Order creation checks variant stock before saving.", "Dedicated variant editing can be added after product editing rules are final."],
  },
  Inventory: {
    summary: "Inventory is active through product variants and checkout validation.",
    items: ["Low stock appears on the dashboard.", "Product creation sets initial stock.", "Stock movements and purchase orders are the next deeper operations layer."],
  },
  Banners: {
    summary: "Storefront banners are currently managed in code to keep the public site stable.",
    items: ["Use Products for merchandising priority.", "Featured/new/bestseller flags are already available.", "A database-driven banner editor can be added when campaign assets are ready."],
  },
  Pages: {
    summary: "Public pages now show real storefront policy content instead of empty placeholders.",
    items: ["About, FAQ, privacy, terms, shipping, returns and cookies are filled.", "Final legal text should be reviewed before live sales.", "A CMS editor can be connected later."],
  },
  Payments: {
    summary: "Stripe Checkout is implemented. Real card charging starts when live Stripe keys are configured on Render.",
    items: ["Set STRIPE_SECRET_KEY in nexora-backend.", "Create Stripe webhook for /api/webhooks/stripe.", "Set STRIPE_WEBHOOK_SECRET and redeploy backend."],
  },
  Settings: {
    summary: "Production settings are controlled by Render environment variables.",
    items: ["Backend: FRONTEND_URL, CORS_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.", "Frontend: VITE_API_URL, VITE_ENABLE_DEMO_FALLBACK=false, VITE_DEFAULT_CURRENCY.", "After changing env vars, redeploy the affected service."],
  },
  "Administrative users": {
    summary: "Admin access is role-based and created from the backend seed using ADMIN_EMAIL and ADMIN_PASSWORD.",
    items: ["Set ADMIN_EMAIL and ADMIN_PASSWORD in Render backend.", "Redeploy backend to create the first admin if missing.", "Use /login, then open /admin."],
  },
  Logs: {
    summary: "Operational logs are available in Render service logs and payment events are stored in the database.",
    items: ["Use Render Logs for backend exceptions and deploy output.", "Stripe webhook events are saved in payment_events.", "Failed payments appear in dashboard metrics."],
  },
};

export function AdminPlaceholderPage({ title }: { title: string }) {
  const content = moduleContent[title];

  return (
    <div>
      <PageTitle title={title} />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {content?.summary ?? "This module is available in the admin navigation and connected to the current operations workflow."}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(content?.items ?? ["Review the connected dashboard modules.", "Use Products, Orders, Shipping, Coupons and Integrations for live operations.", "Redeploy after changing production configuration."]).map((item) => (
            <div key={item} className="rounded-md border border-slate-200 bg-mist p-4 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
