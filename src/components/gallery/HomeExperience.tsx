"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { site } from "@/content/site";
import { EASE_REVEAL } from "@/lib/utils";
import { GalleryCanvas } from "./GalleryCanvas";
import { AIHologram } from "@/components/hologram/AIHologram";
import { HoloBackground } from "@/components/hologram/HoloBackground";

// Mostra o loader só na primeira visita da sessão (como o original).
let hasLoaded = false;

function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          aria-hidden
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black text-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE_REVEAL }}
        >
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-8 items-center gap-1.5 text-gold">
              <span className="loader-box" />
              <span className="loader-box" />
              <span className="loader-box" />
            </div>
            <p className="font-display text-sm uppercase tracking-[0.2em]">{site.nome}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Indicador "‹ ──●── ›" com o ponto oscilando; some após o 1º arraste. */
function DragCue({ hidden }: { hidden: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      className="mt-4 flex justify-center text-ink"
    >
      <div className="relative h-6 w-[120px]">
        <ArrowLeft className="absolute left-[2px] top-1/2 size-3 -translate-y-1/2 opacity-35" strokeWidth={1} />
        <span className="absolute left-5 right-5 top-1/2 h-px bg-current opacity-30" />
        <ArrowRight className="absolute right-[2px] top-1/2 size-3 -translate-y-1/2 opacity-30" strokeWidth={1} />
        <motion.span
          className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] size-[7px] rounded-full border border-current"
          animate={reduce ? undefined : { x: [0, 22, -22, 0] }}
          transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

export function HomeExperience() {
  const [loading, setLoading] = useState(!hasLoaded);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      hasLoaded = true;
      setLoading(false);
    }, 1400);
    return () => clearTimeout(t);
  }, [loading]);

  const onFirst = useCallback(() => setInteracted(true), []);

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-black text-ink"
      style={{ "--S": "min(50vh, 43vw)" } as React.CSSProperties}
    >
      <LoadingOverlay visible={loading} />

      {/* névoa violeta ambiente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_44%,rgba(140,0,242,0.28),transparent_70%)]"
      />
      <HoloBackground />

      {/* galeria arrastável (cards atravessam o holograma, como vidro) */}
      <div className="absolute inset-0 z-10">
        <GalleryCanvas onFirstInteraction={onFirst} />
      </div>

      {/* vinheta central: mantém o holograma legível sobre os cards */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(ellipse_32%_46%_at_50%_44%,rgba(0,0,0,0.78),rgba(0,0,0,0.35)_60%,transparent_100%)]"
      />

      {/* cápsula de vidro atrás da IA */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: loading ? 0 : 1, scale: loading ? 0.94 : 1 }}
        transition={{ duration: 1.2, ease: EASE_REVEAL }}
        className="holo-glass pointer-events-none absolute left-1/2 z-[16] rounded-[999px] [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
        style={{
          width: "calc(var(--S) * 1.2)",
          height: "calc(var(--S) * 1.75)",
          top: "calc(47vh - var(--S) * 0.85)",
          transform: "translateX(-50%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 1.4, ease: EASE_REVEAL, delay: loading ? 0 : 0.1 }}
        className="pointer-events-none absolute inset-0 z-20"
      >
        <AIHologram />
      </motion.div>

      {/* título */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-6 pb-[6.5vh] text-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 18 : 0 }}
          transition={{ duration: 0.9, ease: EASE_REVEAL, delay: loading ? 0 : 0.15 }}
          className="text-glow font-display text-[clamp(1.75rem,5vw,2.75rem)] font-medium uppercase leading-none tracking-[0.12em]"
        >
          {site.nome}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.9, delay: loading ? 0 : 0.4 }}
          className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.28em] text-gold sm:text-xs"
        >
          {site.dragHint}
        </motion.p>
        <DragCue hidden={interacted} />
      </div>
    </main>
  );
}
