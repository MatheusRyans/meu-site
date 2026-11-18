"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { projects, type Project } from "@/content/site";
import {
  ART_ASPECT,
  PlaceholderArt,
  mulberry32,
  type ArtKind,
} from "./PlaceholderArt";

/* -------------------------------------------------------------------------
 * Galeria infinita arrastável com profundidade (DOM, sem WebGL).
 *
 * Performance (60fps):
 *  - o loop imperativo só ESCREVE transforms; dimensões da viewport ficam em
 *    cache (ResizeObserver) — nunca lê layout durante o frame;
 *  - cada card é React.memo: chunks novos não re-renderizam os existentes;
 *  - sem filter:blur nem sombras grandes por card (profundidade = opacidade);
 *  - durante o arraste os cards ficam com pointer-events:none (sem hit-test
 *    nem repaint de hover);
 *  - frames ociosos (nada se moveu) não tocam no DOM.
 * ----------------------------------------------------------------------- */

const CHUNK_W = 1300;
const CHUNK_H = 950;
const MARGIN = 220;
// "shot" = print real de um projeto; os demais são arte placeholder gerada por código.
const KINDS: ArtKind[] = ["shot", "phone", "shot", "poster", "note", "shot", "poster", "phone"];
const DRAG_THRESHOLD = 6;

type Layer = {
  id: number;
  p: number; // fator de parallax (1 = acompanha o ponteiro 1:1)
  count: number;
  min: number;
  max: number;
  opacity: number;
  shadow: boolean;
};

const LAYERS: Layer[] = [
  { id: 0, p: 0.45, count: 11, min: 70, max: 120, opacity: 0.42, shadow: false },
  { id: 1, p: 0.72, count: 8, min: 110, max: 180, opacity: 0.75, shadow: true },
  { id: 2, p: 1, count: 4, min: 190, max: 300, opacity: 1, shadow: true },
];

type Card = {
  key: string;
  layer: Layer;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ArtKind;
  seed: number;
  project: number;
  /** Print do projeto (só para kind "shot"). */
  shot?: Project["image"];
  delay: number; // atraso da entrada (só na carga inicial)
};

function hash(a: number, b: number, c: number) {
  return (
    (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0
  );
}

function makeChunk(layer: Layer, cx: number, cy: number, intro: boolean): Card[] {
  const r = mulberry32(hash(cx, cy, layer.id + 1));
  return Array.from({ length: layer.count }, (_, i) => {
    const kind = KINDS[Math.floor(r() * KINDS.length)];
    const project = Math.floor(r() * projects.length);
    const shot = kind === "shot" ? projects[project].image : undefined;
    const aspect = shot ? shot.w / shot.h : ART_ASPECT[kind];
    const w = layer.min + r() * (layer.max - layer.min);
    return {
      key: `${layer.id}:${cx}:${cy}:${i}`,
      layer,
      x: cx * CHUNK_W + r() * CHUNK_W,
      y: cy * CHUNK_H + r() * CHUNK_H,
      w,
      h: w / aspect,
      kind,
      seed: Math.floor(r() * 1e6),
      project,
      shot,
      delay: intro ? Math.min((i + layer.id * 3) * 0.045, 0.9) : 0,
    };
  });
}

type Motion = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
  vx: number;
  vy: number;
  moved: number;
};

type Register = (card: Card, el: HTMLDivElement | null) => void;

const GalleryCard = memo(function GalleryCard({
  card,
  k,
  register,
  movedRef,
}: {
  card: Card;
  k: number;
  register: Register;
  movedRef: React.RefObject<Motion>;
}) {
  const project = projects[card.project];
  const ref = useCallback((el: HTMLDivElement | null) => register(card, el), [card, register]);
  return (
    <div
      ref={ref}
      data-card
      className="absolute left-0 top-0 will-change-transform"
      style={{ width: card.w * k, height: card.h * k, zIndex: card.layer.id * 10 }}
    >
      <Link
        href={`/projetos/${project.slug}`}
        draggable={false}
        aria-label={`Abrir ${project.navLabel}`}
        onClick={(e) => {
          if (movedRef.current.moved > DRAG_THRESHOLD) e.preventDefault();
        }}
        className="group relative block h-full w-full select-none outline-none"
      >
        <div
          className={`gallery-art h-full w-full ${card.layer.shadow ? "shadow-[0_8px_16px_-10px_rgba(140,0,242,0.35)]" : ""}`}
          style={
            {
              "--o": card.layer.opacity,
              animationDelay: `${card.delay}s`,
            } as React.CSSProperties
          }
        >
          {card.shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.shot.src}
              alt=""
              width={card.shot.w}
              height={card.shot.h}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-full w-full rounded-[4px] border border-violet/30 object-cover"
            />
          ) : (
            <PlaceholderArt kind={card.kind} seed={card.seed} />
          )}
        </div>
        <span className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap font-sans text-[10px] uppercase tracking-[0.14em] text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {project.navLabel}
        </span>
      </Link>
    </div>
  );
});

