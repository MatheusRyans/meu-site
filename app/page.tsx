import Link from "next/link";
import { ResourceCard } from "@/components/content/ResourceCard";
import { getCategories, getFeaturedContent, getRecentContent } from "@/lib/content";

const focusAreas = [
  {
    label: "Frontend",
    description: "React, Next.js, interfaces e performance.",
    href: "/categorias/frontend",
  },
  {
    label: "Arquitetura",
    description: "Pensamento de software e organização do código.",
    href: "/categorias/arquitetura",
  },
  {
    label: "Carreira",
    description: "Estudo, decisões e evolução profissional.",
    href: "/categorias/carreira",
  },
  {
    label: "Recursos",
    description: "Ferramentas, referências e materiais úteis.",
    href: "/recursos",
  },
];

export default function HomePage() {
  const featured = getFeaturedContent();
  const recent = getRecentContent(4);
  const categories = getCategories();

  return (
    <div className="container home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <h1>Um mapa prático para aprender tecnologia com foco.</h1>
          <p className="lead">
            Reúno artigos, vídeos, plataformas e projetos que valem a pena seguir para construir uma base sólida em desenvolvimento e produto digital.
          </p>

          <div className="hero-stats" aria-label="Resumo do site">
            <div>
              <strong>+80</strong>
              <span>recursos</span>
            </div>
            <div>
              <strong>4</strong>
              <span>áreas</span>
            </div>
            <div>
              <strong>1</strong>
              <span>curadoria</span>
            </div>
          </div>

          <div className="cta-row">
            <Link href="/blog" className="primary-button">
              Ler artigos
            </Link>
            <Link href="/recursos" className="secondary-button">
              Explorar recursos
            </Link>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Mapa do conteúdo">
          <p className="panel-label">O que você encontra aqui</p>
          <ul className="panel-list">
            {focusAreas.map((area) => (
              <li key={area.label}>
                <strong>{area.label}</strong>
                <span>{area.description}</span>
              </li>
            ))}
          </ul>
          <Link href="/recursos" className="panel-link">
            Ver recursos completos
          </Link>
        </aside>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Trilhas de estudo</h2>
          <Link href="/recursos" className="link-plain">
            Ver catálogo
          </Link>
        </div>

        <div className="curation-grid">
          {focusAreas.map((area) => (
            <Link key={area.label} href={area.href} className="track-card">
              <span className="track-kicker">Área</span>
              <h3>{area.label}</h3>
              <p>{area.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Em destaque</h2>
        </div>

        <div className="resource-grid">
          {featured.map((entry) => (
            <ResourceCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Temas</h2>
        </div>

        <div className="tag-cloud">
          {categories.map((category) => (
            <Link key={category} href={`/categorias/${category}`} className="category-pill">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Atualizações recentes</h2>
          <Link href="/blog" className="link-plain">
            Ver todos
          </Link>
        </div>

        <div className="list-stack">
          {recent.map((entry) => (
            <article key={entry.slug} className="list-item">
              <div>
                <span className="item-type">{entry.type}</span>
                <h3>{entry.title}</h3>
              </div>
              <p>{entry.summary}</p>
              <Link href={entry.type === "blog" ? `/blog/${entry.slug}` : `/recursos/${entry.slug}`}>
                Ler conteúdo
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
