import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container page-section about-page">
      <section className="about-hero">
        <p className="about-mini-line">uma presença em movimento • atualizado em tempo real</p>
        <div className="about-hero-grid">
          <article className="about-hero-copy">
            <p className="about-eyebrow">manifesto pessoal</p>
            <h1>Construindo clareza para aprender tecnologia sem ruído.</h1>
            <p>
              Sou Matheus Ryans. Este espaço organiza aquilo que realmente acelera evolução: boas referências, bons
              fundamentos e decisões de aprendizado com contexto.
            </p>
            <p>
              Aqui você encontra curadoria viva de artigos, vídeos, documentação e projetos de código aberto para estudar
              com direção e consistência.
            </p>
            <div className="cta-row">
              <Link href="/recursos" className="primary-button">
                Explorar curadoria
              </Link>
              <Link href="/contato" className="secondary-button">
                Falar comigo
              </Link>
            </div>
          </article>

          <aside className="about-hero-robot" aria-hidden="true">
            <div className="about-robot-head">
              <span />
              <span />
            </div>
            <div className="about-robot-body" />
          </aside>
        </div>
      </section>

      <section className="section-block about-content-grid">
        <article className="about-content-card">
          <h2>O que você encontra aqui</h2>
          <ul>
            <li>artigos sobre desenvolvimento, arquitetura e pensamento técnico</li>
            <li>recursos em vídeo, documentação e plataformas úteis</li>
            <li>curadoria de referências que fazem diferença na prática</li>
            <li>aprendizado orientado por qualidade, não por hype</li>
          </ul>
        </article>

        <article className="about-content-card">
          <h2>Minha abordagem</h2>
          <p>
            Prefiro um caminho com foco, contexto e profundidade. Não acredito em aprender tudo ao mesmo tempo. Acredito
            em construir bases sólidas, entender cada conceito com clareza e aplicar o conhecimento em projetos reais.
          </p>
          <p>
            Se você também gosta de aprender com intenção e gosta de bons materiais, esse espaço foi feito para ser um
            ponto de apoio constante na sua jornada.
          </p>
          <Link href="/" className="link-plain">
            Voltar para o início
          </Link>
        </article>
      </section>
    </div>
  );
}
