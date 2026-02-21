import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { userSettings, apiKeys, wallets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

/**
 * GET /api/settings
 * Get user settings, API keys, and wallets.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings, keys, userWallets] = await Promise.all([
    db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1),
    db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        label: apiKeys.label,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id)),
    db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, session.user.id)),
  ]);

  return NextResponse.json({
    settings: settings[0] ?? {
      defaultTaxTreatment: "capital_gains",
      defaultCostBasis: "fifo",
      taxYear: new Date().getFullYear(),
    },
    apiKeys: keys,
    wallets: userWallets,
  });
}

/**
 * PUT /api/settings
 * Update user settings.
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [updated] = await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      defaultTaxTreatment: body.defaultTaxTreatment ?? "capital_gains",
      defaultCostBasis: body.defaultCostBasis ?? "fifo",
      taxYear: body.taxYear ?? new Date().getFullYear(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        defaultTaxTreatment: body.defaultTaxTreatment,
        defaultCostBasis: body.defaultCostBasis,
        taxYear: body.taxYear,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(updated);
}

/**
 * POST /api/settings
 * Generate new API key or add wallet.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.action === "create_api_key") {
    const rawKey = `ptx_${nanoid(32)}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.slice(0, 8);

    await db.insert(apiKeys).values({
      userId: session.user.id,
      keyHash,
      keyPrefix,
      label: body.label ?? "API Key",
    });

    // Return the raw key ONCE - it can't be retrieved later
    return NextResponse.json({ key: rawKey, prefix: keyPrefix }, { status: 201 });
  }

  if (body.action === "add_wallet") {
    const [wallet] = await db
      .insert(wallets)
      .values({
        userId: session.user.id,
        address: body.address.toLowerCase(),
        label: body.label ?? null,
        isProxy: body.isProxy ?? false,
      })
      .onConflictDoNothing()
      .returning();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(wallet, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * DELETE /api/settings
 * Delete an API key or wallet.
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.action === "delete_api_key" && body.id) {
    await db
      .delete(apiKeys)
      .where(
        and(eq(apiKeys.id, body.id), eq(apiKeys.userId, session.user.id))
      );
    return NextResponse.json({ success: true });
  }

  if (body.action === "delete_wallet" && body.id) {
    await db
      .delete(wallets)
      .where(
        and(eq(wallets.id, body.id), eq(wallets.userId, session.user.id))
      );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
