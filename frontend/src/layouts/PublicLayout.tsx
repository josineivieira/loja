import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useCartStore } from "../stores/cartStore";
import { usePreferencesStore, type DisplayCurrency, type Language } from "../stores/preferencesStore";
import { t } from "../utils/i18n";

const navCopy = {
  en: {
    announcement: "Global shipping with protected checkout and premium support.",
    categories: "Categories",
    discover: "Discover",
    support: "Support",
    footerTitle: "A premium storefront base for fast-growing ecommerce brands.",
    footerCopy: "Sharper visual identity, cleaner product discovery and a checkout flow built to convert.",
    rights: "All rights reserved.",
  },
  pt: {
    announcement: "Envio global com checkout protegido e atendimento premium.",
    categories: "Categorias",
    discover: "Descobrir",
    support: "Atendimento",
    footerTitle: "Uma base premium para marcas de ecommerce que querem vender mais.",
    footerCopy: "Identidade mais forte, descoberta de produto mais limpa e checkout desenhado para conversão.",
    rights: "Todos os direitos reservados.",
  },
  es: {
    announcement: "Envio global con checkout protegido y soporte premium.",
    categories: "Categorias",
    discover: "Descubrir",
    support: "Atencion",
    footerTitle: "Una base premium para marcas ecommerce que quieren vender más.",
    footerCopy: "Identidad más fuerte, descubrimiento de producto más limpio y checkout pensado para conversión.",
    rights: "Todos los derechos reservados.",
  },
} as const;

export function PublicLayout() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { language, currency, setLanguage, setCurrency } = usePreferencesStore();
  const copy = navCopy[language];

  const navItems = useMemo(
    () => [
      { label: t("catalog", language), href: "/catalog" },
      { label: copy.categories, href: "/catalog" },
      { label: copy.discover, href: "/about" },
      { label: copy.support, href: "/faq" },
    ],
    [copy.categories, copy.discover, copy.support, language],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <div className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="shell flex min-h-10 items-center justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-slate-300">
          <span>{copy.announcement}</span>
          <span className="hidden md:block">Nexora Commerce Edition</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-[#f7f5f0]/95 backdrop-blur-xl">
        <div className="shell flex min-h-[84px] items-center gap-4">
          <button className="btn-ghost p-2 md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center border border-slate-900 bg-slate-900 text-sm font-semibold uppercase tracking-[0.28em] text-white">
                NX
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[0.18em] text-slate-950">NEXORA</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Premium store system</p>
              </div>
            </div>
          </Link>

          <nav className="ml-4 hidden items-center gap-7 text-[13px] font-medium text-slate-700 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} to={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <form onSubmit={submitSearch} className="hidden h-12 min-w-[320px] items-center border border-slate-300 bg-white px-4 lg:flex">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                className="ml-3 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder={t("searchPlaceholder", language)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>

            <select className="hidden h-12 border border-slate-300 bg-white px-3 text-sm md:block" value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label="Language">
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="es">ES</option>
            </select>

            <select className="hidden h-12 border border-slate-300 bg-white px-3 text-sm md:block" value={currency} onChange={(event) => setCurrency(event.target.value as DisplayCurrency)} aria-label="Currency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
            </select>

            <Link aria-label="Account" to="/account" className="inline-flex h-12 w-12 items-center justify-center border border-slate-300 bg-white transition hover:border-slate-950 hover:text-slate-950">
              <UserRound className="h-5 w-5" />
            </Link>
            <Link aria-label="Favorites" to="/favorites" className="inline-flex h-12 w-12 items-center justify-center border border-slate-300 bg-white transition hover:border-slate-950 hover:text-slate-950">
              <Heart className="h-5 w-5" />
            </Link>
            <Link aria-label="Cart" to="/cart" className="relative inline-flex h-12 w-12 items-center justify-center border border-slate-900 bg-slate-900 text-white transition hover:bg-slate-800">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center border border-[#f7f5f0] bg-[#dbeafe] px-1 text-[11px] font-semibold text-slate-900">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-[#efebe4]">
        <div className="shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="eyebrow">Nexora storefront</p>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-slate-950 md:text-3xl">{copy.footerTitle}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{copy.footerCopy}</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 md:justify-items-end">
            <Link to="/privacy-policy" className="transition hover:text-slate-950">Privacy Policy</Link>
            <Link to="/terms" className="transition hover:text-slate-950">Terms of Use</Link>
            <Link to="/shipping-policy" className="transition hover:text-slate-950">Shipping Policy</Link>
            <p className="pt-2 text-xs uppercase tracking-[0.22em] text-slate-500">© 2026 Nexora — {copy.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
