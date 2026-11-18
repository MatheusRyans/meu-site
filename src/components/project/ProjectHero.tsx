"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, User } from "lucide-react";
import type { Project } from "@/content/site";
import { Button } from "@/components/ui/button";
import { resolveHref } from "@/lib/utils";
import { MaskLine } from "./Reveal";

function ShotMock({ image }: { image: Project["image"] }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
    >
      <motion.figure
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className="overflow-hidden rounded-2xl border border-violet/40 bg-black shadow-[0_40px_100px_-30px_rgba(140,0,242,0.7)]"
      >
        <div aria-hidden className="flex items-center gap-1.5 border-b border-ink/10 bg-cream px-4 py-3">
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          width={image.w}
          height={image.h}
          fetchPriority="high"
          className="block h-auto w-full"
        />
      </motion.figure>
    </motion.div>
  );
}

export function ProjectHero({ project }: { project: Project }) {
  const lastIdx = project.titleLines.length - 1;
  return (
    <section className="relative mx-auto grid min-h-screen max-w-[1500px] items-center gap-10 px-[30px] pb-16 pt-28 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 lg:pb-0 lg:pt-0">
      <div>
        <h1 className="font-editorial text-[clamp(2.5rem,5.4vw,5.25rem)] font-normal leading-[0.92] tracking-[-0.035em] text-ink [overflow-wrap:anywhere]">
          {project.titleLines.map((line, i) => (
            <MaskLine
              key={i}
              delay={0.1 + i * 0.12}
              className={i === lastIdx ? "italic text-gold" : undefined}
            >
              {line}
            </MaskLine>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
          className="mt-8 max-w-[34ch] font-sans text-[15px] leading-relaxed text-ink/70"
        >
          {project.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <span
            aria-hidden
            className="grid size-[25px] place-items-center rounded-full bg-violet text-white"
          >
            <User className="size-3" />
          </span>
          <Button asChild variant="pill">
            <a href={resolveHref(project.ctaHref)} target="_blank" rel="noreferrer">
              {project.cta}
              <ArrowDown />
            </a>
          </Button>
          {project.repoHref && (
            <Button asChild variant="pillOutline">
              <a href={project.repoHref} target="_blank" rel="noreferrer">
                Repositório
                <ArrowUpRight />
              </a>
            </Button>
          )}
        </motion.div>
      </div>

      <ShotMock image={project.image} />
    </section>
  );
}
