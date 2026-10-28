import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceCard } from "@/components/content/ResourceCard";
import { getCategories, getCategoryItems } from "@/lib/content";

export async function generateStaticParams() {
  return getCategories().map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const items = getCategoryItems(decodeURIComponent(category));

  if (!items.length) {
    notFound();
  }

  return (
    <div className="container page-section">
      <section className="section-block">
        <div className="section-header">
          <h1>{decodeURIComponent(category)}</h1>
          <Link href="/" className="link-plain">
            Voltar ao início
          </Link>
        </div>

        <div className="resource-grid">
          {items.map((entry) => (
            <ResourceCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
