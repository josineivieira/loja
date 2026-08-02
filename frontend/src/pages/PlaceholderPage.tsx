import { useParams } from "react-router-dom";

export function PlaceholderPage({ title }: { title: string }) {
  const params = useParams();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        This page is reserved in the routing structure and will be completed in the next phases.
      </p>
      {params.slug ? <p className="mt-4 text-sm text-slate-500">Slug: {params.slug}</p> : null}
    </section>
  );
}

