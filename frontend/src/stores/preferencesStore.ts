import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "pt" | "es";
export type DisplayCurrency = "USD" | "EUR" | "BRL";

type PreferencesState = {
  language: Language;
  currency: DisplayCurrency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: DisplayCurrency) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "pt",
      currency: "USD",
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "nexora-preferences" },
  ),
);
