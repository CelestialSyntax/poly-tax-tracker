import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, wallets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { fetchActivityForWallet } from "@/lib/polymarket/api";
import { normalizeDataApiActivity } from "@/lib/polymarket/parser";

/**
 * POST /api/wallets/[id]/sync
 * Sync trades for a specific wallet by ID using the Polymarket Data API.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: walletId } = await params;

  // Look up wallet and validate ownership
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, session.user.id)))
    .limit(1);

  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  // Fetch activity from Polymarket Data API
  const activities = await fetchActivityForWallet(wallet.address);
  const normalized = normalizeDataApiActivity(activities);

  let imported = 0;
  let duplicates = 0;

  for (const tx of normalized) {
    try {
      if (tx.transactionHash) {
        const [dup] = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, session.user.id),
              eq(transactions.transactionHash, tx.transactionHash)
            )
          )
          .limit(1);
        if (dup) {
          duplicates++;
          continue;
        }
      }

      await db.insert(transactions).values({
        userId: session.user.id,
        walletId,
        marketId: tx.marketId,
        marketTitle: tx.marketTitle,
        outcome: tx.outcome,
        type: tx.type,
        quantity: String(tx.quantity),
        pricePerShare: String(tx.pricePerShare),
        totalAmount: String(tx.totalAmount),
        fee: String(tx.fee),
        transactionHash: tx.transactionHash,
        timestamp: tx.timestamp,
        importSource: "api",
      });
      imported++;
    } catch {
      duplicates++;
    }
  }

  // Update lastSyncAt
  await db
    .update(wallets)
    .set({ lastSyncAt: new Date() })
    .where(eq(wallets.id, walletId));

  return NextResponse.json({ imported, duplicates }, { status: 200 });
}
