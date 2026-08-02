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

export function convertMoney(amount: number, fromCurrency: string, toCurrency: string) {
  const fromRate = manualRates[fromCurrency] ?? 1;
  const toRate = manualRates[toCurrency] ?? 1;
  return (amount / fromRate) * toRate;
}

export function formatMoney(amount: number, currency = import.meta.env.VITE_DEFAULT_CURRENCY ?? "USD", displayCurrency = currency) {
  const converted = convertMoney(amount, currency, displayCurrency);
  return new Intl.NumberFormat(displayCurrency === "BRL" ? "pt-BR" : displayCurrency === "EUR" ? "de-DE" : "en-US", {
    style: "currency",
    currency: displayCurrency,
  }).format(converted);
}
