import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/portfolio", "/carteira", "/config", "/notificacoes"],
      },
    ],
    sitemap: "https://oddbr.com/sitemap.xml",
  };
}
