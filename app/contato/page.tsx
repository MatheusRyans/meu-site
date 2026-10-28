import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container page-section">
      <section className="section-block page-content">
        <article>
          <header>
            <h1>Vamos conversar</h1>
          </header>

          <p>
            Se você quiser trocar ideias sobre tecnologia, desenvolvimento, artigos, recursos ou oportunidades de colaboração,
            fique à vontade para entrar em contato.
          </p>

          <div className="contact-grid">
            <div className="contact-item">
              <span className="contact-label">E-mail</span>
              <a href="mailto:matheus@example.com">matheus@example.com</a>
            </div>

            <div className="contact-item">
              <span className="contact-label">GitHub</span>
              <a href="https://github.com/MatheusRyans" target="_blank" rel="noreferrer">
                github.com/MatheusRyans
              </a>
            </div>

            <div className="contact-item">
              <span className="contact-label">LinkedIn</span>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                linkedin.com/in/matheus-ryans
              </a>
            </div>
          </div>

          <div className="cta-row">
            <Link href="/" className="primary-button">
              Voltar para o início
            </Link>
            <Link href="/sobre" className="secondary-button">
              Ler sobre mim
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
