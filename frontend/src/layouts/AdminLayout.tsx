import { BarChart3, Bell, Boxes, ClipboardList, CreditCard, FileText, Home, LogOut, Megaphone, Package, Settings, ShieldCheck, Star, Tags, Truck, Users } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import { t } from "../utils/i18n";

const navItems = [
  { to: "/admin", labelKey: "adminDashboard", icon: BarChart3 },
  { to: "/admin/products", labelKey: "adminProducts", icon: Package },
  { to: "/admin/categories", labelKey: "adminCategories", icon: Boxes },
  { to: "/admin/orders", labelKey: "adminOrders", icon: ClipboardList },
  { to: "/admin/customers", labelKey: "adminCustomers", icon: Users },
  { to: "/admin/coupons", labelKey: "adminCoupons", icon: Tags },
  { to: "/admin/reviews", labelKey: "adminReviews", icon: Star },
  { to: "/admin/notifications", labelKey: "adminNotifications", icon: Bell },
  { to: "/admin/shipping", labelKey: "adminShipping", icon: Truck },
  { to: "/admin/payments", labelKey: "adminPayments", icon: CreditCard },
  { to: "/admin/integrations", labelKey: "adminIntegrations", icon: ShieldCheck },
  { to: "/admin/banners", labelKey: "adminBanners", icon: Megaphone },
  { to: "/admin/pages", labelKey: "adminPages", icon: FileText },
  { to: "/admin/settings", labelKey: "adminSettings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const language = usePreferencesStore((state) => state.language);

  useEffect(() => {
    if (!accessToken) navigate("/login");
  }, [accessToken, navigate]);

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <span className="text-lg font-semibold">Nexora Admin</span>
          <NavLink to="/" className="rounded-md p-2 hover:bg-mist" title={t("storefront", language)}>
            <Home className="h-4 w-4" />
          </NavLink>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-blue-50 font-semibold text-primary" : "text-slate-600 hover:bg-mist hover:text-ink"}`
              }
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey, language)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">{t("operations", language)}</p>
            <h1 className="text-lg font-semibold">{t("adminPanel", language)}</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            {t("signOut", language)}
          </button>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
