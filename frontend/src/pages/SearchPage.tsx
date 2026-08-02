import { useSearchParams } from "react-router-dom";

import { CatalogPage } from "./CatalogPage";

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  return <CatalogPage searchQuery={query} title={query ? `Search: ${query}` : "Search"} />;
}

