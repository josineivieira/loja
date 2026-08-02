import { ArrowRight, ShieldCheck, Trash2, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { QuantityStepper } from "../components/QuantityStepper";
import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import { formatMoney } from "../utils/currency";

export function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCartStore();
  const displayCurrency = usePreferencesStore((state) => state.currency);
  const language = usePreferencesStore((state) => state.language);
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount;
  const currency = items[0]?.currency ?? "USD";

  if (items.length === 0) {
    return (
      <section className="section-space">
        <div className="shell">
          <div className="panel mx-auto max-w-3xl p-10 text-center md:p-16">
            <p className="eyebrow">Nexora cart</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
              {language === "pt" ? "Seu carrinho está vazio" : language === "es" ? "Tu carrito está vacío" : "Your cart is empty"}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
              {language === "pt"
                ? "Aproveite o novo visual premium da loja para montar um carrinho mais forte antes de seguir para o checkout."
                : language === "es"
                  ? "Aprovecha el nuevo visual premium de la tienda para montar un carrito más sólido antes de continuar al checkout."
                  : "Use the upgraded premium storefront to build a stronger cart before continuing to checkout."}
            </p>
            <Link to="/catalog" className="btn-primary mt-8">
              {language === "pt" ? "Explorar catálogo" : language === "es" ? "Explorar catálogo" : "Browse catalog"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-space">
      <div className="shell">
        <div className="panel mb-8 overflow-hidden">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="eyebrow">Cart review</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                {language === "pt" ? "Carrinho" : language === "es" ? "Carrito" : "Cart"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                {language === "pt"
                  ? "Organização mais limpa, melhor leitura dos itens e resumo financeiro com visual muito mais profissional."
                  : language === "es"
                    ? "Organización más limpia, mejor lectura de los productos y un resumen financiero con apariencia mucho más profesional."
                    : "Cleaner organization, clearer item reading and a much more professional financial summary."}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="border border-slate-200 bg-[#f8f6f1] p-4">{items.length} {language === "pt" ? "itens no carrinho" : language === "es" ? "ítems en el carrito" : "items in cart"}</div>
              <div className="border border-slate-200 bg-[#f8f6f1] p-4">{language === "pt" ? "Checkout seguro" : language === "es" ? "Checkout seguro" : "Secure checkout"}</div>
              <div className="border border-slate-200 bg-[#f8f6f1] p-4">{language === "pt" ? "Revisão rápida" : language === "es" ? "Revisión rápida" : "Fast review"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.variantId} className="panel grid gap-5 p-4 md:grid-cols-[120px_1fr_auto] md:p-5">
                <Link to={`/product/${item.productSlug}`} className="overflow-hidden border border-slate-200 bg-[#f7f4ee]">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="aspect-square h-full w-full object-cover" /> : <div className="aspect-square" />}
                </Link>

                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      <span>{item.currency}</span>
                      <span>{item.variantSku}</span>
                    </div>
                    <Link to={`/product/${item.productSlug}`} className="mt-3 block text-xl font-semibold tracking-[-0.02em] text-slate-950">
                      {item.name}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Unit price</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{formatMoney(item.unitPrice, item.currency, displayCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Item total</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{formatMoney(item.unitPrice * item.quantity, item.currency, displayCurrency)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                  <QuantityStepper value={item.quantity} onChange={(quantity) => updateQuantity(item.variantId, quantity)} />
                  <button className="inline-flex h-12 w-12 items-center justify-center border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100" aria-label="Remove item" onClick={() => removeItem(item.variantId)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="panel h-fit overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
              <h2 className="text-lg font-semibold tracking-[0.02em]">
                {language === "pt" ? "Resumo do pedido" : language === "es" ? "Resumen del pedido" : "Order summary"}
              </h2>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-950">{formatMoney(subtotal, currency, displayCurrency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-slate-950">{formatMoney(discount, currency, displayCurrency)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-medium text-slate-950">{language === "pt" ? "Calculado no checkout" : language === "es" ? "Calculado en checkout" : "Calculated at checkout"}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{formatMoney(total, currency, displayCurrency)}</p>
                  </div>
                  <div className="text-right text-xs leading-5 text-slate-500">
                    {language === "pt" ? "Valores finais confirmados pelo backend" : language === "es" ? "Valores finales confirmados por el backend" : "Final totals confirmed by backend"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 border border-slate-200 bg-[#f8f6f1] p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-900" />
                  <span>{language === "pt" ? "Checkout seguro com pagamento protegido." : language === "es" ? "Checkout seguro con pago protegido." : "Protected checkout with secure payment."}</span>
                </div>
                <div className="flex items-start gap-3 border border-slate-200 bg-[#f8f6f1] p-4">
                  <Truck className="mt-0.5 h-4 w-4 text-slate-900" />
                  <span>{language === "pt" ? "Frete e prazo atualizados conforme o destino." : language === "es" ? "Envío y plazo actualizados según el destino." : "Shipping and delivery lead time updated by destination."}</span>
                </div>
              </div>

              <div className="grid gap-3">
                <Link to="/checkout" className="btn-primary w-full justify-center">
                  {language === "pt" ? "Ir para o checkout" : language === "es" ? "Ir al checkout" : "Continue to checkout"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="btn-secondary w-full justify-center" onClick={clear}>
                  {language === "pt" ? "Limpar carrinho" : language === "es" ? "Vaciar carrito" : "Clear cart"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
