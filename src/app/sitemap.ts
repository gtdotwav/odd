import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: markets } = await supabase
    .from("markets")
    .select("slug, updated_at")
    .not("status", "in", '("draft","cancelled")') as { data: { slug: string; updated_at: string }[] | null };

  const marketEntries: MetadataRoute.Sitemap = (markets || []).map((m) => ({
    url: `https://oddbr.com/mercado/${m.slug}`,
    lastModified: m.updated_at,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    { url: "https://oddbr.com", lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: "https://oddbr.com/explorar", lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: "https://oddbr.com/agora", lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: "https://oddbr.com/rankings", lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: "https://oddbr.com/docs", lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: "https://oddbr.com/sobre", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: "https://oddbr.com/termos", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: "https://oddbr.com/privacidade", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...marketEntries,
  ];
}
