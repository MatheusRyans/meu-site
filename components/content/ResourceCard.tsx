import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ContentEntry } from "@/lib/content";
import { Tag } from "@/components/ui/Tag";

export function ResourceCard({ entry }: { entry: ContentEntry }) {
  const href = entry.type === "blog" ? `/blog/${entry.slug}` : `/recursos/${entry.slug}`;

  return (
    <article className={`resource-card ${entry.featured ? "featured" : ""}`}>
      <div className="card-topline">
        <span className="card-type">{entry.type}</span>
        {entry.featured ? <span className="featured-badge">Em destaque</span> : <time>{formatDate(entry.publishedAt)}</time>}
      </div>

      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>

      <div className="tags-row">
        {entry.tags.slice(0, 3).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <Link href={href} className="read-more">
        Ler mais
      </Link>
    </article>
  );
}
