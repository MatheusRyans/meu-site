import type { MetadataRoute } from "next";
import { getAllContent } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://meusite.example.com";
  const entries = getAllContent().map((entry) => ({
    url: `${baseUrl}/${entry.type === "blog" ? "blog" : "recursos"}/${entry.slug}`,
    lastModified: new Date(entry.publishedAt),
  }));

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/recursos`, lastModified: new Date() },
    ...entries,
  ];
}
