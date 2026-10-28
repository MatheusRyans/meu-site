import { getAllContent } from "@/lib/content";

export async function GET() {
  const baseUrl = "https://meusite.example.com";
  const items = getAllContent()
    .map(
      (entry) => `
        <item>
          <title>${entry.title}</title>
          <link>${baseUrl}/${entry.type === "blog" ? "blog" : "recursos"}/${entry.slug}</link>
          <description>${entry.summary}</description>
          <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>
        </item>`,
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Matheus Ryans</title>
        <link>${baseUrl}</link>
        <description>Curadoria técnica e referências para tecnologia e aprendizado.</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
