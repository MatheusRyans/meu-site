"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* ==========================================================================
   Holograma de IA — cabeça humana parcialmente materializada.
   Canvas 2D + projeção 3D própria (sem WebGL, sem libs).

   • Rosto procedural com relevo anatômico (heightfield) e normais por ponto
     → iluminação real (luz principal + rim light + fresnel) nas partículas.
   • ~70% da superfície formada (malha wireframe); ~30% se dissolve em
     partículas que entram e saem da estrutura.
   • Olhos com pálpebras, íris luminosa recortada (clip) e olhar que segue o cursor.
   • Clique: pulso holográfico + dispersão temporária das partículas.
   • Bloom controlado por down/upsample (sem ctx.filter → funciona no Safari).
   ========================================================================== */

// Paleta: azul elétrico #00D4FF · ciano neon #00FFF5 · roxo #8B5CF6 · branco
const VIOLET = "139,92,246";
const SOFT = "0,212,255";
const HOT = "214,255,253";
const NEON = "0,255,245";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------- modelo --------------------------------- */

const P_HEAD = 0;
const P_BODY = 1;
const P_LID = 7;
const P_EYE = 8;
const P_CORE = 9;

type Tube = { rings: number[][]; fill: [number, number] };
type Eye = { c: number; up: number[]; lo: number[] };
type Model = {
  n: number;
  X: Float32Array;
  Y: Float32Array;
  Z: Float32Array;
  NX: Float32Array;
  NY: Float32Array;
  NZ: Float32Array;
  PART: Uint8Array;
  BASE: Float32Array;
  FADE: Float32Array;
  PHASE: Float32Array;
  FLOW: Uint8Array;
  FL: Float32Array; // distância do fluxo
  SPD: Float32Array;
  DX: Float32Array;
  DY: Float32Array;
  DZ: Float32Array;
  ROW: Uint16Array;
  COL: Uint16Array;
  LIDW: Float32Array;
  EYED: Float32Array; // distância ao olho mais próximo
  D: Float32Array; // distância ao núcleo
  tubes: Tube[];
  edges: Uint32Array;
  loops: number[][]; // polilinhas (orelhas)
  neural: { a: number; b: number; ph: number; sp: number }[];
  core: number;
  eyes: Eye[];
};

const g2 = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) =>
  Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));

/** Relevo facial (deslocamento em z). Simétrico em x. Coordenadas já deslocadas por RELIEF_SHIFT. */
function faceRelief(x: number, y: number) {
  const ax = Math.abs(x);
  let d = 0;
  d += 0.032 * g2(x, y, 0, 0.3, 0.17, 0.13); // testa
  d += 0.042 * g2(ax, y, 0.075, 0.178, 0.1, 0.022); // arcada superciliar
  d -= 0.05 * g2(ax, y, 0.108, 0.115, 0.05, 0.028); // cavidade orbital
  d += 0.028 * g2(ax, y, 0.108, 0.115, 0.085, 0.05); // aro orbital
  d += 0.022 * g2(ax, y, 0.108, 0.115, 0.036, 0.02); // globo ocular
  // nariz
  d += 0.085 * g2(x, y, 0, 0.04, 0.022, 0.1) * smooth(0.14, 0.0, y - 0.02);
  d += 0.082 * g2(x, y, 0, -0.065, 0.03, 0.026); // ponta
  d += 0.04 * g2(ax, y, 0.052, -0.066, 0.022, 0.02); // asas
  d -= 0.03 * g2(ax, y, 0.027, -0.097, 0.012, 0.01); // narinas
  d += 0.02 * g2(x, y, 0, -0.103, 0.012, 0.015); // columela
  d -= 0.012 * g2(x, y, 0, -0.135, 0.01, 0.024); // filtro
  // boca
  d += 0.03 * g2(x, y, 0, -0.165, 0.06, 0.013);
  d += 0.04 * g2(x, y, 0, -0.205, 0.055, 0.017);
  d -= 0.026 * g2(x, y, 0, -0.186, 0.07, 0.004);
  d -= 0.012 * g2(ax, y, 0.075, -0.186, 0.012, 0.012);
  // sulcos, bochechas, queixo, têmporas
  d -= 0.014 * g2(ax, y, 0.08, -0.115, 0.012, 0.05);
  d += 0.03 * g2(ax, y, 0.16, -0.035, 0.07, 0.07);
  d -= 0.015 * g2(ax, y, 0.14, -0.15, 0.055, 0.05);
  d += 0.04 * g2(x, y, 0, -0.285, 0.055, 0.035);
  d -= 0.014 * g2(x, y, 0, -0.238, 0.05, 0.01);
  d -= 0.02 * g2(ax, y, 0.24, 0.2, 0.05, 0.1);
  return d;
}

const Y_TOP = 0.42;
const Y_CHIN = -0.38;
const EYE_Y = 0.06;
const EYE_X = 0.108;
const RELIEF_SHIFT = 0.055;
const GAIN = 1.5;

function headHalfWidth(y: number) {
  const s = clamp((Y_TOP - y) / (Y_TOP - Y_CHIN), 0, 1);
  if (s < 0.55) return 0.3 * Math.pow(Math.max(0, 1 - Math.abs((s - 0.55) / 0.55) ** 2.6), 1 / 2.6);
  return 0.3 * (1 - 0.66 * Math.pow((s - 0.55) / 0.45, 1.5));
}

function headPoint(y: number, a: number): [number, number, number] {
  const w = headHalfWidth(y);
  const x = Math.cos(a) * w;
  let z = Math.sin(a) * w * 0.92;
  if (z > 0) {
    const front = clamp(Math.sin(a), 0, 1);
    z += faceRelief(x, y + RELIEF_SHIFT) * GAIN * Math.pow(front, 0.6);
    z *= 0.97;
  }
  return [x, y, z];
}

