import { NextRequest, NextResponse } from "next/server";
import { getMarketBySlug } from "@/lib/queries/markets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const market = await getMarketBySlug(slug);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  return NextResponse.json(market);
}
