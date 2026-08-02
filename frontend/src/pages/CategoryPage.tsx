import { useParams } from "react-router-dom";

import { CatalogPage } from "./CatalogPage";

export function CategoryPage() {
  const { slug } = useParams();
  return <CatalogPage categorySlug={slug} title="Category" />;
}

