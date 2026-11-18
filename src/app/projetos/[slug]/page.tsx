import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects, site } from "@/content/site";
import { resolveHref } from "@/lib/utils";
import { ProjectHero } from "@/components/project/ProjectHero";
import { FeatureCards } from "@/components/project/FeatureCards";
import { AboutCard } from "@/components/project/AboutCard";
import { ClosingCta } from "@/components/project/ClosingCta";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projetos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return project
    ? { title: project.navLabel, description: project.description }
    : {};
}

export default async function ProjectPage({ params }: PageProps<"/projetos/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className="min-h-screen overflow-x-hidden bg-black bg-[radial-gradient(ellipse_at_50%_0%,rgba(140,0,242,0.35)_0%,rgba(40,0,80,0.25)_35%,#000_75%)] text-ink">
      <ProjectHero project={project} />
      <FeatureCards project={project} />
      <AboutCard project={project} />
      <ClosingCta project={project} />

      <footer className="mx-auto mt-24 flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-[30px] pb-10 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/50">
        <span>© {site.nome}</span>
        <div className="flex gap-6">
          {!site.email.startsWith("{{") && (
            <a href={`mailto:${site.email}`} className="hover:text-ink">
              {site.email}
            </a>
          )}
          <a href={resolveHref(site.github)} className="hover:text-ink">
            GitHub
          </a>
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
        </div>
      </footer>
    </main>
  );
}