function buildModel(): Model {
  const r = rng(11);
  const PX: number[] = [];
  const PY: number[] = [];
  const PZ: number[] = [];
  const PT: number[] = [];
  const PB: number[] = [];
  const PF: number[] = [];
  const PR: number[] = [];
  const PC: number[] = [];
  const PL: number[] = [];
  const rowsList: number[][][] = [];
  const add = (x: number, y: number, z: number, part: number, base: number, fade: number, row = 0, col = 0, lw = 0) => {
    PX.push(x);
    PY.push(y);
    PZ.push(z);
    PT.push(part);
    PB.push(base);
    PF.push(fade);
    PR.push(row);
    PC.push(col);
    PL.push(lw);
    return PX.length - 1;
  };

  const warp = (i: number, per: number) => {
    const phi = (i / per) * Math.PI * 2 - Math.PI / 2;
    return phi - 0.6 * Math.sin(phi) + Math.PI / 2;
  };

  // ---- cabeça
  const HR = 54;
  const HP = 76;
  const headRows: number[][] = [];
  for (let j = 0; j < HR; j++) {
    const y = lerp(Y_TOP - 0.008, Y_CHIN, j / (HR - 1));
    const row: number[] = [];
    for (let i = 0; i < HP; i++) {
      const a = warp(i + (j % 2) * 0.5, HP);
      const [x, yy, z] = headPoint(y, a);
      const rel = z > 0.02 ? faceRelief(x, yy + RELIEF_SHIFT) : 0;
      row.push(add(x, yy, z, P_HEAD, 0.08 + r() * 0.12 + clamp(rel * 5, -0.1, 0.35), 1, j, i));
    }
    headRows.push(row);
  }
  rowsList.push(headRows);

  // ---- pescoço + busto
  const BR = 14;
  const BP = 36;
  const bustRows: number[][] = [];
  for (let j = 0; j < BR; j++) {
    const u = j / (BR - 1);
    const y = lerp(-0.3, -0.98, u);
    const flare = Math.pow(clamp((u - 0.3) / 0.7, 0, 1), 1.7);
    const rx = lerp(0.118, 0.58, flare);
    const rz = lerp(0.105, 0.2, flare);
    const fade = Math.pow(1 - u, 0.85);
    const row: number[] = [];
    for (let i = 0; i < BP; i++) {
      const a = (i / BP) * Math.PI * 2 + (j % 2) * (Math.PI / BP);
      row.push(add(Math.cos(a) * rx, y, Math.sin(a) * rz, P_BODY, 0.12 + r() * 0.12, fade, j, i));
    }
    bustRows.push(row);
  }
  rowsList.push(bustRows);

  // ---- pálpebras / olhos
  const eyes: Eye[] = [];
  const surf = (x: number, y: number) => {
    const w = headHalfWidth(y);
    const a = Math.acos(clamp(x / w, -1, 1));
    return headPoint(y, a);
  };
  const NL = 14;
  for (const sx of [-1, 1]) {
    const up: number[] = [];
    const lo: number[] = [];
    for (let k = 0; k < NL; k++) {
      const t = k / (NL - 1);
      const x = sx * lerp(EYE_X + 0.054, EYE_X - 0.05, t);
      const yc = EYE_Y + 0.007 * (1 - t);
      const sn = Math.sin(Math.PI * t);
      const [ux, uy, uz] = surf(x, yc + 0.021 * Math.pow(sn, 0.85));
      up.push(add(ux, uy, uz + 0.006, P_LID, 0.9, 1, 0, 0, sn));
      const [lx, ly, lz] = surf(x, yc - 0.013 * Math.pow(sn, 0.9));
      lo.push(add(lx, ly, lz + 0.006, P_LID, 0.8, 1));
    }
    const [cx0, cy0, cz0] = surf(sx * EYE_X, EYE_Y);
    const c = add(cx0, cy0, cz0 + 0.012, P_EYE, 0, 0);
    eyes.push({ c, up, lo });
  }
  const core = add(0, EYE_Y + 0.025, 0.06, P_CORE, 0, 0);

  // ---- orelhas (polilinhas fechadas)
  const loops: number[][] = [];
  for (const sx of [-1, 1]) {
    const loop: number[] = [];
    for (let k = 0; k < 18; k++) {
      const th = (k / 18) * Math.PI * 2;
      const y = 0.0 + 0.065 * Math.cos(th);
      const w = headHalfWidth(y);
      const x = sx * (w + 0.012 + 0.024 * (0.5 + 0.5 * Math.sin(th)));
      loop.push(add(x, y, -0.02 + 0.032 * Math.sin(th), P_BODY, 0.4, 1));
    }
    loops.push(loop);
  }

  const n = PX.length;
  const X = Float32Array.from(PX);
  const Y = Float32Array.from(PY);
  const Z = Float32Array.from(PZ);
  const NX = new Float32Array(n);
  const NY = new Float32Array(n);
  const NZ = new Float32Array(n);

  // ---- normais por diferenças finitas na grade
  for (const rows of rowsList) {
    const nr = rows.length;
    const per = rows[0].length;
    for (let j = 0; j < nr; j++)
      for (let i = 0; i < per; i++) {
        const id = rows[j][i];
        const pl = rows[j][(i - 1 + per) % per];
        const pr = rows[j][(i + 1) % per];
        const pu = rows[Math.max(0, j - 1)][i];
        const pd = rows[Math.min(nr - 1, j + 1)][i];
        const t1x = X[pr] - X[pl];
        const t1y = Y[pr] - Y[pl];
        const t1z = Z[pr] - Z[pl];
        const t2x = X[pd] - X[pu];
        const t2y = Y[pd] - Y[pu];
        const t2z = Z[pd] - Z[pu];
        let nx = t1y * t2z - t1z * t2y;
        let ny = t1z * t2x - t1x * t2z;
        let nz = t1x * t2y - t1y * t2x;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l;
        ny /= l;
        nz /= l;
        if (nx * X[id] + nz * Z[id] < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }
        NX[id] = nx;
        NY[id] = ny;
        NZ[id] = nz;
      }
  }
  for (const eye of eyes) for (const id of [...eye.up, ...eye.lo, eye.c]) NZ[id] = 1;

  // ---- dissolução: ~30% da superfície vira partículas
  const PHASE = new Float32Array(n);
  const FLOW = new Uint8Array(n);
  const FL = new Float32Array(n);
  const SPD = new Float32Array(n);
  const DX = new Float32Array(n);
  const DY = new Float32Array(n);
  const DZ = new Float32Array(n);
  for (let i = 0; i < n; i++) PHASE[i] = r() * 6.2832;
  for (const rows of rowsList) {
    for (const row of rows)
      for (const id of row) {
        const x = X[id];
        const y = Y[id];
        const z = Z[id];
        const wL = smooth(0.1, 0.34, -x);
        const wT = smooth(0.3, 0.42, y);
        const wB = smooth(-0.42, -0.85, y);
        const wK = smooth(-0.04, -0.28, z);
        const dis = clamp(wL * 0.92 + wT * 0.8 + wB * 0.9 + wK * 0.55, 0, 0.97);
        if (r() < Math.pow(dis, 0.85)) {
          FLOW[id] = 1;
          let dx = -0.9 * wL + (r() - 0.5) * 0.5;
          let dy = 0.35 * wL + wT - wB * 1.1 + 0.08 + (r() - 0.5) * 0.3;
          let dz = -0.5 * wK - 0.25 * wL + (r() - 0.5) * 0.5;
          const l = Math.hypot(dx, dy, dz) || 1;
          dx /= l;
          dy /= l;
          dz /= l;
          DX[id] = dx;
          DY[id] = dy;
          DZ[id] = dz;
          FL[id] = 0.16 + 0.3 * dis * (0.5 + r());
          SPD[id] = 0.1 + r() * 0.2;
        }
      }
  }

  // ---- arestas (só entre pontos formados): anéis completos + meridianos alternados
  const edges: number[] = [];
  for (const rows of rowsList) {
    const nr = rows.length;
    const per = rows[0].length;
    for (let j = 0; j < nr; j++)
      for (let i = 0; i < per; i++) {
        const a = rows[j][i];
        const b = rows[j][(i + 1) % per];
        if (!FLOW[a] && !FLOW[b]) edges.push(a, b);
        if (j < nr - 1 && i % 2 === 0) {
          const c = rows[j + 1][i];
          if (!FLOW[a] && !FLOW[c]) edges.push(a, c);
        }
      }
  }

  const tubes: Tube[] = [
    { rings: headRows, fill: [0.13, 0.06] },
    { rings: bustRows, fill: [0.1, 0] },
  ];

  const EYE_C: [number, number, number][] = eyes.map((e) => [X[e.c], Y[e.c], Z[e.c]]);
  const EYED = new Float32Array(n);
  const D = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let best = 9;
    for (const c of EYE_C) best = Math.min(best, Math.hypot(X[i] - c[0], Y[i] - c[1], Z[i] - c[2]));
    EYED[i] = best;
    D[i] = Math.hypot(X[i], Y[i] - (EYE_Y + 0.025), Z[i] - 0.06);
  }

  // ---- linhas neurais
  const neural: Model["neural"] = [];
  const real = HR * HP;
  for (let k = 0; k < 200; k++) {
    const a = Math.floor(r() * real);
    const b = Math.floor(r() * real);
    if (FLOW[a] || FLOW[b] || Z[a] < -0.02 || Z[b] < -0.02) continue;
    const d = Math.hypot(X[a] - X[b], Y[a] - Y[b], Z[a] - Z[b]);
    if (d > 0.12 && d < 0.4) neural.push({ a, b, ph: r() * 6.28, sp: 0.35 + r() * 0.9 });
  }
  for (let k = 0; k < 120 && neural.length < 260; k++) {
    const b = Math.floor(r() * real);
    if (!FLOW[b] && Z[b] > 0.05) neural.push({ a: core, b, ph: r() * 6.28, sp: 0.5 + r() * 0.8 });
  }

  return {
    n,
    X,
    Y,
    Z,
    NX,
    NY,
    NZ,
    PART: Uint8Array.from(PT),
    BASE: Float32Array.from(PB),
    FADE: Float32Array.from(PF),
    PHASE,
    FLOW,
    FL,
    SPD,
    DX,
    DY,
    DZ,
    ROW: Uint16Array.from(PR),
    COL: Uint16Array.from(PC),
    LIDW: Float32Array.from(PL),
    EYED,
    D,
    tubes,
    edges: Uint32Array.from(edges),
    loops,
    neural,
    core,
    eyes,
  };
}

/* ---------------------------------- sprites -------------------------------- */

function makeSprite(color: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, `rgba(${color},1)`);
  gr.addColorStop(0.18, `rgba(${color},0.55)`);
  gr.addColorStop(0.5, `rgba(${color},0.12)`);
  gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

/* ---------------------------------- HUD ------------------------------------ */

