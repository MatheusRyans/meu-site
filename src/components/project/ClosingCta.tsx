import { ArrowDown } from "lucide-react";
import type { Project } from "@/content/site";
import { Button } from "@/components/ui/button";
import { resolveHref } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function ClosingCta({ project }: { project: Project }) {
  const { closing } = project;
  return (
    <Reveal
      as="section"
      className="relative mx-4 mt-24 overflow-hidden rounded-[32px] bg-bronze sm:mx-[30px] lg:mx-auto lg:max-w-[1100px]"
    >
      {/* Fundo placeholder: substitua por <Image /> com overlay escuro */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(140,0,242,0.55),transparent_55%),linear-gradient(160deg,#2a0a4d,#050308)]"
      />
      <div className="relative flex flex-col items-center px-6 py-24 text-center text-ink md:py-32">
        <div className="flex w-full max-w-md items-center gap-4 text-ink/60">
          <span className="h-px flex-1 bg-current opacity-40" />
          <span aria-hidden>✦</span>
          <span className="h-px flex-1 bg-current opacity-40" />
        </div>
        <p className="mt-5 font-sans text-[10px] uppercase tracking-[0.3em] text-ink/55">
          {closing.company}
        </p>
        <h2 className="mt-6 font-editorial text-[clamp(2.25rem,5vw,3.75rem)] italic leading-[1] tracking-[-0.02em]">
          {closing.lines.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
        <Button asChild variant="pillLight" className="mt-10">
          <a href={resolveHref(project.ctaHref)} target="_blank" rel="noreferrer">
            {closing.cta}
            <ArrowDown />
          </a>
        </Button>
      </div>
    </Reveal>
  );
}
