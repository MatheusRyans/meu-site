import Link from "next/link";
import { ResourceCard } from "@/components/content/ResourceCard";
import { getContentByType } from "@/lib/content";

export default function BlogPage() {
  const posts = getContentByType("blog");

  return (
    <div className="container page-section">
      <section className="section-block">
        <div className="section-header">
          <h1>Blog</h1>
          <Link href="/" className="link-plain">
            Voltar ao início
          </Link>
        </div>

        <div className="resource-grid">
          {posts.map((entry) => (
            <ResourceCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
