import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { QuantityStepper } from "../components/QuantityStepper";
import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import { formatMoney } from "../utils/currency";

export function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCartStore();
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount;
  const currency = items[0]?.currency ?? "USD";

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-lg border border-slate-200 p-10 text-center">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-3 text-slate-600">Add smart gadgets to start an international order.</p>
          <Link to="/catalog" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
            Browse catalog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Cart</h1>
          <p className="mt-2 text-sm text-slate-600">Saved locally for guest checkout and ready for account sync later.</p>
        </div>
        <button className="text-sm font-semibold text-danger" onClick={clear}>
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.variantId} className="grid gap-4 rounded-lg border border-slate-200 p-4 shadow-sm sm:grid-cols-[96px_1fr_auto]">
              <Link to={`/product/${item.productSlug}`} className="aspect-square overflow-hidden rounded-md bg-mist">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
              </Link>
              <div>
                <Link to={`/product/${item.productSlug}`} className="font-semibold">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-slate-600">{item.variantSku}</p>
                <p className="mt-3 text-sm font-semibold">{formatMoney(item.unitPrice, item.currency, displayCurrency)}</p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <QuantityStepper value={item.quantity} onChange={(quantity) => updateQuantity(item.variantId, quantity)} />
                <button className="rounded-md p-2 text-danger hover:bg-red-50" aria-label="Remove item" onClick={() => removeItem(item.variantId)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatMoney(subtotal, currency, displayCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount</span>
              <span>{formatMoney(discount, currency, displayCurrency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t border-slate-200 pt-3 text-base font-semibold">
              <div className="flex justify-between">
                <span>Total</span>
                <span>{formatMoney(total, currency, displayCurrency)}</span>
              </div>
            </div>
          </div>
          <Link to="/checkout" className="mt-6 flex h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white hover:bg-primaryDark">
            Continue to checkout
          </Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">Final totals, discounts and shipping will be recalculated by the backend during checkout.</p>
        </aside>
      </div>
    </section>
  );
}
