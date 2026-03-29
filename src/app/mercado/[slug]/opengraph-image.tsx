import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Mercado Odd";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: market } = await supabase
    .from("markets")
    .select("title, subtitle, price_yes, price_no, category, volume, variation_24h")
    .eq("slug", slug)
    .single() as { data: { title: string; subtitle: string | null; price_yes: number; price_no: number; category: string; volume: number; variation_24h: number } | null };

  if (!market) {
    return new ImageResponse(
      <div style={{ background: "#F7F8FA", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#6B7280" }}>
        Mercado não encontrado
      </div>,
      { ...size }
    );
  }

  const yesPercent = Math.round(Number(market.price_yes) * 100);
  const noPercent = Math.round(Number(market.price_no) * 100);
  const variation = Number(market.variation_24h);
  const isPositive = variation >= 0;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F7F8FA 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 60,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 16, color: "#2178B5", fontWeight: 600, background: "rgba(33,120,181,0.1)", padding: "4px 12px", borderRadius: 20 }}>
            {market.category}
          </span>
          <span style={{ fontSize: 14, color: "#6B7280" }}>oddbr.com</span>
        </div>

        <div style={{ fontSize: 42, fontWeight: 700, color: "#111827", lineHeight: 1.2, maxWidth: 900, marginBottom: 16 }}>
          {market.title}
        </div>

        {market.subtitle && (
          <div style={{ fontSize: 20, color: "#4B5563", marginBottom: 32 }}>
            {market.subtitle}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>SIM</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#047857" }}>{yesPercent}%</span>
          </div>
          <div style={{ width: 1, height: 60, background: "#E5E7EB" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>NÃO</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#DC2626" }}>{noPercent}%</span>
          </div>
          <div style={{ width: 1, height: 60, background: "#E5E7EB" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>24h</span>
            <span style={{ fontSize: 32, fontWeight: 700, color: isPositive ? "#047857" : "#DC2626" }}>
              {isPositive ? "+" : ""}{(variation * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
