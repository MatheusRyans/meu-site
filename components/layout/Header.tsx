import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          Matheus<span className="brand-light">Ryans</span>
        </Link>

        <nav className="nav" aria-label="Menu principal">
          <Link href="/">Início</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/recursos">Recursos</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
        </nav>
      </div>
    </header>
  );
}
