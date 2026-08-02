import { Link, useSearchParams } from "react-router-dom";

export function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get("order");
  const payment = params.get("payment");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-lg border border-slate-200 p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase text-success">Order created</p>
        <h1 className="mt-3 text-3xl font-semibold">Thank you for your order</h1>
        {orderNumber ? <p className="mt-4 text-slate-600">Order number: <span className="font-semibold text-ink">{orderNumber}</span></p> : null}
        <p className="mt-3 text-sm text-slate-600">
          {payment === "success" ? "Stripe returned successfully. The backend webhook is responsible for confirming the paid status." : "Payment is pending until Stripe confirms it by webhook."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/catalog" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold">Continue shopping</Link>
          {orderNumber ? <Link to={`/orders/${orderNumber}`} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">View order</Link> : null}
        </div>
      </div>
    </section>
  );
}
