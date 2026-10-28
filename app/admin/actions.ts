"use server";

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminAuthenticated } from "@/lib/admin";

const BOOLEANS = new Set(["true", "false"]);

function escapeYaml(value: string) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getTargetPath(type: string, slug: string, existingFile?: string) {
  const root = path.join(process.cwd(), "content");
  const safeSlug = normalizeSlug(existingFile ?? slug);

  if (type === "blog") {
    return path.join(root, "blog", `${safeSlug}.mdx`);
  }

  const resourceType = (() => {
    switch (type) {
      case "youtube":
        return "youtube";
      case "playlist":
        return "playlists";
      case "website":
        return "websites";
      case "github":
        return "github";
      case "collection":
        return "collections";
      default:
        return "geral";
    }
  })();

  return path.join(root, "recursos", resourceType, `${safeSlug}.mdx`);
}

function buildFrontmatter(data: Record<string, unknown>) {
  const lines: string[] = ["---"];

  const scalarFields: Array<[string, unknown]> = [
    ["title", data.title],
    ["slug", data.slug],
    ["type", data.type],
    ["summary", data.summary],
    ["category", data.category],
    ["publishedAt", data.publishedAt],
    ["featured", data.featured],
    ["status", data.status],
    ["sourceUrl", data.sourceUrl],
    ["language", data.language],
    ["thumbnail", data.thumbnail],
  ];

  for (const [key, value] of scalarFields) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (typeof value === "boolean") {
      lines.push(`${key}: ${value ? "true" : "false"}`);
      continue;
    }

    lines.push(`${key}: "${escapeYaml(String(value))}"`);
  }

  if (Array.isArray(data.tags) && data.tags.length > 0) {
    lines.push("tags:");
    for (const tag of data.tags) {
      lines.push(`  - "${escapeYaml(String(tag))}"`);
    }
  }

  lines.push("---");
  lines.push("");

  return `${lines.join("\n")}\n${String(data.body ?? "")}`;
}

async function assertAuthorized() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();
  const expected = process.env.ADMIN_PASSWORD ?? "admin";

  if (password !== expected) {
    redirect("/admin/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect("/admin/login");
}

export async function saveEntry(formData: FormData) {
  await assertAuthorized();

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "blog").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const category = String(formData.get("category") ?? "geral").trim();
  const status = String(formData.get("status") ?? "published").trim();
  const publishedAt = String(formData.get("publishedAt") ?? new Date().toISOString().slice(0, 10)).trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const language = String(formData.get("language") ?? "pt-BR").trim();
  const thumbnail = String(formData.get("thumbnail") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const featuredValue = String(formData.get("featured") ?? "false");
  const tagsValue = String(formData.get("tags") ?? "").trim();
  const existingFile = String(formData.get("existingFile") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(rawSlug || title);

  if (!title || !summary || !body || !slug) {
    redirect("/admin?error=missing-fields");
  }

  const featured = BOOLEANS.has(featuredValue.toLowerCase()) ? featuredValue.toLowerCase() === "true" : false;
  const tags = tagsValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const resolvedPath = existingFile || undefined;

  const fileTarget = getTargetPath(type, slug, resolvedPath);
  const dir = path.dirname(fileTarget);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const content = buildFrontmatter({
    title,
    slug,
    type,
    summary,
    category,
    tags,
    publishedAt,
    featured,
    status,
    sourceUrl,
    language,
    thumbnail,
    body,
  });

  writeFileSync(fileTarget, content, "utf8");
  redirect("/admin?item=" + encodeURIComponent(slug));
}
