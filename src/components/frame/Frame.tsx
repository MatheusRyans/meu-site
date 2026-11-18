"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site, projects } from "@/content/site";
import { cn, resolveHref } from "@/lib/utils";

/**
 * Moldura fixa do site (header + dica inferior).
 * `mix-blend-difference` com texto branco faz o texto inverter
 * automaticamente: preto em fundos claros, branco em fundos escuros.
 */
export function Frame() {
  const pathname = usePathname();
  // O perfil técnico tem o próprio cabeçalho de terminal.
  if (pathname.startsWith("/perfil-tecnico")) return null;

  const isHome = pathname === "/";

  const linkClass = (active: boolean) =>
    cn(
      "pointer-events-auto font-sans text-xs font-normal uppercase tracking-[0.08em] text-white underline-offset-[5px] transition-opacity hover:opacity-60 sm:text-[15.6px]",
      active && "underline decoration-1",
    );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-4 p-[18px] mix-blend-difference">
        <a
          href={resolveHref(site.linkedin)}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto font-display text-[17px] uppercase leading-none text-white sm:text-[20.4px]"
        >
          LinkedIn
        </a>

        <nav
          aria-label="Navegação principal"
          className="flex flex-wrap justify-end gap-x-2.5 gap-y-1 sm:gap-x-[9px]"
        >
          <Link href="/" className={linkClass(isHome)}>
            Home
          </Link>
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projetos/${p.slug}`}
              className={linkClass(pathname === `/projetos/${p.slug}`)}
            >
              {p.navLabel}
            </Link>
          ))}
        </nav>
      </header>

      {isHome && (
        <div className="pointer-events-none fixed bottom-5 left-[14px] z-50 mix-blend-difference">
          <Link
            href="/perfil-tecnico"
            className="pointer-events-auto font-sans text-[15px] font-medium uppercase tracking-[0.01em] text-white transition-opacity hover:opacity-60 sm:text-[17px]"
          >
            {site.hintPerfilTecnico}
          </Link>
        </div>
      )}
    </>
  );
}
