# Nexora Production Checklist

## Secrets

- Set `DATABASE_URL` with a managed PostgreSQL instance.
- Set `JWT_SECRET_KEY` and `SECRET_KEY` to long random values.
- Set `ADMIN_PASSWORD` only in the hosting provider environment.
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only in backend environment variables.
- Never commit `.env` files.

## Backend

- Run `alembic upgrade head`.
- Run `python -m app.database.seed` once with a temporary admin password.
- Set `ENVIRONMENT=production`.
- Set `CORS_ORIGINS` to the deployed frontend URL.
- Confirm `/health`, `/docs`, `/api/products` and `/api/webhooks/stripe`.

## Frontend

- Set `VITE_API_URL` to the backend `/api` URL.
- Set `VITE_ENABLE_DEMO_FALLBACK=false` in production.
- Set `VITE_DEFAULT_CURRENCY=USD`.
- Run `npm run build`.

## Stripe

- Use test keys until live checkout is verified.
- Register webhook endpoint `/api/webhooks/stripe`.
- Subscribe to `checkout.session.completed`, `checkout.session.expired` and `payment_intent.payment_failed`.

## SEO

- Update `frontend/public/sitemap.xml` with the final production domain.
- Confirm canonical URLs and product structured data in the browser.
- Confirm images have useful alt text.

