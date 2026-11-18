"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";

/**
 * Scroll suave (Lenis) nas páginas que rolam: case study e perfil técnico.
 * A home é uma galeria fixa com arraste próprio, então não usa Lenis.
 * Áreas com `data-lenis-prevent` (ex.: scroll interno do terminal) mantêm o
 * scroll nativo.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const enabled = pathname !== "/" && !reduce;

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true });
    return () => lenis.destroy();
  }, [enabled]);

  return null;
}
