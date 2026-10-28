"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

function getMascotState(pathname: string) {
  if (pathname.startsWith("/sobre")) {
    return {
      label: "Modo história",
      text: "Conheça minha trajetória e os bastidores da curadoria.",
      mood: "is-story",
    };
  }

  if (pathname.startsWith("/blog")) {
    return {
      label: "Modo leitura",
      text: "Dica: abra um artigo e salve os pontos-chave.",
      mood: "is-reading",
    };
  }

  if (pathname.startsWith("/recursos")) {
    return {
      label: "Modo descoberta",
      text: "Filtre por tema e monte sua próxima trilha.",
      mood: "is-searching",
    };
  }

  if (pathname.startsWith("/admin")) {
    return {
      label: "Modo operação",
      text: "Tudo pronto para publicar seu próximo conteúdo.",
      mood: "is-admin",
    };
  }

  return {
    label: "Modo guia",
    text: "Explore artigos, recursos e categorias no seu ritmo.",
    mood: "is-guide",
  };
}

export function MascotRobot() {
  const pathname = usePathname();
  const state = useMemo(() => getMascotState(pathname), [pathname]);

  return (
    <aside className={`mascot-shell ${state.mood}`} aria-label="Mascote do site">
      <p className="mascot-label">{state.label}</p>
      <div className="mascot-body" aria-hidden="true">
        <div className="mascot-head">
          <span className="mascot-eye" />
          <span className="mascot-eye" />
        </div>
        <div className="mascot-core" />
      </div>
      <p className="mascot-text">{state.text}</p>
    </aside>
  );
}
