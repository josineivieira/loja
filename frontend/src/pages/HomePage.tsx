import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { ProductCard } from "../components/ProductCard";
import { Seo } from "../components/Seo";
import { listCategories, listProducts } from "../services/catalogService";
import type { Category, Product } from "../types/catalog";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      listCategories(),
      listProducts({ is_bestseller: true, limit: 4, sort: "bestsellers" }),
      listProducts({ is_new: true, limit: 4, sort: "newest" }),
    ]).then(([categoryData, bestsellerData, newData]) => {
      setCategories(categoryData);
      setBestSellers(bestsellerData);
      setNewArrivals(newData);
    });
  }, []);

  return (
    <div>
      <Seo
        title="Nexora | Smart Gadgets. Smarter Living."
        description="Premium international smart gadgets with secure checkout and global shipping."
        jsonLd={{ "@context": "https://schema.org", "@type": "Organization", name: "Nexora", url: window.location.origin }}
      />
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Smart Gadgets. Smarter Living.</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal md:text-6xl">Nexora</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Premium connected products prepared for international selling, secure checkout and supplier workflows.
            </p>
            <Link
              to="/catalog"
              className="mt-8 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primaryDark"
            >
              Shop Now
            </Link>
          </div>
          <div className="aspect-[4/3] rounded-lg bg-white p-8 shadow-sm">
            <div className="h-full rounded-md border border-slate-200 bg-gradient-to-br from-white via-slate-100 to-blue-100" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Featured categories</h2>
            <p className="mt-2 text-sm text-slate-600">Browse the main Nexora collections.</p>
          </div>
          <Link to="/catalog" className="text-sm font-semibold text-primary">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.slice(0, 3).map((category) => (
            <Link key={category.id} to={`/category/${category.slug}`} className="rounded-lg border border-slate-200 p-5 shadow-sm hover:bg-mist">
              <h3 className="text-base font-semibold">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
      {bestSellers.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-semibold">Best sellers</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
      {newArrivals.length > 0 ? (
        <section className="bg-mist py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-2xl font-semibold">New arrivals</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {["International shipping", "Secure payments", "Supplier-ready orders"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 p-5 shadow-sm">
              <h2 className="text-base font-semibold">{item}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Phase 1 foundation connected to the backend catalog.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
