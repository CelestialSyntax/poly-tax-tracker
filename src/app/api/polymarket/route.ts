import { NextRequest, NextResponse } from "next/server";
import { fetchAllTradesForWallet, fetchMarketInfo } from "@/lib/polymarket/api";
import { normalizePolymarketTrades } from "@/lib/polymarket/parser";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  try {
    const trades = await fetchAllTradesForWallet(address);
    const marketIds = [...new Set(trades.map((t) => t.market))];
    const marketTitles = new Map<string, string>();
    await Promise.all(
      marketIds.map(async (id) => {
        const market = await fetchMarketInfo(id);
        if (market) marketTitles.set(id, market.question);
      })
    );
    const normalized = normalizePolymarketTrades(trades, marketTitles);

    return NextResponse.json({
      trades: normalized,
      count: normalized.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch trades",
      },
      { status: 500 }
    );
  }
}
