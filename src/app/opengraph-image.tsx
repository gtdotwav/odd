import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Odd — Mercado de previsões";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #F7F8FA 0%, #FFFFFF 50%, #2178B5 200%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Odd
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#4B5563",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Quanto você aposta no que acredita?
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            fontSize: 18,
            color: "#6B7280",
          }}
        >
          <span>Futebol</span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span>Política</span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span>Economia</span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span>Cripto</span>
          <span style={{ color: "#E5E7EB" }}>·</span>
          <span>Cultura Pop</span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 16,
            color: "#2178B5",
            fontWeight: 600,
          }}
        >
          oddbr.com
        </div>
      </div>
    ),
    { ...size }
  );
}
