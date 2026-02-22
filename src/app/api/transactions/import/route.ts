import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, wallets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { fetchActivityForWallet } from "@/lib/polymarket/api";
import {
  normalizeDataApiActivity,
  parseCSVToTransactions,
  detectCSVColumns,
} from "@/lib/polymarket/parser";
import type { CSVColumnMap } from "@/lib/polymarket/parser";
import { z } from "zod/v4";
import Papa from "papaparse";

const walletImportSchema = z.object({
  type: z.literal("wallet"),
  address: z.string().min(1, "Wallet address is required"),
  label: z.string().optional(),
});

const csvImportSchema = z.object({
  type: z.literal("csv"),
  data: z.string().min(1, "CSV data is required"),
  columnMap: z
    .object({
      marketId: z.string(),
      marketTitle: z.string(),
      outcome: z.string(),
      type: z.string(),
      quantity: z.string(),
      pricePerShare: z.string(),
      totalAmount: z.string().optional(),
      fee: z.string().optional(),
      transactionHash: z.string().optional(),
      timestamp: z.string(),
    })
    .optional(),
});

const importSchema = z.discriminatedUnion("type", [
  walletImportSchema,
  csvImportSchema,
]);

/**
 * POST /api/transactions/import
 * Import trades from wallet address or CSV.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.type === "wallet") {
    return handleWalletImport(session.user.id, data.address, data.label);
  }

  return handleCsvImport(session.user.id, data.data, data.columnMap);
}

async function handleWalletImport(
  userId: string,
  address: string,
  label?: string
) {
  const addr = address.toLowerCase();

  // Upsert wallet
  const [existing] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.address, addr)))
    .limit(1);

  let walletId: string;
  if (existing) {
    walletId = existing.id;
    await db
      .update(wallets)
      .set({ lastSyncAt: new Date() })
      .where(eq(wallets.id, walletId));
  } else {
    const [w] = await db
      .insert(wallets)
      .values({ userId, address: addr, label: label ?? null })
      .returning();
    walletId = w.id;
  }

  // Fetch from Polymarket Data API (no auth required, includes market titles)
  const activities = await fetchActivityForWallet(address);
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
              eq(transactions.userId, userId),
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
        userId,
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

  return NextResponse.json({ imported, duplicates, walletId }, { status: 201 });
}

async function handleCsvImport(
  userId: string,
  csvData: string,
  columnMap?: CSVColumnMap
) {
  const result = Papa.parse<Record<string, string>>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return NextResponse.json(
      {
        error: "CSV parse error",
        details: result.errors.map((e) => e.message),
      },
      { status: 400 }
    );
  }

  if (result.data.length === 0) {
    return NextResponse.json(
      { error: "No rows found in CSV" },
      { status: 400 }
    );
  }

  // Auto-detect columns if not provided
  const headers = result.meta.fields ?? [];
  const resolvedMap = columnMap ?? (detectCSVColumns(headers) as CSVColumnMap);

  if (!resolvedMap.marketId || !resolvedMap.quantity || !resolvedMap.timestamp) {
    return NextResponse.json(
      {
        error:
          "Could not detect required columns (marketId, quantity, timestamp). Provide a columnMap.",
        detectedHeaders: headers,
      },
      { status: 400 }
    );
  }

  const normalized = parseCSVToTransactions(result.data, resolvedMap);

  let imported = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const tx of normalized) {
    try {
      if (tx.transactionHash) {
        const [dup] = await db
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
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
        userId,
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
        importSource: "csv",
      });
      imported++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("unique") || message.includes("duplicate")) {
        duplicates++;
      } else {
        errors.push(message);
      }
    }
  }

  return NextResponse.json({ imported, duplicates, errors }, { status: 201 });
}
