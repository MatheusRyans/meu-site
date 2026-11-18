"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const GLYPHS = "01{}<>/=;$#λ∑∂∇≈→⌘ƒπ⟨⟩[]()+*&|".split("");
const SOFT = "181,101,255";

/** Fundo: fluxos de código, símbolos digitais e rede de pontos que reage ao cursor. */
export function HoloBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let vw = 0;
    let vh = 0;
    let dpr = 1;
    const COL = 24;
    const LINE = 15;
    let cols: { x: number; y: number; sp: number; len: number; off: number }[] = [];
    let nodes: { x: number; y: number; vx: number; vy: number; ph: number }[] = [];
    let mx = -9999;
    let my = -9999;

    const dot = document.createElement("canvas");
    dot.width = dot.height = 32;
    {
      const g = dot.getContext("2d")!;
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, `rgba(${SOFT},1)`);
      gr.addColorStop(0.3, `rgba(${SOFT},0.4)`);
      gr.addColorStop(1, `rgba(${SOFT},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
    }

    const setup = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      const nc = Math.ceil(vw / COL);
      cols = Array.from({ length: nc }, (_, i) => ({
        x: i * COL + 6,
        y: Math.random() * vh,
        sp: 30 + Math.random() * 90,
        len: 6 + Math.floor(Math.random() * 14),
        off: Math.floor(Math.random() * 999),
      }));
      const nn = Math.round(Math.min(90, Math.max(28, (vw * vh) / 17000)));
      nodes = Array.from({ length: nn }, () => ({
        x: Math.random() * vw,
        y: Math.random() * vh,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        ph: Math.random() * 6.28,
      }));
    };
    setup();

    const draw = (t: number, dt: number, animate: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      const link = vw < 700 ? 100 : 150;

      /* chuva de código */
      ctx.font = `${LINE - 2}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textBaseline = "top";
      const tick = Math.floor(t * 3);
      for (let c = 0; c < cols.length; c++) {
        const col = cols[c];
        if (animate) {
          col.y += col.sp * dt;
          if (col.y - col.len * LINE > vh) {
            col.y = -Math.random() * 200;
            col.sp = 30 + Math.random() * 90;
          }
        }
        const centerFade = 0.3 + 0.7 * Math.min(1, Math.abs(col.x - vw / 2) / (vw * 0.34));
        const headRow = Math.floor(col.y / LINE);
        for (let k = 0; k < col.len; k++) {
          const row = headRow - k;
          const y = row * LINE;
          if (y < -LINE || y > vh) continue;
          const g = GLYPHS[(c * 7 + row * 13 + col.off + (k < 3 ? tick : 0)) % GLYPHS.length];
          if (k === 0) {
            ctx.fillStyle = `rgba(236,214,255,${0.55 * centerFade})`;
          } else {
            ctx.fillStyle = `rgba(${SOFT},${(1 - k / col.len) * 0.3 * centerFade})`;
          }
          ctx.fillText(g, col.x, y);
        }
      }

      /* rede de pontos interligados */
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (animate) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (n.x < -20 || n.x > vw + 20) n.vx *= -1;
          if (n.y < -20 || n.y > vh + 20) n.vy *= -1;
          const dx = mx - n.x;
          const dy = my - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 200 * 200 && d2 > 1) {
            const f = 0.35 * dt;
            n.x += dx * f * 0.08;
            n.y += dy * f * 0.08;
          }
        }
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = dx * dx + dy * dy;
          if (d < link * link) {
            const al = (1 - Math.sqrt(d) / link) * 0.32;
            ctx.strokeStyle = `rgba(${SOFT},${al})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const dxm = a.x - mx;
        const dym = a.y - my;
        const dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 190) {
          ctx.strokeStyle = `rgba(236,214,255,${(1 - dm / 190) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
        const s = 5 + 3 * Math.sin(t * 1.4 + a.ph);
        ctx.globalAlpha = 0.75;
        ctx.drawImage(dot, a.x - s, a.y - s, s * 2, s * 2);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    if (reduce) {
      draw(1, 0, false);
      const redraw = () => {
        setup();
        draw(1, 0, false);
      };
      window.addEventListener("resize", redraw);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", redraw);
      };
    }

    window.addEventListener("resize", setup);
    const t0 = performance.now();
    let last = t0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // ~30fps: o fundo não precisa de 60 e libera CPU para o holograma/galeria
      if (now - last < 32) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      draw((now - t0) / 1000, dt, true);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", setup);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0" />;
}
