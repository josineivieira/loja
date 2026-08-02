import { ChevronRight, Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore, type DisplayCurrency, type Language } from "../stores/preferencesStore";
import { t } from "../utils/i18n";

const quickLinks = [
  { to: "/catalog?is_bestseller=true", label: { en: "Best sellers", pt: "Mais vendidos", es: "Mas vendidos" } },
  { to: "/catalog?is_new=true", label: { en: "New arrivals", pt: "Novidades", es: "Novedades" } },
  { to: "/track-order", label: { en: "Track order", pt: "Rastrear pedido", es: "Rastrear pedido" } },
];

export function PublicLayout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { language, currency, setLanguage, setCurrency } = usePreferencesStore();

  const promoCopy = useMemo(
    () =>
      language === "pt"
        ? "Frete internacional com checkout seguro e catalogo pronto para escala"
        : language === "es"
          ? "Envio internacional con pago seguro y catalogo listo para escalar"
          : "International shipping, secure checkout and a catalog built to scale",
    [language],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="border-b border-blue-100 bg-slate-950 text-white">
        <div className="store-shell flex flex-col gap-2 py-2 text-xs font-medium sm:flex-row sm:items-center sm:justify-between">
          <span>{promoCopy}</span>
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span>{language === "pt" ? "Pagamento protegido" : language === "es" ? "Pago protegido" : "Protected payment"}</span>
            <span>•</span>
            <span>{language === "pt" ? "Fluxo pronto para Stripe" : language === "es" ? "Flujo listo para Stripe" : "Stripe-ready flow"}</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="store-shell py-3">
          <div className="flex items-center gap-3 lg:gap-5">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary via-sky-500 to-cyan-400 text-base font-bold text-white shadow-[0_16px_34px_-18px_rgba(37,99,235,0.85)]">
                N
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-950">Nexora</p>
                <p className="text-xs text-slate-500">Smart commerce</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-5 pl-3 text-sm font-medium text-slate-600 lg:flex">
              <Link className="transition hover:text-slate-950" to="/catalog">{t("catalog", language)}</Link>
              {quickLinks.map((item) => (
                <Link key={item.to} className="transition hover:text-slate-950" to={item.to}>
                  {item.label[language]}
                </Link>
              ))}
            </nav>

            <form
              onSubmit={submitSearch}
              className="ml-auto hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-inner md:flex lg:max-w-xl"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder={t("searchPlaceholder", language)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">
                {language === "pt" ? "Buscar" : language === "es" ? "Buscar" : "Search"}
              </button>
            </form>

            <div className="hidden items-center gap-2 xl:flex">
              <select className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Language">
                <option value="en">EN</option>
                <option value="pt">PT</option>
                <option value="es">ES</option>
              </select>
              <select className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" value={currency} onChange={(event) => setCurrency(event.target.value as DisplayCurrency)} aria-label="Currency">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BRL">BRL</option>
              </select>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link aria-label="Account" to="/account" className="rounded-full border border-transparent p-2.5 text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950">
                <UserRound className="h-5 w-5" />
              </Link>
              <Link aria-label="Favorites" to="/favorites" className="rounded-full border border-transparent p-2.5 text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950">
                <Heart className="h-5 w-5" />
              </Link>
              <Link aria-label="Cart" to="/cart" className="relative rounded-full bg-slate-950 p-2.5 text-white shadow-[0_14px_32px_-20px_rgba(15,23,42,0.95)] transition hover:-translate-y-0.5 hover:bg-slate-800">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white">{itemCount}</span>
                ) : null}
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:hidden">
            <form onSubmit={submitSearch} className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder={t("searchPlaceholder", language)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
            <div className="flex flex-wrap items-center gap-2">
              {quickLinks.map((item) => (
                <Link key={item.to} to={item.to} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  {item.label[language]}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-14">
        <Outlet />
      </main>
    </div>
  );
}
