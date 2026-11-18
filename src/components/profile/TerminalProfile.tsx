"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { ChevronRight, FileText, Pin, Power, User } from "lucide-react";
import { profile, site } from "@/content/site";
import { Panel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, EASE_REVEAL } from "@/lib/utils";

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="min-w-0 rounded-[3px] border border-term-line bg-term-bg/50 px-3 py-2 [overflow-wrap:anywhere]">
      <p className="text-[9px] uppercase tracking-[0.18em] text-term-dim">{label}</p>
      <p
        className={cn(
          "mt-1 text-[12px] font-semibold tracking-[0.08em] text-term-bright",
          !href && "uppercase",
        )}
      >
        {href ? (
          <a href={href} className="hover:text-term-amber hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function Whoami() {
  const [lines, setLines] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setLines([]);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setLines(profile.whoami.slice(0, i));
      if (i >= profile.whoami.length && timer.current) clearInterval(timer.current);
    }, 520);
  }, []);

  useEffect(() => {
    const start = setTimeout(play, 250);
    return () => {
      clearTimeout(start);
      if (timer.current) clearInterval(timer.current);
    };
  }, [play]);

  return (
    <Panel title="whoami" className="relative">
      <div className="absolute right-4 top-[10px] flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-term-dim">
        <button
          type="button"
          onClick={() => {
            if (timer.current) clearInterval(timer.current);
            setLines([]);
          }}
          className="hover:text-term-text"
        >
          Clear
        </button>
        <span aria-hidden>|</span>
        <button type="button" onClick={play} className="hover:text-term-text">
          Refresh
        </button>
      </div>
      <div
        className="min-h-[170px] space-y-2 text-[12.5px] leading-relaxed text-term-muted"
        aria-live="polite"
      >
        {lines.map((l, i) => {
          const tag = l.slice(0, 3);
          return (
            <motion.p
              key={`${i}-${l}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className={tag === "[!]" ? "font-semibold text-term-green" : "text-term-amber"}>
                {tag}
              </span>
              {l.slice(3)}
            </motion.p>
          );
        })}
        <span className="blink inline-block h-3.5 w-2 translate-y-0.5 bg-term-amber" aria-hidden />
      </div>
    </Panel>
  );
}

export function TerminalProfile() {
  const [halted, setHalted] = useState(false);
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(247,200,146,0.06), transparent 70%)`;

  const e = profile.experience;
  const english = profile.english;

  return (
    <main
      className="term-grid relative min-h-screen bg-term-bg px-3 pb-14 pt-[26px] font-mono text-[14.5px] text-term-text"
      onPointerMove={(ev) => {
        mx.set(ev.clientX);
        my.set(ev.clientY);
      }}
    >
      <motion.div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: glow }} />
      <div aria-hidden className="term-scanlines pointer-events-none fixed inset-0 z-10" />

      <div className="relative mx-auto max-w-[1180px]">
        {/* Cabeçalho */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="border-l-2 border-term-amber pl-3">
            <p className="text-[10px] tracking-[0.1em] text-term-dim">root@{profile.handle}</p>
            <h1 className="text-[27px] font-medium leading-tight tracking-[-0.015em] text-term-bright">
              <span className="text-term-dim">~/</span>
              {profile.indexName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.14em] text-term-muted hover:text-term-bright"
            >
              Ir para o portfólio
            </Link>
            <Button variant="danger" onClick={() => setHalted(true)}>
              <Power /> Killswitch
            </Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
          {/* Coluna esquerda */}
          <div className="flex flex-col gap-4">
            <Panel title="id">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-[3px] border border-term-line bg-term-bg text-term-dim">
                  <User className="size-6" strokeWidth={1.25} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold leading-tight text-term-bright">
                    {site.nome}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-term-muted">
                    {profile.role}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Origem" value={profile.stats.from} />
                <Stat label="Atualmente em" value={profile.stats.currentlyIn} />
              </div>
              <div className="mt-2 grid gap-2">
                <Stat label="Contribuições" value={profile.stats.contributions} />
                <Stat label="E-mail" value={profile.stats.email} href={`mailto:${profile.stats.email}`} />
              </div>
            </Panel>

            <Panel title="stack">
              <ul className="flex flex-col gap-2">
                {profile.stack.map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-2.5 rounded-[3px] border border-term-line bg-term-bg/50 px-3 py-2 text-[11.5px] uppercase tracking-[0.08em] text-term-text transition-colors hover:border-term-dim"
                  >
                    <ChevronRight className="size-3 text-term-amber" />
                    {s}
                  </li>
                ))}
              </ul>
            </Panel>

            {english && (
            <Panel title="english">
              <div className="flex gap-1.5" role="img" aria-label="Nível de inglês">
                {english.levels.map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: EASE_REVEAL, delay: 0.2 + i * 0.1 }}
                    style={{ originX: 0 }}
                    className={cn(
                      "h-2 flex-1 rounded-[2px]",
                      i <= english.current ? "bg-term-amber" : "bg-term-line",
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[8.5px] uppercase tracking-[0.12em] text-term-dim">
                {english.levels.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </Panel>
            )}
          </div>

          {/* Coluna direita */}
          <div className="flex min-w-0 flex-col gap-4">
            <Panel title="experience">
              <div data-lenis-prevent className="term-scroll max-h-[380px] overflow-y-auto pr-2">
                <h3 className="text-[15px] font-semibold text-term-bright">{e.role}</h3>
                <Badge variant="org" className="mt-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-term-blue" />
                  {e.company}
                </Badge>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <p className="mt-4 text-[12.5px] text-term-muted">{e.summary}</p>
                <ul className="mt-3 space-y-1.5 text-[12.5px] text-term-text">
                  {e.bullets.map((b) => (
                    <li key={b}>
                      <span className="text-term-amber">▸</span> {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-term-dim">
                  {e.contributionsTitle}
                </p>
                <ul className="mt-2 space-y-1.5 text-[12.5px] text-term-text">
                  {e.contributions.map((b) => (
                    <li key={b}>
                      <span className="text-term-amber">▸</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Whoami />
              <Panel title="certifications">
                <ul className="space-y-4">
                  {profile.certifications.map((c) => (
                    <li key={c.title} className="relative">
                      {c.pinned && (
                        <Pin className="absolute right-0 top-0 size-3 text-term-amber" />
                      )}
                      <p className="text-[10.5px] tracking-[0.1em] text-term-dim">{c.period}</p>
                      <p className="mt-1 text-[13px] font-semibold text-term-bright">
                        <a href={c.href} target="_blank" rel="noreferrer" className="hover:text-term-amber hover:underline">
                          {c.title}
                        </a>
                      </p>
                      <Badge variant="org" className="mt-1">
                        <FileText className="size-3" /> {c.org}
                      </Badge>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      {/* Killswitch: "desliga" o terminal; qualquer tecla / botão reinicia */}
      <AnimatePresence>
        {halted && (
          <motion.div
            key="halt"
            role="alertdialog"
            aria-label="Sistema desligado"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[12px] uppercase tracking-[0.3em] text-term-red">
              ▌ sistema desligado
            </p>
            <Button variant="terminal" autoFocus onClick={() => setHalted(false)}>
              Reiniciar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