const PANELS = [
  { a0: 0.4, y: 0.36, label: "NEURAL_NET", kind: 0 },
  { a0: 2.0, y: -0.1, label: "LATENCY", kind: 1 },
  { a0: 3.55, y: 0.44, label: "CODE_GEN", kind: 2 },
  { a0: 5.1, y: -0.32, label: "CONFIDENCE", kind: 3 },
] as const;

const CODE = ["const ai = new Agent()", "await model.think(ctx)", "pipeline.optimize()", "deploy(solution)", "SELECT * FROM ideas", "git push origin main"];

const OCTA: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const CUBE: [number, number, number][] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) CUBE.push([a, b, c]);

/* ---------------------------------- componente ------------------------------ */

export function AIHologram() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const M = buildModel();
    const spriteSoft = makeSprite(SOFT);
    const spriteHot = makeSprite(HOT);
    const spriteViolet = makeSprite(VIOLET);
    const spriteNeon = makeSprite(NEON);

    const SX = new Float32Array(M.n);
    const SY = new Float32Array(M.n);
    const SZ = new Float32Array(M.n);
    const PS = new Float32Array(M.n);
    const BR = new Float32Array(M.n);
    const VIS = new Float32Array(M.n);

    // bloom: down/upsample de uma janela em volta do rosto
    const bloomA = document.createElement("canvas");
    const bloomB = document.createElement("canvas");
    const bctxA = bloomA.getContext("2d");
    const bctxB = bloomB.getContext("2d");

    let vw = 0;
    let vh = 0;
    let S = 300;
    let cx = 0;
    let cy = 0;
    let compact = false;
    let dpr = 1;

    const resize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      compact = vw < 700;
      dpr = Math.min(window.devicePixelRatio || 1, vw > 1200 ? 1.5 : 2);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      const pr = compact ? 0.78 : 1;
      const pw = compact ? 0.4 : 0.46;
      S = Math.min(vh * 0.5, ((vw / 2) * 0.96) / ((pr + pw / 2) * 1.1));
      cx = vw / 2;
      cy = vh * 0.47 - 0.215 * S;
    };
    resize();

    // ponteiro
    let tmx = 0;
    let tmy = 0;
    let mx = 0;
    let my = 0;
    let pxs = vw / 2;
    let pys = vh / 2;
    let hover = 0;
    const onMove = (e: PointerEvent) => {
      tmx = clamp((e.clientX / vw - 0.5) * 2, -1, 1);
      tmy = clamp((e.clientY / vh - 0.5) * 2, -1, 1);
      pxs = e.clientX;
      pys = e.clientY;
    };
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let clickAt = -99;
    let clickPending = false;
    let clickScreen = [0, 0];
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 7 && performance.now() - downT < 450) {
        clickPending = true;
        clickScreen = [e.clientX, e.clientY];
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("resize", resize);

    let pbuf: { cv: HTMLCanvasElement; cx: CanvasRenderingContext2D; img: ImageData; tpl: Uint8ClampedArray; w: number; h: number } | null = null;
    const waves: number[] = [];
    let nextBeat = 0.8;
    const patches: { x: number; y: number; r: number; s: number; d: number }[] = [];
    let nextPatch = 1.5;
    const pr0 = rng(99);
    let po = 0; // parallax horizontal

    const NP = compact ? 3 : 4;

    function frame(t: number, dt: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, vw, vh);
      ctx!.globalCompositeOperation = "lighter";
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";

      const k = 1 - Math.exp(-dt / 200);
      mx += (tmx - mx) * k;
      my += (tmy - my) * k;

      // clique
      if (clickPending) {
        clickPending = false;
        clickAt = t;
        waves.push(t - 0.4);
      }
      const ca = t - clickAt;
      const scatter = ca >= 0 && ca < 3.4 ? (1 - Math.exp(-ca * 12)) * Math.exp(-ca * 1.45) : 0;

      const yaw = Math.sin(t * 0.2) * 0.12 + mx * 0.3;
      const pitch = 0.1 + my * 0.07 + Math.sin(t * 0.33) * 0.012;
      const headYaw = mx * 0.2 + Math.sin(t * 0.37) * 0.07;
      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const chy = Math.cos(headYaw);
      const shy = Math.sin(headYaw);
      const bob = Math.sin(t * 0.8) * 0.02;
      const breathe = Math.sin(t * 1.05);

      // foco do cursor: intensifica o brilho quando perto do rosto
      const hd = Math.hypot(pxs - cx, pys - cy) / (0.9 * S);
      hover += (clamp(1 - hd, 0, 1) - hover) * (1 - Math.exp(-dt / 400));
      const gain = 1 + 0.28 * hover;

      const act = clamp(0.55 + 0.3 * Math.sin(t * 0.9) * Math.sin(t * 0.31 + 1) + 0.1 * Math.sin(t * 3.7), 0.2, 1);
      if (t >= nextBeat) {
        waves.push(t);
        nextBeat = t + 3.4;
      }
      while (waves.length && t - waves[0] > 3.6) waves.shift();
      const beat = waves.length ? Math.exp(-(t - waves[waves.length - 1]) * 1.8) : 0;
      const pulse = clamp(act * 0.65 + beat * 0.5 + scatter * 0.3, 0, 1.2);

      // patches de reconstrução
      if (t >= nextPatch) {
        patches.push({ x: (pr0() - 0.5) * 0.36, y: -0.28 + pr0() * 0.62, r: 0.07 + pr0() * 0.05, s: t, d: 1.8 + pr0() * 1.2 });
        nextPatch = t + 1.4 + pr0() * 1.4;
      }
      while (patches.length && t - patches[0].s > patches[0].d) patches.shift();

      // luz em espaço do modelo (inverso da rotação de câmera)
      const toModel = (vx: number, vy: number, vz: number): [number, number, number] => {
        const y1 = vy * cp + vz * sp;
        const z1 = -vy * sp + vz * cp;
        return [vx * cyaw - z1 * syaw, y1, vx * syaw + z1 * cyaw];
      };
      const nl = Math.hypot(-0.5, 0.55, 0.7);
      const [Lx, Ly, Lz] = toModel(-0.5 / nl, 0.55 / nl, 0.7 / nl);
      const [Vx, Vy, Vz] = toModel(0, 0, 1);

      const proj = (x: number, y: number, z: number, out: number[]) => {
        const x1 = x * cyaw + z * syaw;
        const z1 = -x * syaw + z * cyaw;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const ps = 1 / (1 - z2 * 0.22);
        out[0] = cx + po + x1 * S * ps;
        out[1] = cy - y2 * S * ps;
        out[2] = z2;
        out[3] = ps;
      };
      const o = [0, 0, 0, 1];
      const pf = [0, 0, 0, 0];

      const floorY = -1.0;
      const scanY = -0.95 + ((t * 0.24) % 1) * 1.45;
      const scanX = -0.36 + ((t * 0.17 + 0.5) % 1) * 0.72;

      /* ---------- chão: cone volumétrico, anéis, ondas ---------- */
      po = mx * S * 0.03;
      {
        const pL = [0, 0, 0, 0];
        const pR = [0, 0, 0, 0];
        proj(-0.6, floorY, 0, pL);
        proj(0.6, floorY, 0, pR);
        const topY = cy - 0.7 * S;
        const gr = ctx!.createLinearGradient(0, cy + 1.0 * S, 0, topY);
        gr.addColorStop(0, `rgba(${VIOLET},0.2)`);
        gr.addColorStop(0.6, `rgba(${VIOLET},0.05)`);
        gr.addColorStop(1, `rgba(${VIOLET},0)`);
        ctx!.fillStyle = gr;
        ctx!.beginPath();
        ctx!.moveTo(pL[0], pL[1]);
        ctx!.lineTo(cx + po - 0.33 * S, topY);
        ctx!.lineTo(cx + po + 0.33 * S, topY);
        ctx!.lineTo(pR[0], pR[1]);
        ctx!.closePath();
        ctx!.fill();

        proj(0, floorY, 0, o);
        const bw = S * (1.1 + beat * 0.1);
        ctx!.globalAlpha = 0.5 + beat * 0.25;
        ctx!.drawImage(spriteViolet, o[0] - bw, o[1] - bw * 0.28, bw * 2, bw * 0.56);
        ctx!.globalAlpha = 1;

        const ring = (R: number, dash: number[], speed: number, alpha: number, w: number, col = SOFT) => {
          ctx!.setLineDash(dash);
          ctx!.lineDashOffset = -t * speed;
          ctx!.strokeStyle = `rgba(${col},${alpha})`;
          ctx!.lineWidth = w;
          ctx!.beginPath();
          for (let i = 0; i <= 72; i++) {
            const a = (i / 72) * Math.PI * 2;
            proj(Math.cos(a) * R, floorY, Math.sin(a) * R, o);
            if (i === 0) ctx!.moveTo(o[0], o[1]);
            else ctx!.lineTo(o[0], o[1]);
          }
          ctx!.stroke();
          ctx!.setLineDash([]);
        };
        ring(0.42, [3, 8], 12, 0.7, 1.1, HOT);
        ring(0.62, [28, 12, 4, 12], -18, 0.5, 1.2);
        ring(0.82, [1, 7], 9, 0.4, 1.4);
        ring(1.02, [60, 26], 24, 0.28, 1);

        ctx!.strokeStyle = `rgba(${SOFT},0.38)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * Math.PI * 2 + t * 0.14;
          const r0 = i % 5 === 0 ? 0.68 : 0.71;
          proj(Math.cos(a) * r0, floorY, Math.sin(a) * r0, o);
          ctx!.moveTo(o[0], o[1]);
          proj(Math.cos(a) * 0.75, floorY, Math.sin(a) * 0.75, o);
          ctx!.lineTo(o[0], o[1]);
        }
        ctx!.stroke();

        for (const w0 of waves) {
          const age = (t - w0) / 2.8;
          if (age < 0 || age > 1) continue;
          const R = 0.1 + age * 1.4;
          ctx!.strokeStyle = `rgba(${HOT},${(1 - age) * 0.55})`;
          ctx!.lineWidth = 1.4 * (1 - age) + 0.4;
          ctx!.beginPath();
          for (let i = 0; i <= 72; i++) {
            const a = (i / 72) * Math.PI * 2;
            proj(Math.cos(a) * R, floorY, Math.sin(a) * R, o);
            if (i === 0) ctx!.moveTo(o[0], o[1]);
            else ctx!.lineTo(o[0], o[1]);
          }
          ctx!.stroke();
        }
      }

      /* ---------- transformação + iluminação dos pontos ---------- */
      po = mx * S * 0.014;
      const blinkPh = t % 7.4;
      const blink = blinkPh < 0.2 ? Math.sin((blinkPh / 0.2) * Math.PI) : 0;
      const eyePulse = 0.7 + 0.3 * Math.sin(t * 1.1);
      for (let i = 0; i < M.n; i++) {
        const part = M.PART[i];
        let x = M.X[i];
        let y = M.Y[i];
        let z = M.Z[i];
        let vis = 1;
        const isCore = part === P_CORE;

        // fluxo de partículas (entram e saem da estrutura)
        if (M.FLOW[i]) {
          const u = (t * M.SPD[i] + M.PHASE[i] / 6.2832) % 1;
          const uu = M.PHASE[i] > 3.14 ? 1 - u : u;
          const dd = M.FL[i] * uu;
          x += M.DX[i] * dd + Math.sin(t * 1.3 + M.PHASE[i] * 4) * 0.005;
          y += M.DY[i] * dd;
          z += M.DZ[i] * dd;
          vis = Math.sin(Math.PI * u);
        }

        // ondulações holográficas + distorção no scan
        if (part !== P_CORE && part !== P_EYE) {
          x += Math.sin(y * 24 + t * 2.4) * 0.0028 * (z > 0 ? 1 : 0.4);
          const sd = (y - scanY) / 0.03;
          x += 0.012 * Math.exp(-sd * sd) * Math.sin(y * 90 + t * 20);
        }

        // reconstrução de pequenas partes do rosto
        let patch = 0;
        if (part === P_HEAD) {
          for (let q = 0; q < patches.length; q++) {
            const pt = patches[q];
            const ddx = x - pt.x;
            const ddy = y - pt.y;
            if (ddx * ddx + ddy * ddy > pt.r * pt.r) continue;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy) / pt.r;
            if (dd < 1) {
              const env = Math.sin(Math.PI * clamp((t - pt.s) / pt.d, 0, 1));
              patch = Math.max(patch, env * Math.pow(1 - dd, 1.3));
            }
          }
          if (patch > 0.001) {
            const off = patch * 0.05;
            x += M.NX[i] * off;
            y += M.NY[i] * off;
            z += M.NZ[i] * off;
            vis *= 1 - 0.8 * patch;
          }
        }

        // dispersão por clique
        if (scatter > 0.002 && !isCore) {
          const dx = x;
          const dy = y - 0.02;
          const dz = z;
          const l = Math.hypot(dx, dy, dz) || 1;
          const rr = (M.PHASE[i] * 7.31) % 1;
          const amt = scatter * (0.12 + 0.5 * rr);
          x += (dx / l) * amt;
          y += (dy / l) * amt;
          z += (dz / l) * amt;
          vis *= 1 - 0.35 * scatter;
        }

        // respiração digital
        if (part === P_BODY) {
          x *= 1 + 0.018 * breathe;
          z *= 1 + 0.018 * breathe;
        } else {
          y += breathe * 0.0035;
        }
        if (part === P_LID && M.LIDW[i] > 0) y -= blink * M.LIDW[i] * 0.03;

        if (part === P_HEAD || part === P_EYE || part === P_LID || part === P_CORE) {
          const hx = x * chy + z * shy;
          z = -x * shy + z * chy;
          x = hx;
        }
        y += bob;

        const x1 = x * cyaw + z * syaw;
        const z1 = -x * syaw + z * cyaw;
        const y2 = y * cp - z1 * sp;
        const z2 = y * sp + z1 * cp;
        const ps = 1 / (1 - z2 * 0.22);
        SX[i] = cx + po + x1 * S * ps;
        SY[i] = cy - y2 * S * ps;
        SZ[i] = z2;
        PS[i] = ps;
        VIS[i] = vis;

        if (isCore || part === P_EYE) {
          BR[i] = 0;
          continue;
        }

        // iluminação: luz principal + rim light (fresnel) + traços de energia
        const nx = M.NX[i];
        const ny = M.NY[i];
        const nz = M.NZ[i];
        const lam = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
        const ndv = nx * Vx + ny * Vy + nz * Vz;
        const q = 1 - clamp(ndv, 0, 1);
        const rim = q * q * (0.45 + 0.55 * q);
        const facing = 0.16 + 0.84 * smooth(-0.3, 0.3, ndv);
        const flick = 0.82 + 0.18 * Math.sin(t * 1.8 + M.PHASE[i] * 3);
        let b = (0.1 + 0.62 * lam + 0.55 * rim) * flick + M.BASE[i] * 0.55;
        if (part === P_LID) b = 1.05;

        const ds = (M.Y[i] - scanY) / 0.04;
        if (ds < 4 && ds > -4) b += Math.exp(-ds * ds) * 0.8;
        const dxs = (M.X[i] - scanX) / 0.03;
        if (dxs < 4 && dxs > -4) b += Math.exp(-dxs * dxs) * 0.45 * facing;
        for (let w = 0; w < waves.length; w++) {
          const age = t - waves[w];
          const dw = (M.D[i] - age * 0.55) / 0.07;
          if (dw < 4 && dw > -4) b += Math.exp(-dw * dw) * 0.95 * (1 - age / 3.6);
        }
        if (part === P_HEAD) {
          const col = M.COL[i];
          const row = M.ROW[i];
          if (col % 8 === 0) b += Math.pow(Math.max(0, Math.sin(row * 0.26 - t * 2.2 + col * 0.9)), 16) * 0.85;
          if (row % 10 === 0) b += Math.pow(Math.max(0, Math.sin(col * 0.19 + t * 2.6 + row)), 16) * 0.6;
          const ee = M.EYED[i] / 0.07;
          if (ee < 3) b += Math.exp(-ee * ee) * 0.18 * eyePulse * (1 - blink);
        }
        b += patch * 0.7;
        b += pulse * 0.18 * Math.exp(-M.D[i] * 3.5);
        b *= gain * (0.94 + 0.06 * breathe);
        BR[i] = b * facing;
      }

      /* ---------- painéis: posições ---------- */
      const R_ORB = compact ? 0.78 : 1.0;
      const panelPos = (p: number, out: number[]) => {
        const def = PANELS[p];
        const ang = def.a0 + t * 0.13;
        proj(Math.cos(ang) * R_ORB, def.y + Math.sin(t * 0.6 + def.a0) * 0.025, Math.sin(ang) * R_ORB * 0.45, out);
      };
      const drawPanels = (front: boolean) => {
        const pw = (compact ? 0.4 : 0.46) * S;
        const ph = (compact ? 0.26 : 0.29) * S;
        const fs = Math.max(7, S * 0.027);
        for (let p = 0; p < NP; p++) {
          const def = PANELS[p];
          panelPos(p, pf);
          const isFront = pf[2] > 0;
          if (isFront !== front) continue;
          const dn = clamp((pf[2] + R_ORB * 0.45) / (R_ORB * 0.9), 0, 1);
          const keep = clamp(Math.abs(pf[0] - cx) / (S * 0.5), 0.15, 1);
          const al = (0.28 + 0.62 * dn) * (front ? keep : 1);
          const sc = 0.8 + 0.25 * pf[3];
          const w = pw * sc;
          const h = ph * sc;
          const x0 = pf[0] - w / 2;
          const y0 = pf[1] - h / 2;
          ctx!.globalAlpha = al;
          ctx!.fillStyle = `rgba(8,10,26,0.5)`;
          ctx!.strokeStyle = `rgba(${SOFT},0.6)`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.roundRect(x0, y0, w, h, 6);
          ctx!.globalCompositeOperation = "source-over";
          ctx!.fill();
          ctx!.globalCompositeOperation = "lighter";
          ctx!.stroke();
          ctx!.strokeStyle = `rgba(${HOT},0.9)`;
          ctx!.beginPath();
          ctx!.moveTo(x0, y0 + 9);
          ctx!.lineTo(x0, y0);
          ctx!.lineTo(x0 + 9, y0);
          ctx!.stroke();
          ctx!.font = `500 ${fs}px ui-monospace, Menlo, Consolas, monospace`;
          ctx!.fillStyle = `rgba(${HOT},0.9)`;
          ctx!.textBaseline = "top";
          ctx!.fillText(def.label, x0 + 8, y0 + 7);
          if (Math.sin(t * 3 + p) > 0) {
            ctx!.fillStyle = `rgba(${NEON},0.9)`;
            ctx!.fillRect(x0 + w - 12, y0 + 9, 4, 4);
          }
          const bx = x0 + 8;
          const by = y0 + fs + 14;
          const bw = w - 16;
          const bh = h - fs - 22;
          if (bh > 4) {
            if (def.kind === 0) {
              const bars = 6;
              for (let i = 0; i < bars; i++) {
                const v = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * (0.9 + i * 0.31) + i * 1.7 + p));
                ctx!.fillStyle = `rgba(${i % 2 ? SOFT : VIOLET},0.8)`;
                ctx!.fillRect(bx + i * (bw / bars), by + bh * (1 - v), bw / bars - 3, bh * v);
              }
            } else if (def.kind === 1) {
              ctx!.strokeStyle = `rgba(${SOFT},0.95)`;
              ctx!.lineWidth = 1.2;
              ctx!.beginPath();
              for (let i = 0; i <= 28; i++) {
                const v = 0.5 + 0.28 * Math.sin(i * 0.5 + t * 1.8) + 0.18 * Math.sin(i * 1.3 - t * 2.6);
                const xx = bx + (i / 28) * bw;
                const yy = by + bh * (1 - v);
                if (i === 0) ctx!.moveTo(xx, yy);
                else ctx!.lineTo(xx, yy);
              }
              ctx!.stroke();
            } else if (def.kind === 2) {
              ctx!.font = `400 ${Math.max(6, fs * 0.82)}px ui-monospace, Menlo, Consolas, monospace`;
              const lines = Math.max(2, Math.floor(bh / (fs * 1.05)));
              const off = Math.floor(t * 1.1);
              for (let i = 0; i < lines; i++) {
                const txt = CODE[(((i + off) % CODE.length) + CODE.length) % CODE.length];
                ctx!.fillStyle = `rgba(${i === lines - 1 ? HOT : SOFT},${i === lines - 1 ? 0.95 : 0.55})`;
                ctx!.fillText(txt.slice(0, compact ? 15 : 22), bx, by + i * fs * 1.05);
              }
            } else {
              const gr = Math.max(2, Math.min(bh, bw) / 2);
              const gx = bx + bw / 2;
              const gy = by + bh / 2;
              const v = 0.8 + 0.15 * Math.sin(t * 0.8);
              ctx!.lineWidth = 3;
              ctx!.strokeStyle = `rgba(${VIOLET},0.5)`;
              ctx!.beginPath();
              ctx!.arc(gx, gy, gr, 0, Math.PI * 2);
              ctx!.stroke();
              ctx!.strokeStyle = `rgba(${HOT},0.95)`;
              ctx!.beginPath();
              ctx!.arc(gx, gy, gr, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2);
              ctx!.stroke();
              ctx!.fillStyle = `rgba(${HOT},0.95)`;
              ctx!.textAlign = "center";
              ctx!.textBaseline = "middle";
              ctx!.fillText(`${Math.round(v * 100)}%`, gx, gy);
              ctx!.textAlign = "left";
            }
          }
          ctx!.globalAlpha = 1;
        }
      };

      /* ---------- camada orbital (atrás): painéis + linhas de dados ---------- */
      po = mx * S * -0.04;
      drawPanels(false);
      {
        ctx!.lineWidth = 1;
        for (let p = 0; p < NP; p++) {
          panelPos(p, pf);
          const hx = SX[M.eyes[0].c] * 0.5 + SX[M.eyes[1].c] * 0.5;
          const hy = SY[M.eyes[0].c] * 0.5 + SY[M.eyes[1].c] * 0.5;
          const dn = clamp((pf[2] + R_ORB * 0.45) / (R_ORB * 0.9), 0, 1);
          const cqx = (pf[0] + hx) / 2;
          const cqy = Math.min(pf[1], hy) - S * 0.12;
          ctx!.strokeStyle = `rgba(${SOFT},${0.05 + 0.1 * dn})`;
          ctx!.beginPath();
          ctx!.moveTo(pf[0], pf[1]);
          ctx!.quadraticCurveTo(cqx, cqy, hx, hy);
          ctx!.stroke();
          const f = (t * 0.25 + p * 0.27) % 1;
          const qx = (1 - f) * (1 - f) * pf[0] + 2 * (1 - f) * f * cqx + f * f * hx;
          const qy = (1 - f) * (1 - f) * pf[1] + 2 * (1 - f) * f * cqy + f * f * hy;
          const sz = S * 0.012;
          ctx!.globalAlpha = 0.5 * Math.sin(Math.PI * f);
          ctx!.drawImage(spriteNeon, qx - sz * 2, qy - sz * 2, sz * 4, sz * 4);
          ctx!.globalAlpha = 1;
        }
      }

      /* ---------- anéis orbitais inclinados + sólidos minimalistas ---------- */
      po = mx * S * -0.02;
      const orbits = [
        { R: 0.7, tx: 0.9, tz: 0.4, sp: 0.4, n: compact ? 16 : 26 },
        { R: 0.92, tx: -0.55, tz: 0.85, sp: -0.3, n: compact ? 18 : 32 },
        { R: 0.56, tx: 1.3, tz: -0.5, sp: 0.6, n: compact ? 10 : 18 },
      ];
      for (let oi = 0; oi < orbits.length; oi++) {
        const ob = orbits[oi];
        const ctx1 = Math.cos(ob.tx);
        const stx = Math.sin(ob.tx);
        const ctz = Math.cos(ob.tz);
        const stz = Math.sin(ob.tz);
        const place = (a: number, out: number[]) => {
          const lx = Math.cos(a) * ob.R;
          const lz = Math.sin(a) * ob.R;
          const ly = -lz * stx;
          const lz2 = lz * ctx1;
          const wx = lx * ctz - ly * stz;
          const wy = lx * stz + ly * ctz;
          proj(wx, wy + 0.04 + bob, lz2, out);
        };
        ctx!.setLineDash([2, 10]);
        ctx!.lineDashOffset = -t * 10 * Math.sign(ob.sp);
        ctx!.strokeStyle = `rgba(${SOFT},0.3)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        for (let i = 0; i <= 80; i++) {
          place((i / 80) * Math.PI * 2, o);
          if (i === 0) ctx!.moveTo(o[0], o[1]);
          else ctx!.lineTo(o[0], o[1]);
        }
        ctx!.stroke();
        ctx!.setLineDash([]);
        for (let i = 0; i < ob.n; i++) {
          const a = (i / ob.n) * Math.PI * 2 + t * ob.sp;
          place(a, o);
          const dn = clamp((o[2] + 1) / 2, 0.15, 1);
          const sz = (2.6 + (i % 3)) * (S / 380) * o[3] * (compact ? 1.2 : 1);
          ctx!.globalAlpha = 0.3 + 0.6 * dn;
          ctx!.drawImage(i % 4 === 0 ? spriteHot : spriteSoft, o[0] - sz * 2, o[1] - sz * 2, sz * 4, sz * 4);
        }
        ctx!.globalAlpha = 1;
      }
      {
        const shapes = [
          { v: OCTA, a0: 1.2, R: 0.95, y: 0.5, sz: 0.045, sp: 0.16, e: 0 },
          { v: CUBE, a0: 4.4, R: 0.9, y: -0.45, sz: 0.032, sp: -0.14, e: 1 },
        ];
        for (const sh of shapes) {
          const ang = sh.a0 + t * sh.sp;
          const ccx = Math.cos(ang) * sh.R;
          const ccz = Math.sin(ang) * sh.R * 0.5;
          const ra = t * 0.5;
          const rb = t * 0.37;
          const V = sh.v.map(([a, b, c]) => {
            const x1 = a * Math.cos(ra) + c * Math.sin(ra);
            const z1 = -a * Math.sin(ra) + c * Math.cos(ra);
            const y1 = b * Math.cos(rb) - z1 * Math.sin(rb);
            const z2 = b * Math.sin(rb) + z1 * Math.cos(rb);
            const out = [0, 0, 0, 1];
            proj(ccx + x1 * sh.sz, sh.y + y1 * sh.sz, ccz + z2 * sh.sz, out);
            return out;
          });
          ctx!.strokeStyle = `rgba(${HOT},0.5)`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          for (let a = 0; a < sh.v.length; a++)
            for (let b = a + 1; b < sh.v.length; b++) {
              const dsum =
                Math.abs(sh.v[a][0] - sh.v[b][0]) + Math.abs(sh.v[a][1] - sh.v[b][1]) + Math.abs(sh.v[a][2] - sh.v[b][2]);
              const ok = sh.e === 0 ? dsum < 2.5 && dsum > 1.5 : dsum === 2;
              if (!ok) continue;
              ctx!.moveTo(V[a][0], V[a][1]);
              ctx!.lineTo(V[b][0], V[b][1]);
            }
          ctx!.stroke();
          for (const v of V) {
            const sz = S * 0.008;
            ctx!.drawImage(spriteHot, v[0] - sz * 2, v[1] - sz * 2, sz * 4, sz * 4);
          }
        }
      }

      /* ---------- silhueta (pele de vidro) ---------- */
      po = mx * S * 0.014;
      for (let ti = 0; ti < M.tubes.length; ti++) {
        const tb = M.tubes[ti];
        const rs = tb.rings;
        const left: number[] = [];
        const right: number[] = [];
        let topY = 1e9;
        let botY = -1e9;
        for (let j = 0; j < rs.length; j++) {
          let mn = 1e9;
          let mxx = -1e9;
          let ay = 0;
          let cnt = 0;
          const ring = rs[j];
          for (let i = 0; i < ring.length; i++) {
            const id = ring[i];
            if (M.FLOW[id]) continue;
            if (SX[id] < mn) mn = SX[id];
            if (SX[id] > mxx) mxx = SX[id];
            ay += SY[id];
            cnt++;
          }
          if (cnt < 3) {
            mn = cx + po;
            mxx = cx + po;
            ay = SY[ring[0]];
            cnt = 1;
          }
          ay /= cnt;
          left.push(mn, ay);
          right.push(mxx, ay);
          if (ay < topY) topY = ay;
          if (ay > botY) botY = ay;
        }
        const g = ctx!.createLinearGradient(0, topY, 0, botY + 1);
        g.addColorStop(0, `rgba(${VIOLET},${tb.fill[0] + pulse * 0.05})`);
        g.addColorStop(1, `rgba(${VIOLET},${tb.fill[1]})`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(left[0], left[1]);
        for (let j = 1; j < rs.length; j++) ctx!.lineTo(left[j * 2], left[j * 2 + 1]);
        for (let j = rs.length - 1; j >= 0; j--) ctx!.lineTo(right[j * 2], right[j * 2 + 1]);
        ctx!.closePath();
        ctx!.fill();
      }

      /* ---------- malha wireframe (3 faixas de brilho) ---------- */
      {
        const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
        const E = M.edges;
        for (let e = 0; e < E.length; e += 2) {
          const a = E[e];
          const b = E[e + 1];
          const dn = 0.25 + 0.75 * smooth(-0.15, 0.3, (SZ[a] + SZ[b]) * 0.5);
          const v = (BR[a] + BR[b]) * 0.5 * Math.min(M.FADE[a], M.FADE[b], VIS[a], VIS[b]) * dn;
          if (v < 0.08) continue;
          const bk = v < 0.4 ? 0 : v < 0.85 ? 1 : 2;
          buckets[bk].moveTo(SX[a], SY[a]);
          buckets[bk].lineTo(SX[b], SY[b]);
        }
        ctx!.lineWidth = 0.7;
        ctx!.strokeStyle = `rgba(${SOFT},0.16)`;
        ctx!.stroke(buckets[0]);
        ctx!.strokeStyle = `rgba(${SOFT},0.4)`;
        ctx!.stroke(buckets[1]);
        ctx!.lineWidth = 1;
        ctx!.strokeStyle = `rgba(${HOT},0.75)`;
        ctx!.stroke(buckets[2]);
        ctx!.lineWidth = 0.8;
        ctx!.strokeStyle = `rgba(${SOFT},0.35)`;
        for (const loop of M.loops) {
          ctx!.beginPath();
          for (let i = 0; i <= loop.length; i++) {
            const id = loop[i % loop.length];
            if (i === 0) ctx!.moveTo(SX[id], SY[id]);
            else ctx!.lineTo(SX[id], SY[id]);
          }
          ctx!.stroke();
        }
      }

      /* ---------- conexões neurais (conectam / desconectam) ---------- */
      for (let i = 0; i < M.neural.length; i++) {
        const nl2 = M.neural[i];
        const v = Math.sin(t * nl2.sp + nl2.ph);
        if (v < 0.55) continue;
        const al = ((v - 0.55) / 0.45) * 0.5 * (0.3 + 0.7 * smooth(-0.1, 0.25, SZ[nl2.b]));
        ctx!.strokeStyle = `rgba(${nl2.a === M.core ? HOT : SOFT},${al})`;
        ctx!.lineWidth = 0.8;
        ctx!.beginPath();
        ctx!.moveTo(SX[nl2.a], SY[nl2.a]);
        ctx!.lineTo(SX[nl2.b], SY[nl2.b]);
        ctx!.stroke();
        const sz = 5 * (S / 380) * PS[nl2.b];
        ctx!.globalAlpha = al;
        ctx!.drawImage(spriteHot, SX[nl2.b] - sz, SY[nl2.b] - sz, sz * 2, sz * 2);
        ctx!.globalAlpha = 1;
      }

      /* ---------- partículas (splat aditivo em buffer → 1 drawImage) ---------- */
      {
        const rx0 = cx - 1.0 * S;
        const ry0 = cy - 0.72 * S;
        const rw = 2.0 * S;
        const rh = 1.8 * S;
        const sc = Math.min(1, 420 / rw);
        const w2 = Math.max(16, Math.ceil(rw * sc));
        const h2 = Math.max(16, Math.ceil(rh * sc));
        if (!pbuf || pbuf.w !== w2 || pbuf.h !== h2) {
          const cv = document.createElement("canvas");
          cv.width = w2;
          cv.height = h2;
          const img = new ImageData(w2, h2);
          const tpl = new Uint8ClampedArray(img.data.length);
          pbuf = { cv, cx: cv.getContext("2d")!, img, tpl, w: w2, h: h2 };
        }
        const { img, tpl } = pbuf;
        const buf = img.data;
        buf.set(tpl);
        const ox0 = rx0;
        const oy0 = ry0;
        const hot = [214 / 255, 1, 253 / 255];
        const vio = [139 / 255, 92 / 255, 246 / 255];
        const cya = [0, 212 / 255, 1];
        const put = (x: number, y: number, w: number, c: number[]) => {
          if (x < 0 || y < 0 || x >= w2 || y >= h2) return;
          const idx = (y * w2 + x) * 4;
          buf[idx] += c[0] * w;
          buf[idx + 1] += c[1] * w;
          buf[idx + 2] += c[2] * w;
        };
        for (let i = 0; i < M.n; i++) {
          const part = M.PART[i];
          if (part === P_CORE || part === P_EYE) continue;
          const bb = BR[i];
          const fade = M.FADE[i] * VIS[i];
          const a2 = clamp(bb, 0, 1.15) * fade;
          if (a2 < 0.04) continue;
          const px = (SX[i] - ox0) * sc;
          const py = (SY[i] - oy0) * sc;
          const x0 = Math.floor(px);
          const y0 = Math.floor(py);
          const fx = px - x0;
          const fy = py - y0;
          const e = a2 * (230 + 80 * bb) * (0.8 + 0.4 * PS[i] * 0.8);
          const col = bb < 0.38 ? vio : cya;
          put(x0, y0, (1 - fx) * (1 - fy) * e, col);
          put(x0 + 1, y0, fx * (1 - fy) * e, col);
          put(x0, y0 + 1, (1 - fx) * fy * e, col);
          put(x0 + 1, y0 + 1, fx * fy * e, col);
          const h = e * 0.22;
          put(x0 - 1, y0, h, col);
          put(x0 + 2, y0, h, col);
          put(x0, y0 - 1, h, col);
          put(x0, y0 + 2, h, col);
          if (bb > 0.8) {
            const eh = e * clamp((bb - 0.8) * 1.2, 0, 1) * 0.8;
            put(x0, y0, eh * 0.5, hot);
            put(x0 + 1, y0, eh * 0.5, hot);
            put(x0, y0 + 1, eh * 0.5, hot);
            put(x0 + 1, y0 + 1, eh * 0.5, hot);
          }
        }
        // converte energia acumulada em RGBA com alfa (sem fundo opaco)
        for (let q = 0; q < buf.length; q += 4) {
          const r0 = buf[q];
          const g0 = buf[q + 1];
          const b0 = buf[q + 2];
          const m = r0 > g0 ? (r0 > b0 ? r0 : b0) : g0 > b0 ? g0 : b0;
          if (m > 0) {
            const k3 = 255 / m;
            buf[q] = r0 * k3;
            buf[q + 1] = g0 * k3;
            buf[q + 2] = b0 * k3;
            buf[q + 3] = m;
          }
        }
        pbuf.cx.putImageData(img, 0, 0);
        ctx!.globalAlpha = 1;
        ctx!.drawImage(pbuf.cv, 0, 0, w2, h2, rx0, ry0, rw, rh);
      }
      ctx!.globalAlpha = 1;

      /* ---------- olhos ---------- */
      {
        const ox = mx * S * 0.0075 + Math.sin(t * 0.7) * S * 0.0015;
        const oy = my * S * 0.005 + Math.cos(t * 0.9) * S * 0.001;
        const open = 1 - blink;
        for (let e = 0; e < 2; e++) {
          const eye = M.eyes[e];
          const ex = SX[eye.c];
          const ey = SY[eye.c];
          const es = S * PS[eye.c];
          ctx!.globalAlpha = (0.28 + pulse * 0.12) * (0.5 + 0.5 * open);
          const rv = es * 0.17;
          ctx!.drawImage(spriteViolet, ex - rv, ey - rv, rv * 2, rv * 2);
          const rs2 = es * 0.085;
          ctx!.globalAlpha = 0.28 * eyePulse * open;
          ctx!.drawImage(spriteSoft, ex - rs2, ey - rs2, rs2 * 2, rs2 * 2);
          ctx!.globalAlpha = 1;

          const path = new Path2D();
          path.moveTo(SX[eye.up[0]], SY[eye.up[0]]);
          for (let k2 = 1; k2 < eye.up.length; k2++) path.lineTo(SX[eye.up[k2]], SY[eye.up[k2]]);
          for (let k2 = eye.lo.length - 1; k2 >= 0; k2--) path.lineTo(SX[eye.lo[k2]], SY[eye.lo[k2]]);
          path.closePath();

          ctx!.save();
          ctx!.clip(path);
          ctx!.fillStyle = `rgba(${SOFT},0.1)`;
          ctx!.fillRect(ex - es * 0.2, ey - es * 0.12, es * 0.4, es * 0.24);
          const ix = ex + ox;
          const iy = ey + oy;
          const R = es * 0.05;
          const ig = ctx!.createRadialGradient(ix, iy, 0, ix, iy, R);
          ig.addColorStop(0, `rgba(255,255,255,${0.98 * eyePulse})`);
          ig.addColorStop(0.16, `rgba(${NEON},${0.95 * eyePulse})`);
          ig.addColorStop(0.5, `rgba(${SOFT},0.8)`);
          ig.addColorStop(0.82, `rgba(${VIOLET},0.55)`);
          ig.addColorStop(1, `rgba(${VIOLET},0)`);
          ctx!.fillStyle = ig;
          ctx!.fillRect(ix - R, iy - R, R * 2, R * 2);
          ctx!.strokeStyle = `rgba(${HOT},0.28)`;
          ctx!.lineWidth = 0.7;
          ctx!.beginPath();
          for (let k2 = 0; k2 < 26; k2++) {
            const a = (k2 / 26) * Math.PI * 2 + t * (e ? -0.18 : 0.18);
            ctx!.moveTo(ix + Math.cos(a) * R * 0.3, iy + Math.sin(a) * R * 0.3);
            ctx!.lineTo(ix + Math.cos(a) * R * 0.78, iy + Math.sin(a) * R * 0.78);
          }
          ctx!.stroke();
          const rp = es * (0.013 + 0.005 * eyePulse);
          ctx!.drawImage(spriteHot, ix - rp * 1.8, iy - rp * 1.8, rp * 3.6, rp * 3.6);
          ctx!.restore();

          ctx!.lineWidth = 1.2;
          ctx!.strokeStyle = `rgba(${HOT},${0.7 + 0.2 * eyePulse})`;
          ctx!.beginPath();
          for (let k2 = 0; k2 < eye.up.length; k2++) {
            if (k2 === 0) ctx!.moveTo(SX[eye.up[k2]], SY[eye.up[k2]]);
            else ctx!.lineTo(SX[eye.up[k2]], SY[eye.up[k2]]);
          }
          ctx!.stroke();
          ctx!.strokeStyle = `rgba(${SOFT},0.55)`;
          ctx!.beginPath();
          for (let k2 = 0; k2 < eye.lo.length; k2++) {
            if (k2 === 0) ctx!.moveTo(SX[eye.lo[k2]], SY[eye.lo[k2]]);
            else ctx!.lineTo(SX[eye.lo[k2]], SY[eye.lo[k2]]);
          }
          ctx!.stroke();
          for (let k2 = 0; k2 < 2; k2++) {
            const a = t * (0.9 + k2 * 0.35) * (e ? -1 : 1) + k2 * 3.1;
            const rr = es * (0.075 + 0.012 * k2);
            const sz = es * 0.01;
            ctx!.globalAlpha = 0.65 * open;
            ctx!.drawImage(spriteNeon, ex + ox + Math.cos(a) * rr - sz * 2, ey + oy + Math.sin(a) * rr * 0.7 - sz * 2, sz * 4, sz * 4);
          }
          ctx!.globalAlpha = 1;
        }
        const lxL = SX[M.eyes[0].c] - S * 0.2;
        const lxR = SX[M.eyes[1].c] + S * 0.2;
        const ly = (SY[M.eyes[0].c] + SY[M.eyes[1].c]) / 2;
        const lg = ctx!.createLinearGradient(lxL, 0, lxR, 0);
        lg.addColorStop(0, `rgba(${SOFT},0)`);
        lg.addColorStop(0.5, `rgba(${HOT},${(0.09 + pulse * 0.08) * open})`);
        lg.addColorStop(1, `rgba(${SOFT},0)`);
        ctx!.fillStyle = lg;
        ctx!.fillRect(lxL, ly - 0.6, lxR - lxL, 1.2);

        const kx = SX[M.core];
        const ky = SY[M.core];
        for (const w0 of waves) {
          const age = (t - w0) / 2.0;
          if (age < 0 || age > 1) continue;
          ctx!.strokeStyle = `rgba(${NEON},${(1 - age) * 0.35})`;
          ctx!.lineWidth = 1.2;
          ctx!.beginPath();
          ctx!.arc(kx, ky, S * (0.04 + age * 0.7), 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      /* ---------- scan holográfico (vertical + horizontal) ---------- */
      {
        proj(0, scanY + bob, 0, o);
        const rx = 0.4 * S * o[3];
        const ry = rx * Math.sin(pitch + 0.05);
        const edgeA = clamp(1 - Math.abs((scanY + 0.2) / 0.8) * 0.5, 0.25, 1);
        ctx!.strokeStyle = `rgba(${HOT},${0.55 * edgeA})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.ellipse(o[0], o[1], rx, ry, 0, 0, Math.PI * 2);
        ctx!.stroke();
        const sg = ctx!.createLinearGradient(0, o[1] - 12, 0, o[1] + 12);
        sg.addColorStop(0, `rgba(${SOFT},0)`);
        sg.addColorStop(0.5, `rgba(${SOFT},${0.16 * edgeA})`);
        sg.addColorStop(1, `rgba(${SOFT},0)`);
        ctx!.fillStyle = sg;
        ctx!.fillRect(o[0] - rx * 1.1, o[1] - 12, rx * 2.2, 24);
        proj(scanX, 0.0, 0, o);
        const hg = ctx!.createLinearGradient(o[0] - 10, 0, o[0] + 10, 0);
        hg.addColorStop(0, `rgba(${SOFT},0)`);
        hg.addColorStop(0.5, `rgba(${HOT},0.16)`);
        hg.addColorStop(1, `rgba(${SOFT},0)`);
        ctx!.fillStyle = hg;
        ctx!.fillRect(o[0] - 10, cy - 0.5 * S, 20, 0.95 * S);
      }

      /* ---------- HUD: arcos em torno da cabeça ---------- */
      {
        proj(0, 0.0, 0, o);
        const hx = o[0];
        const hy = o[1];
        const arcs = [
          { r: 0.64, w: 1.1, a: 0.32, sp: 0.1, segs: 3 },
          { r: 0.74, w: 0.8, a: 0.2, sp: -0.07, segs: 5 },
        ];
        for (const ar of arcs) {
          ctx!.lineWidth = ar.w;
          ctx!.strokeStyle = `rgba(${SOFT},${ar.a})`;
          for (let sgi = 0; sgi < ar.segs; sgi++) {
            const a0 = t * ar.sp + (sgi / ar.segs) * Math.PI * 2;
            ctx!.beginPath();
            ctx!.arc(hx, hy, S * ar.r, a0, a0 + ((Math.PI * 2) / ar.segs) * 0.62);
            ctx!.stroke();
          }
          ctx!.beginPath();
          for (let k2 = 0; k2 < 90; k2++) {
            const a = (k2 / 90) * Math.PI * 2 + t * ar.sp;
            const len = k2 % 5 === 0 ? 0.016 : 0.008;
            ctx!.moveTo(hx + Math.cos(a) * S * (ar.r + 0.012), hy + Math.sin(a) * S * (ar.r + 0.012));
            ctx!.lineTo(hx + Math.cos(a) * S * (ar.r + 0.012 + len), hy + Math.sin(a) * S * (ar.r + 0.012 + len));
          }
          ctx!.globalAlpha = 0.5;
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }
      }

      po = mx * S * -0.04;
      drawPanels(true);
      po = mx * S * 0.014;

      /* ---------- vidro canelado + glitch ocasional (referência) ---------- */
      {
        const fx0 = cx + po - S * 0.4;
        const fw = S * 0.8;
        ctx!.lineWidth = 1;
        ctx!.strokeStyle = `rgba(${HOT},0.035)`;
        ctx!.beginPath();
        const step = Math.max(5, S * 0.016);
        for (let x = fx0; x < fx0 + fw; x += step) {
          ctx!.moveTo(x, cy - 0.5 * S);
          ctx!.lineTo(x, cy + 0.45 * S);
        }
        ctx!.stroke();
        const ph = t % 8.5;
        if (!reduce && ph < 0.2) {
          const strips = 24;
          const sw = fw / strips;
          const yy0 = Math.max(0, cy - 0.52 * S);
          const hh = Math.min(vh - yy0, 0.95 * S);
          ctx!.globalCompositeOperation = "source-over";
          const gn = Math.sin((ph / 0.2) * Math.PI);
          for (let i = 0; i < strips; i++) {
            const dy = Math.sin(i * 12.9898 + Math.floor(t * 30) * 4.1) * S * 0.022 * gn;
            ctx!.drawImage(ctx!.canvas, (fx0 + i * sw) * dpr, yy0 * dpr, sw * dpr, hh * dpr, fx0 + i * sw, yy0 + dy, sw, hh);
          }
          ctx!.globalCompositeOperation = "lighter";
        }
      }

      /* ---------- pulso do clique ---------- */
      if (ca >= 0 && ca < 1.8) {
        const age = ca / 1.8;
        proj(0, 0.0, 0, o);
        ctx!.strokeStyle = `rgba(${HOT},${(1 - age) * 0.7})`;
        ctx!.lineWidth = 2 * (1 - age) + 0.5;
        ctx!.beginPath();
        ctx!.arc(o[0], o[1], S * (0.1 + age * 1.5), 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.strokeStyle = `rgba(${SOFT},${(1 - age) * 0.4})`;
        ctx!.beginPath();
        ctx!.arc(o[0], o[1], S * (0.05 + age * 1.1), 0, Math.PI * 2);
        ctx!.stroke();
        const rr = S * 0.25 * (1 - age);
        ctx!.globalAlpha = 0.6 * (1 - age);
        ctx!.drawImage(spriteNeon, clickScreen[0] - rr, clickScreen[1] - rr, rr * 2, rr * 2);
        ctx!.globalAlpha = 1;
      }

      /* ---------- bloom controlado ---------- */
      if (bctxA && bctxB) {
        const bx = Math.max(0, cx - 0.85 * S);
        const by = Math.max(0, cy - 0.75 * S);
        const bw = Math.min(vw - bx, 1.7 * S);
        const bh = Math.min(vh - by, 1.6 * S);
        if (bw > 8 && bh > 8) {
          const aw = Math.max(8, Math.round(bw / 7));
          const ah = Math.max(8, Math.round(bh / 7));
          const cw = Math.max(4, Math.round(bw / 18));
          const ch = Math.max(4, Math.round(bh / 18));
          if (bloomA.width !== aw || bloomA.height !== ah) {
            bloomA.width = aw;
            bloomA.height = ah;
          }
          if (bloomB.width !== cw || bloomB.height !== ch) {
            bloomB.width = cw;
            bloomB.height = ch;
          }
          bctxA.globalCompositeOperation = "copy";
          bctxA.drawImage(ctx!.canvas, bx * dpr, by * dpr, bw * dpr, bh * dpr, 0, 0, aw, ah);
          bctxB.globalCompositeOperation = "copy";
          bctxB.drawImage(bloomA, 0, 0, aw, ah, 0, 0, cw, ch);
          ctx!.globalCompositeOperation = "lighter";
          ctx!.globalAlpha = 0.32;
          ctx!.drawImage(bloomA, 0, 0, aw, ah, bx, by, bw, bh);
          ctx!.globalAlpha = 0.45 + 0.15 * pulse;
          ctx!.drawImage(bloomB, 0, 0, cw, ch, bx, by, bw, bh);
          ctx!.globalAlpha = 1;
        }
      }
      ctx!.globalCompositeOperation = "source-over";
    }

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      frame(Math.max(0, now - t0) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };

    const cleanup = (extra?: () => void) => () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
      extra?.();
    };

    if (reduce) {
      waves.push(1.2);
      frame(2.2, 16);
      const redraw = () => {
        resize();
        frame(2.2, 16);
      };
      window.addEventListener("resize", redraw);
      return cleanup(() => window.removeEventListener("resize", redraw));
    }

    raf = requestAnimationFrame(loop);
    return cleanup();
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-20" />;
}
