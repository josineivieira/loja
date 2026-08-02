const manualRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.37,
  AUD: 1.52,
  BRL: 5.65,
};

export function convertFromUsd(amount: number, currency: string) {
  return amount * (manualRates[currency] ?? 1);
}

export function formatMoney(amount: number, currency = import.meta.env.VITE_DEFAULT_CURRENCY ?? "USD") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).format(amount);
}

