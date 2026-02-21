import { tool } from "ai";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
  transactions,
  taxLots,
  wallets,
  userSettings,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export function createAgentTools(userId: string) {
  return {
    get_tax_summary: tool({
      description:
        "Get the user's tax summary for a given year, including total trades, gains, losses, and estimated tax liability under each treatment mode.",
      inputSchema: z.object({
        taxYear: z
          .number()
          .optional()
          .describe("The tax year to summarize. Defaults to current year."),
      }),
      execute: async ({ taxYear }: { taxYear?: number }) => {
        const year = taxYear ?? new Date().getFullYear();

        const [txRows, lotRows, settingsRows] = await Promise.all([
          db
            .select({
              count: sql<number>`count(*)`,
              totalVolume: sql<number>`coalesce(sum(${transactions.totalAmount}::numeric), 0)`,
              totalFees: sql<number>`coalesce(sum(${transactions.fee}::numeric), 0)`,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, userId),
                sql`extract(year from ${transactions.timestamp}) = ${year}`
              )
            ),
          db
            .select({
              totalGains: sql<number>`coalesce(sum(case when ${taxLots.gainLoss}::numeric > 0 then ${taxLots.gainLoss}::numeric else 0 end), 0)`,
              totalLosses: sql<number>`coalesce(sum(case when ${taxLots.gainLoss}::numeric < 0 then abs(${taxLots.gainLoss}::numeric) else 0 end), 0)`,
              closedCount: sql<number>`count(case when ${taxLots.isOpen} = false then 1 end)`,
              openCount: sql<number>`count(case when ${taxLots.isOpen} = true then 1 end)`,
            })
            .from(taxLots)
            .where(eq(taxLots.userId, userId)),
          db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1),
        ]);

        const tx = txRows[0];
        const lots = lotRows[0];
        const settings = settingsRows[0];

        return {
          taxYear: year,
          totalTrades: Number(tx?.count ?? 0),
          totalVolume: Number(tx?.totalVolume ?? 0),
          totalFees: Number(tx?.totalFees ?? 0),
          totalGains: Number(lots?.totalGains ?? 0),
          totalLosses: Number(lots?.totalLosses ?? 0),
          netGainLoss:
            Number(lots?.totalGains ?? 0) - Number(lots?.totalLosses ?? 0),
          openPositions: Number(lots?.openCount ?? 0),
          closedPositions: Number(lots?.closedCount ?? 0),
          currentTreatment:
            settings?.defaultTaxTreatment ?? "capital_gains",
          currentCostBasis: settings?.defaultCostBasis ?? "fifo",
        };
      },
    }),

    analyze_trade: tool({
      description:
        "Look up a specific trade or recent trades by market name and explain the tax implications.",
      inputSchema: z.object({
        marketTitle: z
          .string()
          .describe("Part of the market title to search for"),
        limit: z
          .number()
          .optional()
          .describe("Max trades to return. Defaults to 5."),
      }),
      execute: async ({ marketTitle, limit }: { marketTitle: string; limit?: number }) => {
        const maxResults = limit ?? 5;
        const rows = await db
          .select({
            id: transactions.id,
            marketTitle: transactions.marketTitle,
            outcome: transactions.outcome,
            type: transactions.type,
            quantity: transactions.quantity,
            pricePerShare: transactions.pricePerShare,
            totalAmount: transactions.totalAmount,
            fee: transactions.fee,
            timestamp: transactions.timestamp,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              sql`${transactions.marketTitle} ilike ${"%" + marketTitle + "%"}`
            )
          )
          .orderBy(sql`${transactions.timestamp} desc`)
          .limit(maxResults);

        return {
          trades: rows.map((r) => ({
            ...r,
            quantity: Number(r.quantity),
            pricePerShare: Number(r.pricePerShare),
            totalAmount: Number(r.totalAmount),
            fee: Number(r.fee),
          })),
          count: rows.length,
        };
      },
    }),

    suggest_optimizations: tool({
      description:
        "Analyze the user's open positions and suggest tax-loss harvesting opportunities or other optimizations.",
      inputSchema: z.object({
        taxYear: z.number().optional(),
      }),
      execute: async ({ taxYear }: { taxYear?: number }) => {
        const year = taxYear ?? new Date().getFullYear();

        const openLots = await db
          .select({
            marketId: taxLots.marketId,
            outcome: taxLots.outcome,
            quantity: taxLots.quantity,
            costBasisPerShare: taxLots.costBasisPerShare,
            acquiredAt: taxLots.acquiredAt,
          })
          .from(taxLots)
          .where(
            and(eq(taxLots.userId, userId), eq(taxLots.isOpen, true))
          )
          .limit(50);

        const suggestions: string[] = [];

        for (const lot of openLots) {
          const costBasis = Number(lot.costBasisPerShare);
          if (costBasis > 0.7) {
            suggestions.push(
              `Position in market ${lot.marketId} (${lot.outcome}) has high cost basis ($${costBasis.toFixed(2)}/share). Consider selling before year-end if the position has declined to realize a loss.`
            );
          }
        }

        if (openLots.length === 0) {
          suggestions.push(
            "No open positions found. Tax-loss harvesting requires open positions with unrealized losses."
          );
        }

        return {
          taxYear: year,
          openPositionCount: openLots.length,
          suggestions,
        };
      },
    }),

    compare_treatments: tool({
      description:
        "Compare the user's estimated tax liability under all three treatment modes (Capital Gains, Gambling Income, Business Income).",
      inputSchema: z.object({
        taxYear: z.number().optional(),
      }),
      execute: async ({ taxYear }: { taxYear?: number }) => {
        const year = taxYear ?? new Date().getFullYear();

        const lotRows = await db
          .select({
            gainLoss: taxLots.gainLoss,
            holdingPeriod: taxLots.holdingPeriod,
            isOpen: taxLots.isOpen,
          })
          .from(taxLots)
          .where(
            and(eq(taxLots.userId, userId), eq(taxLots.isOpen, false))
          );

        let shortTermGains = 0;
        let shortTermLosses = 0;
        let longTermGains = 0;
        let longTermLosses = 0;

        for (const lot of lotRows) {
          const gl = Number(lot.gainLoss ?? 0);
          if (lot.holdingPeriod === "short-term") {
            if (gl >= 0) shortTermGains += gl;
            else shortTermLosses += Math.abs(gl);
          } else {
            if (gl >= 0) longTermGains += gl;
            else longTermLosses += Math.abs(gl);
          }
        }

        const netST = shortTermGains - shortTermLosses;
        const netLT = longTermGains - longTermLosses;
        const totalNet = netST + netLT;
        const grossWinnings = shortTermGains + longTermGains;
        const totalLosses = shortTermLosses + longTermLosses;

        // Capital gains
        const cgTax =
          totalNet < 0
            ? -(Math.min(Math.abs(totalNet), 3000) * 0.37)
            : Math.max(0, netST) * 0.37 + Math.max(0, netLT) * 0.2;

        // Gambling
        const deductible = Math.min(totalLosses, grossWinnings) * 0.9;
        const gamblingTax = Math.max(0, grossWinnings - deductible) * 0.37;

        // Business
        const businessNet = grossWinnings - totalLosses;
        const seTax =
          businessNet > 0 ? businessNet * 0.9235 * 0.153 : 0;
        const businessTax =
          Math.max(0, businessNet) * 0.37 + seTax;

        return {
          taxYear: year,
          capitalGains: {
            netGainLoss: totalNet,
            estimatedTax: Math.round(cgTax * 100) / 100,
            lossCarryforward:
              totalNet < 0
                ? Math.max(0, Math.abs(totalNet) - 3000)
                : 0,
          },
          gambling: {
            grossWinnings,
            deductibleLosses: Math.round(deductible * 100) / 100,
            estimatedTax: Math.round(gamblingTax * 100) / 100,
            note: "2026: Only 90% of gambling losses deductible (One Big Beautiful Bill Act)",
          },
          business: {
            netIncome: businessNet,
            selfEmploymentTax: Math.round(seTax * 100) / 100,
            estimatedTax: Math.round(businessTax * 100) / 100,
            note: "Includes 15.3% SE tax on 92.35% of net income",
          },
          recommendation:
            cgTax <= gamblingTax && cgTax <= businessTax
              ? "capital_gains"
              : gamblingTax <= businessTax
                ? "gambling"
                : "business",
        };
      },
    }),

    get_open_positions: tool({
      description:
        "List the user's currently open positions with unrealized P&L data.",
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .describe("Max positions to return. Defaults to 20."),
      }),
      execute: async ({ limit }: { limit?: number }) => {
        const maxResults = limit ?? 20;

        const positions = await db
          .select({
            marketId: taxLots.marketId,
            outcome: taxLots.outcome,
            quantity: taxLots.quantity,
            costBasisPerShare: taxLots.costBasisPerShare,
            acquiredAt: taxLots.acquiredAt,
          })
          .from(taxLots)
          .where(
            and(eq(taxLots.userId, userId), eq(taxLots.isOpen, true))
          )
          .limit(maxResults);

        const walletList = await db
          .select({
            address: wallets.address,
            label: wallets.label,
          })
          .from(wallets)
          .where(eq(wallets.userId, userId));

        return {
          positions: positions.map((p) => ({
            marketId: p.marketId,
            outcome: p.outcome,
            quantity: Number(p.quantity),
            costBasisPerShare: Number(p.costBasisPerShare),
            totalCostBasis:
              Number(p.quantity) * Number(p.costBasisPerShare),
            acquiredAt: p.acquiredAt,
          })),
          totalPositions: positions.length,
          connectedWallets: walletList.length,
        };
      },
    }),
  };
}
