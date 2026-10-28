import Link from "next/link";
import { ResourceCard } from "@/components/content/ResourceCard";
import { getAllContent } from "@/lib/content";

export default function RecursosPage() {
  const recursos = getAllContent().filter((entry) => entry.type !== "blog");

  return (
    <div className="container page-section">
      <section className="section-block">
        <div className="section-header">
          <h1>Recursos</h1>
          <Link href="/" className="link-plain">
            Voltar ao início
          </Link>
        </div>

        <div className="resource-grid">
          {recursos.map((entry) => (
            <ResourceCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
