import { useParams } from "react-router-dom";

const content: Record<string, { intro: string; sections: { title: string; body: string }[] }> = {
  "About us": {
    intro: "Nexora is an international smart-gadget store focused on curated products, secure checkout and supplier-connected fulfillment.",
    sections: [
      { title: "Product selection", body: "Products are imported from supplier catalogs and edited by Nexora before publication, including price, title and description." },
      { title: "Real checkout", body: "Before payment, the backend recalculates product prices, stock, discounts and supplier shipping for the delivery address." },
      { title: "Fulfillment", body: "Paid orders are prepared for CJ fulfillment and can be synchronized for supplier status and tracking updates." },
    ],
  },
  Contact: {
    intro: "Need help with an order, product or delivery? Contact Nexora support with your order number when available.",
    sections: [
      { title: "Support email", body: "support@nexora.com.br" },
      { title: "Orders", body: "Use the order tracking page to check payment, fulfillment and delivery status." },
      { title: "Business", body: "For supplier or partnership questions, include product links, SKU details and estimated volume." },
    ],
  },
  FAQ: {
    intro: "Quick answers for common Nexora shopping questions.",
    sections: [
      { title: "Do you ship internationally?", body: "Shipping availability and delivery estimates are checked at checkout using the delivery address. If the supplier cannot quote the route, checkout is blocked before payment." },
      { title: "How do payments work?", body: "Card payments are processed through Stripe Checkout. Nexora stores payment status and provider references, not card details." },
      { title: "How do I track an order?", body: "Open My orders or Track order and enter the order number. Tracking appears after the supplier provides a tracking number." },
    ],
  },
  "Password recovery": {
    intro: "Password recovery is prepared in the account flow. For now, contact support if you cannot access your account.",
    sections: [
      { title: "Security", body: "Only account owners should request access changes. Support may ask for order or email verification." },
      { title: "Next login", body: "After your password is reset, return to the login page and sign in with your new credentials." },
    ],
  },
  "Privacy policy": {
    intro: "Nexora collects only the information needed to operate accounts, orders, checkout and customer support.",
    sections: [
      { title: "Data used", body: "Account, contact, shipping and order details are used to process purchases and provide support." },
      { title: "Payments", body: "Card data is handled by the payment provider. Nexora stores payment status and provider references, not raw card numbers." },
      { title: "Retention", body: "Order records may be retained for operational, fraud prevention and legal compliance purposes." },
    ],
  },
  "Terms of use": {
    intro: "By using Nexora, customers agree to provide accurate account, delivery and payment information.",
    sections: [
      { title: "Orders", body: "Orders are subject to stock, fraud checks, payment confirmation and shipping availability." },
      { title: "Prices", body: "Prices, discounts and shipping are recalculated by the backend during checkout before the order is created." },
      { title: "Account use", body: "Customers are responsible for keeping login credentials secure." },
    ],
  },
  "Shipping policy": {
    intro: "Shipping availability, price and estimated delivery are calculated during checkout using the customer's destination.",
    sections: [
      { title: "Delivery estimates", body: "The delivery range shown at checkout comes from the selected supplier route when available." },
      { title: "No fake shipping", body: "If the supplier cannot return a valid freight quote for the address, the order cannot proceed to payment." },
      { title: "International orders", body: "Import procedures, customs inspections or local carrier delays may vary by destination country." },
    ],
  },
  "Returns and refunds": {
    intro: "Return and refund requests are reviewed based on order status, product condition and payment confirmation.",
    sections: [
      { title: "Before fulfillment", body: "Contact support quickly if the address or item needs correction before the supplier receives the order." },
      { title: "After delivery", body: "Include order number, photos and a clear description of the issue so support can review the request." },
      { title: "Refunds", body: "Approved refunds are processed through the original payment provider when available and may depend on fulfillment status." },
    ],
  },
  "Cookie policy": {
    intro: "Nexora uses essential local storage and cookies to keep cart, favorites, session and storefront preferences working.",
    sections: [
      { title: "Essential storage", body: "Cart, favorites and login tokens are stored locally so the shopping experience remains usable." },
      { title: "Preferences", body: "Language and currency choices may be retained for convenience." },
    ],
  },
};

export function PlaceholderPage({ title }: { title: string }) {
  const params = useParams();
  const page = content[title];

  if (page) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{page.intro}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        This page is reserved in the routing structure and will be completed in the next phases.
      </p>
      {params.slug ? <p className="mt-4 text-sm text-slate-500">Slug: {params.slug}</p> : null}
    </section>
  );
}
