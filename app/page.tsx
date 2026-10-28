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
      <section className="hero-editorial">
        <aside className="hero-meta-left">
          <p>Baseado em São Paulo, Brasil</p>
          <p>Curadoria para devs em evolução constante</p>
        </aside>

        <div className="hero-center-stage">
          <div className="hero-title-block">
            <p className="hero-name-kicker">Matheus</p>
            <h1>Ryans</h1>
          </div>

          <div className="hero-avatar-shell" aria-hidden="true">
            <div className="hero-avatar-dot" />
            <div className="hero-avatar-figure">
              <span />
            </div>
          </div>

          <div className="hero-role-block">
            <p>
              <strong>Curador técnico</strong>
            </p>
            <p>Organizando referências práticas para quem quer aprender com clareza.</p>
            <div className="cta-row">
              <Link href="/blog" className="primary-button">
                Ler artigos
              </Link>
              <Link href="/recursos" className="secondary-button">
                Explorar recursos
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-bottom-strip" aria-label="Últimas publicações">
          {recent.map((entry) => (
            <Link key={entry.slug} href={entry.type === "blog" ? `/blog/${entry.slug}` : `/recursos/${entry.slug}`}>
              {entry.title}
            </Link>
          ))}
        </div>
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
