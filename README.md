# Nexora Ecommerce Dropshipping

Nexora is an international ecommerce foundation for smart gadgets, built with React, TypeScript, FastAPI, PostgreSQL, Docker, Alembic and JWT authentication.

## Phase 1 Scope

- Production-style monorepo structure.
- Docker Compose with frontend, backend and PostgreSQL.
- FastAPI backend with layered architecture.
- PostgreSQL models and Alembic migration for users, roles, categories, products, variants, inventory, suppliers and audit-friendly timestamps.
- JWT auth with hashed passwords, refresh tokens and role checks.
- Public product/category APIs and protected admin CRUD APIs.
- Seed command for admin user, categories, products, variants and shipping-ready supplier data.
- Frontend Vite shell prepared for public and admin phases.
- Integration interfaces for payments, shipping and suppliers, including a manual supplier provider for future CJ Dropshipping operations.

## Phase 2 Scope

- Public storefront home connected to category and product APIs.
- Catalog page with search, category, price, availability, promotion, new-arrival, bestseller filters and pagination.
- Category and search routes backed by API query parameters.
- Product detail page with image gallery, variant selection, quantity control, stock validation and add-to-cart.
- Guest cart persisted locally with quantity updates, removal, clear cart, subtotal, discount placeholder, estimated shipping and backend-recalculation notice.
- Reusable product card, skeleton loading and quantity stepper components.
- Seed expanded with multiple visual products and product images.

## Phase 3 Scope

- Checkout API that recalculates item prices, stock, coupons, shipping, taxes and totals on the backend.
- Order creation with pending payment status, order items, shipping address and status history.
- Shipping methods and coupons tables with seed data.
- Customer-facing checkout flow with identification, address, delivery, payment placeholder and review steps.
- Order confirmation and order detail pages.
- Guest checkout support with local cart payload converted into validated backend order data.

## Phase 4 Scope

- Stripe Checkout session creation from backend orders.
- Payment records and payment event audit tables.
- Stripe webhook endpoint with raw-body signature verification support.
- Backend-only order payment confirmation through `checkout.session.completed`.
- Failed/expired payment handling through Stripe webhook events.
- Frontend checkout requests a Stripe payment session after creating an order and redirects to Stripe when `STRIPE_SECRET_KEY` is configured.
- Safe test placeholder when Stripe keys are not configured, keeping local development clickable.

## Phase 5 Scope

- Administrative API expanded for dashboard, products, orders, customers, coupons and shipping methods.
- Admin dashboard metrics for orders, paid orders, pending orders, failed payments, low stock, supplier pending orders and new customers.
- Order status update endpoint with order history entry.
- Coupon and shipping method CRUD foundation.
- Separate React admin layout under `/admin` with sidebar navigation.
- Admin screens for dashboard, products, orders, customers, coupons and shipping.
- Reserved admin routes for categories, variants, inventory, reviews, banners, pages, payments, integrations, settings, administrative users and logs.
- Demo fallback for admin screens when the backend is not running locally.

## Phase 6 Scope

- Wishlist tables and authenticated wishlist APIs.
- Local guest favorites in the storefront with a complete `/favorites` page.
- Product reviews, review images foundation and admin moderation endpoints.
- Reviews displayed on product detail pages with demo fallback.
- Shipment and tracking event tables with `/track-order` experience.
- Notification table and admin notifications screen.
- Decoupled email service with a development log provider, ready for Resend, SendGrid or SES adapters.
- Seed data for an approved review and an admin notification.

## Phase 7 Scope

- Manual supplier workflow for CJ Dropshipping operations.
- Supplier fields on orders, order items and shipments.
- Copyable supplier payload generated through `ManualSupplierProvider`.
- Admin endpoints to list supplier-pending orders, generate payload, register manual CJ order ID/cost and add tracking.
- Admin integrations screen with supplier handoff, copy payload button, supplier submission form and tracking form.
- Tracking events are created when admin adds manual supplier tracking.

## Phase 8 Scope

- Security headers expanded with permissions policy and production HSTS.
- In-memory rate limiting for sensitive auth, checkout and webhook endpoints.
- Backend SEO endpoints for `robots.txt` and `sitemap.xml`.
- Frontend SEO component for page titles, descriptions, canonical links, Open Graph and JSON-LD.
- Product structured data on product detail pages.
- Additional backend tests for money rounding and rate limiting.
- Render, Railway and Vercel deployment configuration files.
- Production checklist in `docs/PRODUCTION_CHECKLIST.md`.

## Architecture

Frontend uses React Router, Tailwind CSS, React Hook Form, Zod and Zustand. Backend routes call services, services call repositories, and repositories own database access. External systems are behind provider interfaces so Stripe, PayPal, CJ Dropshipping, email and shipping providers can be swapped without rewriting order logic.

## Database Model

Core entities in Phase 1:

- `users`, `roles`, `user_roles`, `user_addresses`
- `categories`
- `suppliers`, `products`, `product_images`, `product_videos`
- `product_options`, `product_option_values`, `product_variants`, `variant_option_values`
- `inventories`

Main relationships:

- Users have many addresses and many roles.
- Categories are hierarchical and have many products.
- Products belong to categories and suppliers, and have images, videos, options and variants.
- Variants have their own SKU, price, cost, stock status and option values.
- Inventory is tracked per product variant.

## APIs

Initial APIs:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/categories`
- `GET /api/categories/{slug}/products`
- `GET /api/products`
- `GET /api/products/search`
- `GET /api/products/{slug}`
- `GET /api/admin/dashboard`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/{category_id}`
- `POST /api/admin/products`
- `PATCH /api/admin/products/{product_id}`
- `DELETE /api/admin/products/{product_id}`

## Setup

1. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Set `ADMIN_PASSWORD` in `backend/.env`.

3. Start the stack:

```bash
docker compose up --build
```

4. Run migrations:

```bash
docker compose exec backend alembic upgrade head
```

5. Seed the database:

```bash
docker compose exec backend python -m app.database.seed
```

Backend: `http://localhost:8000`
Frontend: `http://localhost:5173`
Swagger: `http://localhost:8000/docs`

## Tests

```bash
docker compose exec backend pytest
```

Manual Phase 1 checks:

- Register a customer through `POST /api/auth/register`.
- Login with `admin@nexora.local` and the configured `ADMIN_PASSWORD`.
- Open `/api/auth/me` with the access token.
- List `/api/categories` and `/api/products`.
- Create an admin product using an admin token.
- Confirm non-admin users cannot access `/api/admin/*`.

## Deployment Notes

- Backend is ready for Render or Railway with `DATABASE_URL` and secrets from environment variables.
- Frontend is ready for Vercel with `VITE_API_URL`.
- PostgreSQL can run on Render, Railway, Neon or Supabase.
- Stripe and CJ values are present in `.env.example` but must never be committed with real credentials.

## Future Phases

Next work should focus on replacing placeholders with deeper CRUD screens, broadening automated tests and connecting real provider credentials in a staging environment.
