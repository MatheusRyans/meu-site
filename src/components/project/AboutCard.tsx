import { User } from "lucide-react";
import type { Project } from "@/content/site";
import { Reveal } from "./Reveal";

export function AboutCard({ project }: { project: Project }) {
  const { about } = project;
  return (
    <Reveal
      as="section"
      className="mx-4 rounded-[32px] bg-paper [overflow-wrap:anywhere] px-6 py-14 border border-violet/25 shadow-[0_30px_90px_-40px_rgba(140,0,242,0.55)] sm:mx-[30px] md:px-14 md:py-[60px] lg:mx-auto lg:max-w-[1100px]"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span
          aria-hidden
          className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-violet to-bronze text-white"
        >
          <User className="size-8" strokeWidth={1.25} />
        </span>
        <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.25em] text-gold-deep">
          {about.eyebrow}
        </p>
        <p className="mt-5 font-sans text-[15px] leading-relaxed text-ink/75">{about.text}</p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {about.blocks.map((b, i) => (
          <Reveal
            key={i}
            delay={(i % 2) * 0.08}
            className="rounded-2xl bg-cream p-6 ring-1 ring-ink/[0.04]"
          >
            <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold-deep">
              {b.title}
            </h3>
            <p className="mt-3 font-sans text-[13px] leading-relaxed text-ink/70">{b.text}</p>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
