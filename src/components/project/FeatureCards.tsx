import type { Project } from "@/content/site";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Reveal } from "./Reveal";

export function FeatureCards({ project }: { project: Project }) {
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-24 sm:px-[30px]">
      <Reveal className="mb-8 flex items-center gap-4 text-ink/50">
        <span className="h-px flex-1 bg-current opacity-30" />
        <span className="font-sans text-[9px] uppercase tracking-[0.3em]">
          {project.featuresEyebrow}
        </span>
        <span className="h-px flex-1 bg-current opacity-30" />
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3">
        {project.features.map((f, i) => (
          <Reveal key={f.index} delay={i * 0.1}>
            <Card className="group h-full min-h-[260px] transition-transform duration-500 ease-[var(--ease-reveal)] hover:-translate-y-1">
              <span
                aria-hidden
                className="absolute -right-8 -top-8 size-28 rounded-full bg-bronze/40 transition-transform duration-700 ease-[var(--ease-reveal)] group-hover:scale-125"
              />
              <span className="relative block font-editorial text-[44px] italic leading-none text-bronze">
                {f.index}
              </span>
              <span className="relative mt-4 block font-sans text-[9px] uppercase tracking-[0.25em] text-gold-deep">
                {f.label}
              </span>
              <CardTitle className="relative mt-5">{f.title}</CardTitle>
              <CardDescription className="relative mt-3">{f.text}</CardDescription>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
