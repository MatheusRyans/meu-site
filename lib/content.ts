import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const contentTypeSchema = z.enum([
  "blog",
  "youtube",
  "playlist",
  "website",
  "github",
  "collection",
]);

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);

export const contentSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  type: contentTypeSchema,
  summary: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string(),
  featured: z.boolean().default(false),
  status: contentStatusSchema.default("published"),
  sourceUrl: z.string().optional(),
  language: z.enum(["pt-BR", "en"]).default("pt-BR"),
  thumbnail: z.string().optional(),
  body: z.string(),
});

export type ContentEntry = z.infer<typeof contentSchema>;

const contentDirectory = path.join(process.cwd(), "content");

function getContentPaths(directory: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...getContentPaths(fullPath));
    } else if (entry.isFile() && fullPath.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }

  return results;
}

function normalizeEntry(filePath: string): ContentEntry {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const parsed = contentSchema.safeParse({
    ...data,
    body: content,
    slug: data.slug ?? path.basename(filePath, ".mdx"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Content schema error in ${path.relative(process.cwd(), filePath)}: ${issue.path.join(".")} - ${issue.message}`,
    );
  }

  return parsed.data;
}

export function getAllContent(): ContentEntry[] {
  const files = getContentPaths(contentDirectory);
  const entries = files.map(normalizeEntry);

  return entries
    .filter((entry) => entry.status === "published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getFeaturedContent(limit = 3): ContentEntry[] {
  return getAllContent().filter((entry) => entry.featured).slice(0, limit);
}

export function getRecentContent(limit = 6): ContentEntry[] {
  return getAllContent().slice(0, limit);
}

export function getContentBySlug(slug: string): ContentEntry | undefined {
  return getAllContent().find((entry) => entry.slug === slug);
}

export function getContentFilePathBySlug(slug: string): string | undefined {
  const files = getContentPaths(contentDirectory);

  for (const filePath of files) {
    const entry = normalizeEntry(filePath);
    if (entry.slug === slug) {
      return filePath;
    }
  }

  return undefined;
}

export function getContentByType(type: string): ContentEntry[] {
  return getAllContent().filter((entry) => entry.type === type);
}

export function getCategories(): string[] {
  return [...new Set(getAllContent().map((entry) => entry.category))].sort();
}

export function getCategoryItems(category: string): ContentEntry[] {
  return getAllContent().filter((entry) => entry.category === category);
}