export function GalleryCanvas({ onFirstInteraction }: { onFirstInteraction?: () => void }) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, { el: HTMLDivElement; card: Card }>());
  const chunkCache = useRef(new Map<string, Card[]>());
  const signature = useRef("");
  const interacted = useRef(false);
  const intro = useRef(true);
  const view = useRef({ w: 0, h: 0, k: 1 });
  const s = useRef<Motion>({
    x: 0, y: 0, tx: 0, ty: 0, dragging: false, lastX: 0, lastY: 0, vx: 0, vy: 0, moved: 0,
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [k, setK] = useState(1);

  /* Cache das dimensões (nada de leitura de layout dentro do frame) */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const kk = window.innerWidth < 640 ? 0.6 : 1;
      view.current = { w: root.clientWidth, h: root.clientHeight, k: kk };
      signature.current = ""; // força recálculo dos chunks
      setK(kk);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    const t = setTimeout(() => (intro.current = false), 1800);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const register = useCallback<Register>((card, el) => {
    if (el) nodes.current.set(card.key, { el, card });
    else nodes.current.delete(card.key);
    if (el) {
      const v = view.current;
      const { x, y } = s.current;
      const px = card.x - x * card.layer.p + v.w / 2 - (card.w * v.k) / 2;
      const py = card.y - y * card.layer.p + v.h / 2 - (card.h * v.k) / 2;
      el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    }
  }, []);

  const syncChunks = useCallback(() => {
    const { w: vw, h: vh } = view.current;
    if (!vw) return;
    const { x, y } = s.current;
    const parts: string[] = [];
    for (const layer of LAYERS) {
      const lx = x * layer.p;
      const ly = y * layer.p;
      const x0 = Math.floor((lx - vw / 2 - MARGIN) / CHUNK_W);
      const x1 = Math.floor((lx + vw / 2 + MARGIN) / CHUNK_W);
      const y0 = Math.floor((ly - vh / 2 - MARGIN) / CHUNK_H);
      const y1 = Math.floor((ly + vh / 2 + MARGIN) / CHUNK_H);
      parts.push(`${layer.id}:${x0},${x1},${y0},${y1}`);
    }
    const sig = parts.join("|");
    if (sig === signature.current) return;
    signature.current = sig;

    const list: Card[] = [];
    for (const part of parts) {
      const [id, range] = part.split(":");
      const [x0, x1, y0, y1] = range.split(",").map(Number);
      const layer = LAYERS[Number(id)];
      for (let cx = x0; cx <= x1; cx++)
        for (let cy = y0; cy <= y1; cy++) {
          const key = `${id}:${cx}:${cy}`;
          let chunk = chunkCache.current.get(key);
          if (!chunk) {
            chunk = makeChunk(layer, cx, cy, intro.current);
            chunkCache.current.set(key, chunk);
          }
          list.push(...chunk);
        }
    }
    setCards(list);
  }, []);

  /* Loop: amortecimento independente do FPS + escrita de transforms */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let px = NaN;
    let py = NaN;
    let kPrev = 0;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const m = s.current;
      const f = reduce ? 1 : 1 - Math.exp(-dt / 95); // ≈ lerp 0.1 a 60fps
      m.x += (m.tx - m.x) * f;
      m.y += (m.ty - m.y) * f;
      if (Math.abs(m.tx - m.x) < 0.05) m.x = m.tx;
      if (Math.abs(m.ty - m.y) < 0.05) m.y = m.ty;

      const v = view.current;
      if (m.x !== px || m.y !== py || v.k !== kPrev) {
        px = m.x;
        py = m.y;
        kPrev = v.k;
        syncChunks();
        const hw = v.w / 2;
        const hh = v.h / 2;
        nodes.current.forEach(({ el, card }) => {
          const p = card.layer.p;
          const cx = card.x - m.x * p + hw - (card.w * v.k) / 2;
          const cy = card.y - m.y * p + hh - (card.h * v.k) / 2;
          el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, syncChunks]);

  /* Ponteiro (mouse + touch), roda e teclado */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const markInteracted = () => {
      if (!interacted.current) {
        interacted.current = true;
        onFirstInteraction?.();
      }
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const m = s.current;
      m.dragging = true;
      m.lastX = e.clientX;
      m.lastY = e.clientY;
      m.vx = m.vy = 0;
      m.moved = 0;
    };
    const move = (e: PointerEvent) => {
      const m = s.current;
      if (!m.dragging) return;
      const dx = e.clientX - m.lastX;
      const dy = e.clientY - m.lastY;
      m.lastX = e.clientX;
      m.lastY = e.clientY;
      m.moved += Math.abs(dx) + Math.abs(dy);
      m.vx = m.vx * 0.6 + dx * 0.4;
      m.vy = m.vy * 0.6 + dy * 0.4;
      m.tx -= dx;
      m.ty -= dy;
      if (m.moved > DRAG_THRESHOLD) {
        // cursor + pointer-events:none nos cards (CSS). Só escreve UMA vez:
        // reescrever o atributo a cada move invalida o estilo dos ~90 cards.
        if (!root.hasAttribute("data-dragging")) root.setAttribute("data-dragging", "1");
        markInteracted();
      }
    };
    const up = () => {
      const m = s.current;
      if (!m.dragging) return;
      m.dragging = false;
      // mantém o atributo até o "click" passar (evita abrir projeto ao soltar)
      setTimeout(() => root.removeAttribute("data-dragging"), 0);
      if (!reduce) {
        m.tx -= m.vx * 9;
        m.ty -= m.vy * 9;
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      s.current.tx += e.deltaX;
      s.current.ty += e.deltaY;
      markInteracted();
    };
    const key = (e: KeyboardEvent) => {
      const step = 220;
      const m = s.current;
      if (e.key === "ArrowLeft") m.tx -= step;
      else if (e.key === "ArrowRight") m.tx += step;
      else if (e.key === "ArrowUp") m.ty -= step;
      else if (e.key === "ArrowDown") m.ty += step;
      else return;
      markInteracted();
    };

    root.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    root.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      root.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      root.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
    };
  }, [onFirstInteraction, reduce]);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label="Galeria de projetos — arraste, role ou use as setas do teclado"
      className="gallery-root absolute inset-0 touch-none overflow-hidden"
    >
      {cards.map((card) => (
        <GalleryCard
          key={card.key}
          card={card}
          k={k}
          register={register}
          movedRef={s}
        />
      ))}
    </div>
  );
}
