export type Language = "en" | "pt" | "es";

const translations: Record<Language, Record<string, string>> = {
  en: {
    catalog: "Catalog",
    shopNow: "Shop Now",
  },
  pt: {
    catalog: "Catalogo",
    shopNow: "Comprar agora",
  },
  es: {
    catalog: "Catalogo",
    shopNow: "Comprar ahora",
  },
};

export function t(key: string, language: Language = "en") {
  return translations[language][key] ?? translations.en[key] ?? key;
}

