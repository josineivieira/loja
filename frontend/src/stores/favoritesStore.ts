import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavoriteItem = {
  productId: string;
  productSlug: string;
  name: string;
  imageUrl?: string | null;
  currency: string;
  price: number;
};

type FavoritesState = {
  items: FavoriteItem[];
  toggle: (item: FavoriteItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) =>
          state.items.some((entry) => entry.productId === item.productId)
            ? { items: state.items.filter((entry) => entry.productId !== item.productId) }
            : { items: [...state.items, item] },
        ),
      remove: (productId) => set((state) => ({ items: state.items.filter((entry) => entry.productId !== productId) })),
      has: (productId) => get().items.some((entry) => entry.productId === productId),
    }),
    { name: "nexora-favorites" },
  ),
);

