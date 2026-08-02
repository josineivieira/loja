import { PageTitle } from "./AdminProductsPage";

export function AdminPlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageTitle title={title} />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-6 text-slate-600">
          This module is reserved in the administrative information architecture and will be expanded in later phases.
        </p>
      </section>
    </div>
  );
}

