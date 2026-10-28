import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { getAllContent, getContentBySlug } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  return getAllContent()
    .filter((entry) => entry.type === "blog")
    .map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContentBySlug(slug);

  if (!entry) {
    return {
      title: "Artigo não encontrado",
    };
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getContentBySlug(slug);

  if (!entry) {
    notFound();
  }

  return (
    <div className="container page-content">
      <article>
        <header>
          <div className="meta-row">
            <span className="meta-pill">{entry.category}</span>
            <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
          </div>
          <h1>{entry.title}</h1>
        </header>

        <MDXRemote source={entry.body} />
      </article>
    </div>
  );
}
