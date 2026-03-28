import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/queries/markets";
import { marketQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const parsed = marketQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await getMarkets(parsed.data);
  return NextResponse.json(result);
}
