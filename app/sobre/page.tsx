import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container page-section">
      <section className="section-block page-content">
        <article>
          <header>
            <h1>Quem sou eu</h1>
          </header>

          <p>
            Sou Matheus Ryans, um desenvolvedor e entusiasta de tecnologia com foco em construir produtos com clareza,
            bons fundamentos e uma abordagem prática para aprender e ensinar.
          </p>

          <p>
            Este site nasceu como uma forma de organizar o que considero valioso: conteúdos, referências, vídeos,
            ferramentas, comunidades e projetos que ajudam pessoas a evoluir na área de tecnologia sem perder tempo em
            informação dispersa.
          </p>

          <p>
            A ideia central aqui é simples: reunir conhecimento útil, compartilhar recomendações com critério e ajudar
            outras pessoas a ter uma visão mais clara do que aprender, em que ordem e por quê.
          </p>

          <h2>O que você vai encontrar aqui</h2>
          <ul>
            <li>artigos sobre desenvolvimento, arquitetura e pensamento técnico</li>
            <li>recursos em vídeo, documentação e plataformas úteis</li>
            <li>curadoria de referências que fazem diferença na prática</li>
            <li>aprendizado orientado por qualidade, não por hype</li>
          </ul>

          <h2>Minha abordagem</h2>
          <p>
            Prefiro um caminho com foco, contexto e profundidade. Não acredito em aprender tudo ao mesmo tempo. Acredito
            em construir bases sólidas, entender cada conceito com clareza e aplicar o conhecimento em projetos reais.
          </p>

          <p>
            Se você também gosta de aprender com intenção e gosta de bons materiais, esse espaço pode ser um bom ponto de
            partida para acompanhar ideias, referências e caminhos úteis.
          </p>

          <div className="cta-row">
            <Link href="/" className="primary-button">
              Voltar para o início
            </Link>
            <Link href="/contato" className="secondary-button">
              Falar comigo
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
