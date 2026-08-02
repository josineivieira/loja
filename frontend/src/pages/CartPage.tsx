import { ShieldCheck, Trash2, Truck } from "lucide-react";
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
      <section className="store-shell py-12 sm:py-16">
        <div className="surface-card px-6 py-12 text-center sm:px-10">
          <span className="pill-chip">Nexora cart</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Seu carrinho está vazio</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">Adicione produtos para testar o fluxo completo de preço, frete e checkout sem alterar a estrutura de integrações.</p>
          <Link to="/catalog" className="primary-button mt-8">
            Ver catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="store-shell py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="pill-chip">Checkout ready</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Carrinho com resumo claro e pronto para conversão</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Mantive a lógica do carrinho intacta e melhorei a leitura visual para quantidade, preço, confiança e avanço para o checkout.</p>
        </div>
        <button className="text-sm font-semibold text-danger transition hover:opacity-80" onClick={clear}>
          Limpar carrinho
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_390px]">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.variantId} className="surface-card grid gap-5 p-4 sm:grid-cols-[132px_1fr_auto] sm:p-5">
              <Link to={`/product/${item.productSlug}`} className="aspect-square overflow-hidden rounded-[20px] bg-gradient-to-br from-slate-50 to-blue-50">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
              </Link>
              <div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>SKU</span>
                  <span>{item.variantSku}</span>
                </div>
                <Link to={`/product/${item.productSlug}`} className="mt-2 block text-lg font-semibold tracking-tight text-slate-950">
                  {item.name}
                </Link>
                <p className="mt-3 text-sm text-slate-500">Produto salvo localmente para checkout guest e pronto para sincronização futura com conta.</p>
                <div className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {formatMoney(item.unitPrice, item.currency, displayCurrency)}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                <QuantityStepper value={item.quantity} onChange={(quantity) => updateQuantity(item.variantId, quantity)} />
                <button className="rounded-full p-2.5 text-danger transition hover:bg-red-50" aria-label="Remove item" onClick={() => removeItem(item.variantId)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="surface-card h-fit p-6 xl:sticky xl:top-28">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Resumo do pedido</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Valores finais continuam sendo recalculados no backend no checkout para manter preço, frete e estoque confiáveis.</p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatMoney(subtotal, currency, displayCurrency)}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Desconto</span>
              <span className="font-semibold text-slate-900">{formatMoney(discount, currency, displayCurrency)}</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-slate-600">Frete</span>
              <span className="font-semibold text-slate-900">Calculado no checkout</span>
            </div>
            <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white shadow-[0_20px_40px_-25px_rgba(15,23,42,0.95)]">
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(total, currency, displayCurrency)}</span>
              </div>
            </div>
          </div>

          <Link to="/checkout" className="primary-button mt-6 flex w-full">
            Continuar para o checkout
          </Link>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-slate-900">Pagamento protegido</p>
                  <p className="mt-1 text-slate-600">O backend recalcula o pedido antes de criar a sessão segura de pagamento.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-slate-900">Frete por destino</p>
                  <p className="mt-1 text-slate-600">Entrega, método e total seguem dependentes do endereço e continuam intactos.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
