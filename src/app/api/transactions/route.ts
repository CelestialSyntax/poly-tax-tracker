import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { z } from "zod/v4";

const createTransactionSchema = z.object({
  marketId: z.string().min(1),
  marketTitle: z.string().min(1),
  outcome: z.enum(["YES", "NO"]),
  type: z.enum(["BUY", "SELL", "SETTLEMENT", "REDEEM"]),
  quantity: z.number().positive(),
  pricePerShare: z.number().min(0).max(1),
  totalAmount: z.number().min(0),
  fee: z.number().min(0).optional().default(0),
  transactionHash: z.string().nullable().optional(),
  walletId: z.string().uuid().nullable().optional(),
  timestamp: z.string().datetime(),
  importSource: z.enum(["api", "csv", "manual", "bot"]).optional().default("manual"),
});

const SORTABLE_COLUMNS = {
  timestamp: transactions.timestamp,
  totalAmount: transactions.totalAmount,
  quantity: transactions.quantity,
  pricePerShare: transactions.pricePerShare,
  createdAt: transactions.createdAt,
} as const;

type SortColumn = keyof typeof SORTABLE_COLUMNS;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
    100
  );
  const sortParam = searchParams.get("sort") ?? "timestamp";
  const order = searchParams.get("order") ?? "desc";
  const marketId = searchParams.get("marketId");
  const type = searchParams.get("type");
  const outcome = searchParams.get("outcome");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [eq(transactions.userId, session.user.id)];
  if (marketId) conditions.push(eq(transactions.marketId, marketId));
  if (type) conditions.push(eq(transactions.type, type));
  if (outcome) conditions.push(eq(transactions.outcome, outcome));
  if (from) conditions.push(gte(transactions.timestamp, new Date(from)));
  if (to) conditions.push(lte(transactions.timestamp, new Date(to)));

  const where = and(...conditions);

  const sortColumn =
    SORTABLE_COLUMNS[sortParam as SortColumn] ?? transactions.timestamp;
  const orderFn = order === "asc" ? asc : desc;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where),
  ]);

  return NextResponse.json({
    transactions: data,
    pagination: {
      page,
      limit,
      total: Number(countResult[0].count),
      totalPages: Math.ceil(Number(countResult[0].count) / limit),
    },
  });
}

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

  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const result = await db
      .insert(transactions)
      .values({
        userId: session.user.id,
        marketId: data.marketId,
        marketTitle: data.marketTitle,
        outcome: data.outcome,
        type: data.type,
        quantity: String(data.quantity),
        pricePerShare: String(data.pricePerShare),
        totalAmount: String(data.totalAmount),
        fee: String(data.fee),
        transactionHash: data.transactionHash ?? null,
        walletId: data.walletId ?? null,
        timestamp: new Date(data.timestamp),
        importSource: data.importSource,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json(
        { error: "Transaction with this hash already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
