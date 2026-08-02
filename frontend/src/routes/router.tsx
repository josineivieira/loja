import { createBrowserRouter } from "react-router-dom";

import { PublicLayout } from "../layouts/PublicLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { AccountPage } from "../pages/AccountPage";
import { CartPage } from "../pages/CartPage";
import { CatalogPage } from "../pages/CatalogPage";
import { CategoryPage } from "../pages/CategoryPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { HomePage } from "../pages/HomePage";
import { FavoritesPage } from "../pages/FavoritesPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrdersPage } from "../pages/OrdersPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ProductPage } from "../pages/ProductPage";
import { OrderConfirmationPage } from "../pages/OrderConfirmationPage";
import { OrderDetailsPage } from "../pages/OrderDetailsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SearchPage } from "../pages/SearchPage";
import { TrackingPage } from "../pages/TrackingPage";
import { AdminCouponsPage } from "../pages/admin/AdminCouponsPage";
import { AdminCustomersPage } from "../pages/admin/AdminCustomersPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminIntegrationsPage } from "../pages/admin/AdminIntegrationsPage";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage";
import { AdminNotificationsPage } from "../pages/admin/AdminNotificationsPage";
import { AdminPlaceholderPage } from "../pages/admin/AdminPlaceholderPage";
import { AdminProductsPage } from "../pages/admin/AdminProductsPage";
import { AdminReviewsPage } from "../pages/admin/AdminReviewsPage";
import { AdminShippingPage } from "../pages/admin/AdminShippingPage";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "products", element: <AdminProductsPage /> },
      { path: "categories", element: <AdminPlaceholderPage title="Categories" /> },
      { path: "variants", element: <AdminPlaceholderPage title="Variants" /> },
      { path: "inventory", element: <AdminPlaceholderPage title="Inventory" /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "customers", element: <AdminCustomersPage /> },
      { path: "coupons", element: <AdminCouponsPage /> },
      { path: "reviews", element: <AdminReviewsPage /> },
      { path: "banners", element: <AdminPlaceholderPage title="Banners" /> },
      { path: "pages", element: <AdminPlaceholderPage title="Pages" /> },
      { path: "shipping", element: <AdminShippingPage /> },
      { path: "payments", element: <AdminPlaceholderPage title="Payments" /> },
      { path: "integrations", element: <AdminIntegrationsPage /> },
      { path: "settings", element: <AdminPlaceholderPage title="Settings" /> },
      { path: "users", element: <AdminPlaceholderPage title="Administrative users" /> },
      { path: "logs", element: <AdminPlaceholderPage title="Logs" /> },
      { path: "notifications", element: <AdminNotificationsPage /> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/catalog", element: <CatalogPage /> },
      { path: "/category/:slug", element: <CategoryPage /> },
      { path: "/product/:slug", element: <ProductPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/order-confirmation", element: <OrderConfirmationPage /> },
      { path: "/track-order", element: <TrackingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <PlaceholderPage title="Password recovery" /> },
      { path: "/account", element: <AccountPage /> },
      { path: "/orders", element: <OrdersPage /> },
      { path: "/orders/:orderNumber", element: <OrderDetailsPage /> },
      { path: "/favorites", element: <FavoritesPage /> },
      { path: "/about", element: <PlaceholderPage title="About us" /> },
      { path: "/contact", element: <PlaceholderPage title="Contact" /> },
      { path: "/faq", element: <PlaceholderPage title="FAQ" /> },
      { path: "/privacy-policy", element: <PlaceholderPage title="Privacy policy" /> },
      { path: "/terms", element: <PlaceholderPage title="Terms of use" /> },
      { path: "/shipping-policy", element: <PlaceholderPage title="Shipping policy" /> },
      { path: "/returns-policy", element: <PlaceholderPage title="Returns and refunds" /> },
      { path: "/cookies-policy", element: <PlaceholderPage title="Cookie policy" /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
