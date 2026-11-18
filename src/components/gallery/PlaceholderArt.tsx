import { cn } from "@/lib/utils";

export type ArtKind = "phone" | "poster" | "desktop" | "photo" | "note" | "shot";

/** Proporção (largura / altura) de cada tipo de card. */
export const ART_ASPECT: Record<ArtKind, number> = {
  phone: 0.5,
  poster: 0.78,
  desktop: 1.45,
  photo: 1,
  note: 0.72,
  shot: 1.5, // print real do projeto: proporção vem da imagem (ver GalleryCanvas)
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { bg: "#0d0818", fg: "#b565ff", soft: "#2a0a4d" }, // void + violeta
  { bg: "#16062b", fg: "#ffffff", soft: "#3b0f6e" }, // violeta profundo
  { bg: "#8c00f2", fg: "#ffffff", soft: "#b565ff" }, // violeta pleno
  { bg: "#000000", fg: "#8c00f2", soft: "#1a0a2e" }, // preto
  { bg: "#1b0b33", fg: "#e3c9ff", soft: "#4a1a8a" }, // ultravioleta
] as const;

/**
 * Arte placeholder gerada por código — nenhuma imagem de terceiros.
 * Para usar imagens reais, troque este componente por <Image /> em
 * GalleryCanvas (campo `src` de cada card) — ver docs/README.
 */
export function PlaceholderArt({
  kind,
  seed,
  className,
}: {
  kind: ArtKind;
  seed: number;
  className?: string;
}) {
  const r = mulberry32(seed);
  const pal = PALETTES[Math.floor(r() * PALETTES.length)];
  const lines = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <span
        key={i}
        className="block h-[3px] rounded-full"
        style={{
          background: pal.fg,
          opacity: 0.55 - i * 0.06,
          width: `${95 - Math.floor(r() * 45)}%`,
        }}
      />
    ));

  const base = "relative h-full w-full overflow-hidden";

  if (kind === "phone")
    return (
      <div
        className={cn(base, "rounded-[14%/7%] border-[3px] border-[#111] bg-[#111] p-[3%]", className)}
        aria-hidden
      >
        <div className="flex h-full flex-col gap-[5%] rounded-[12%/6%] p-[8%]" style={{ background: pal.bg }}>
          <span className="mx-auto h-[3%] w-[28%] rounded-full bg-black/60" />
          <span className="h-[26%] w-full rounded-[10%]" style={{ background: pal.soft }} />
          <div className="flex flex-col gap-[3%]">{lines(4)}</div>
          <span
            className="mt-auto h-[8%] w-full rounded-full"
            style={{ background: pal.fg, opacity: 0.85 }}
          />
        </div>
      </div>
    );

  if (kind === "desktop")
    return (
      <div className={cn(base, "rounded-[6px] border border-black/20 bg-[#111]", className)} aria-hidden>
        <div className="flex h-[9%] items-center gap-[2%] px-[3%]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[5%] max-h-1.5 max-w-1.5 rounded-full bg-white/30" />
          ))}
        </div>
        <div className="grid h-[91%] grid-cols-[1fr_1.4fr] gap-[4%] p-[4%]" style={{ background: pal.bg }}>
          <div className="flex flex-col gap-[6%]">
            <span className="h-[40%] rounded-[6px]" style={{ background: pal.soft }} />
            {lines(3)}
          </div>
          <span className="rounded-[6px]" style={{ background: pal.fg, opacity: 0.18 }} />
        </div>
      </div>
    );

  if (kind === "poster")
    return (
      <div
        className={cn(base, "flex flex-col justify-between p-[9%]", className)}
        style={{ background: pal.bg }}
        aria-hidden
      >
        <span className="size-[34%] rounded-full" style={{ background: pal.soft }} />
        <div className="flex flex-col gap-[6%]">
          <span className="block h-[7px] w-[70%] rounded-full" style={{ background: pal.fg }} />
          <span className="block h-[7px] w-[45%] rounded-full" style={{ background: pal.fg, opacity: 0.7 }} />
          {lines(3)}
        </div>
      </div>
    );

  if (kind === "note")
    return (
      <div className={cn(base, "flex flex-col gap-[5%] p-[10%]", className)} style={{ background: pal.bg }} aria-hidden>
        <span className="block h-[5px] w-[40%] rounded-full" style={{ background: pal.fg, opacity: 0.9 }} />
        <div className="flex flex-col gap-[3%]">{lines(7)}</div>
      </div>
    );

  // photo
  return (
    <div
      className={cn(base, "rounded-[4px]", className)}
      style={{
        background: `radial-gradient(circle at ${30 + r() * 40}% ${25 + r() * 30}%, ${pal.soft}, ${pal.bg} 70%)`,
      }}
      aria-hidden
    >
      <span
        className="absolute bottom-[-12%] left-[18%] size-[60%] rounded-full"
        style={{ background: pal.fg, opacity: 0.2 }}
      />
    </div>
  );
}
