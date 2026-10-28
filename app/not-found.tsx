import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page-section">
      <section className="section-block" style={{ textAlign: "center" }}>
        <h1>Conteúdo não encontrado</h1>
        <p>O item que você procura não está disponível no momento.</p>
        <Link href="/" className="primary-button" style={{ marginTop: "24px" }}>
          Voltar para o início
        </Link>
      </section>
    </div>
  );
}
