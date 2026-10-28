import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://meusite.example.com/sitemap.xml",
    host: "https://meusite.example.com",
  };
}
