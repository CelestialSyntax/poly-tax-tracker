import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys, transactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import crypto from "crypto";

const tradeSchema = z.object({
  marketId: z.string().min(1),
  marketTitle: z.string().min(1),
  outcome: z.enum(["YES", "NO"]),
  type: z.enum(["BUY", "SELL", "SETTLEMENT", "REDEEM"]),
  quantity: z.number().positive(),
  pricePerShare: z.number().min(0).max(1),
  totalAmount: z.number().min(0),
  fee: z.number().min(0).optional().default(0),
  transactionHash: z.string().optional(),
  timestamp: z.string().datetime(),
});

const requestSchema = z.object({
  trades: z.array(tradeSchema).min(1).max(1000),
});

async function authenticateApiKey(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!apiKey) return null;

  // Update lastUsedAt
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return apiKey.userId;
}

export async function POST(request: NextRequest) {
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  let imported = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const trade of parsed.data.trades) {
    try {
      // Check for duplicate by transactionHash
      if (trade.transactionHash) {
        const [existing] = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.transactionHash, trade.transactionHash)
            )
          )
          .limit(1);

        if (existing) {
          duplicates++;
          continue;
        }
      }

      await db.insert(transactions).values({
        userId,
        marketId: trade.marketId,
        marketTitle: trade.marketTitle,
        outcome: trade.outcome,
        type: trade.type,
        quantity: String(trade.quantity),
        pricePerShare: String(trade.pricePerShare),
        totalAmount: String(trade.totalAmount),
        fee: String(trade.fee),
        transactionHash: trade.transactionHash ?? null,
        timestamp: new Date(trade.timestamp),
        importSource: "bot",
      });

      imported++;
    } catch (err) {
      errors.push(
        `Failed to import trade ${trade.transactionHash ?? "unknown"}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return NextResponse.json({ imported, duplicates, errors }, { status: 201 });
}
