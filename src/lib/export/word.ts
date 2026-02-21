import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from "docx";
import type { TaxReport, Form8949Line } from "@/lib/tax/types";
import { TAX_DISCLAIMER } from "@/lib/tax/forms";
import { format } from "date-fns";

export async function generateWordReport(
  report: TaxReport
): Promise<Buffer> {
  const sections = [
    // Title page
    new Paragraph({
      text: "PolyTax Tracker",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Tax Report - ${report.taxYear}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Generated: ${format(report.generatedAt, "MMMM d, yyyy")}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({ text: "" }),

    // Disclaimer
    new Paragraph({
      text: "IMPORTANT DISCLAIMER",
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: TAX_DISCLAIMER,
          italics: true,
        }),
      ],
      spacing: { after: 300 },
    }),

    // Overview
    new Paragraph({
      text: "Report Overview",
      heading: HeadingLevel.HEADING_2,
    }),
    createKeyValueTable([
      ["Tax Treatment", report.treatment.replace("_", " ").toUpperCase()],
      ["Cost Basis Method", report.costBasisMethod.toUpperCase()],
      ["Tax Year", String(report.taxYear)],
      ["Total Transactions", String(report.totalTransactions)],
      ["Total Volume", formatCurrency(report.totalVolume)],
      ["Total Fees", formatCurrency(report.totalFees)],
      ["Win Rate", `${(report.winRate * 100).toFixed(1)}%`],
      ["Open Positions", String(report.openPositionsCount)],
    ]),
    new Paragraph({ text: "" }),
  ];

  // Treatment-specific sections
  if (report.capitalGains) {
    const cg = report.capitalGains;
    sections.push(
      new Paragraph({
        text: "Capital Gains Summary (Schedule D)",
        heading: HeadingLevel.HEADING_2,
      }),
      createKeyValueTable([
        ["Short-Term Net", formatCurrency(cg.shortTermNet)],
        ["Long-Term Net", formatCurrency(cg.longTermNet)],
        ["Total Net Capital Gain/Loss", formatCurrency(cg.totalNet)],
        ["Capital Loss Deduction", formatCurrency(-cg.capitalLossDeduction)],
        ["Loss Carryforward", formatCurrency(cg.carryforwardLoss)],
      ]),
      new Paragraph({ text: "" })
    );
  }

  if (report.gambling) {
    const g = report.gambling;
    sections.push(
      new Paragraph({
        text: "Gambling Income Summary",
        heading: HeadingLevel.HEADING_2,
      }),
      createKeyValueTable([
        ["Gross Winnings", formatCurrency(g.grossWinnings)],
        ["Total Losses", formatCurrency(-g.totalLosses)],
        ["Deductible Losses (90%)", formatCurrency(-g.deductibleLosses)],
        ["Net Gambling Income", formatCurrency(g.netGamblingIncome)],
      ]),
      new Paragraph({ text: "" })
    );
  }

  if (report.business) {
    const b = report.business;
    sections.push(
      new Paragraph({
        text: "Business Income Summary (Schedule C)",
        heading: HeadingLevel.HEADING_2,
      }),
      createKeyValueTable([
        ["Gross Income", formatCurrency(b.grossIncome)],
        ["Total Expenses", formatCurrency(-b.totalExpenses)],
        ["Net Business Income", formatCurrency(b.netBusinessIncome)],
        ["Self-Employment Tax", formatCurrency(-b.selfEmploymentTax)],
      ]),
      new Paragraph({ text: "" })
    );
  }

  // Dispositions
  if (report.dispositions.length > 0) {
    sections.push(
      new Paragraph({
        text: "Disposition Details",
        heading: HeadingLevel.HEADING_2,
      })
    );

    const headerRow = new TableRow({
      children: ["Market", "Qty", "Cost Basis", "Proceeds", "Gain/Loss", "Period"].map(
        (text) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text, bold: true, size: 18 })],
              }),
            ],
            width: { size: text === "Market" ? 35 : 13, type: WidthType.PERCENTAGE },
          })
      ),
    });

    const dataRows = report.dispositions.slice(0, 100).map(
      (d) =>
        new TableRow({
          children: [
            d.marketTitle.slice(0, 50),
            String(d.quantity),
            formatCurrency(d.totalCostBasis),
            formatCurrency(d.totalProceeds),
            formatCurrency(d.gainLoss),
            d.holdingPeriod,
          ].map(
            (text) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text, size: 16 })],
                  }),
                ],
              })
          ),
        })
    );

    sections.push(
      new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  // Form 8949 section (capital gains only)
  if (report.form8949Lines && report.form8949Lines.length > 0) {
    sections.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "Form 8949 - Sales and Other Dispositions of Capital Assets",
        heading: HeadingLevel.HEADING_2,
      })
    );

    const shortTerm = report.form8949Lines.filter((l) => l.holdingPeriod === "short-term");
    const longTerm = report.form8949Lines.filter((l) => l.holdingPeriod === "long-term");

    if (shortTerm.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Part I: Short-Term (Box B)", bold: true, italics: true }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        createForm8949Table(shortTerm)
      );
    }

    if (longTerm.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Part II: Long-Term (Box E)", bold: true, italics: true }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        createForm8949Table(longTerm)
      );
    }
  }

  // CPA Letter Template
  sections.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      text: "CPA Letter Template",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Dear [CPA Name]," }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `I am writing to provide documentation of my prediction market trading activity on Polymarket for the ${report.taxYear} tax year. This report was generated by PolyTax Tracker and includes all recorded transactions, dispositions, and calculated tax obligations.`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `The report uses the "${report.treatment.replace("_", " ")}" tax treatment with the ${report.costBasisMethod.toUpperCase()} cost basis method. Please review the attached data and advise on the appropriate filing approach.`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Key points for your review:",
          bold: true,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `- Total dispositions: ${report.dispositions.length}`,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `- Total volume: ${formatCurrency(report.totalVolume)}`,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `- Total fees: ${formatCurrency(report.totalFees)}`,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "- Polymarket does not issue 1099 forms; all income must be self-reported",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "- Polymarket operates through a non-US entity; FBAR/FATCA obligations may apply",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Please do not hesitate to reach out if you need additional information or clarification.",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Sincerely," })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "[Your Name]" })],
      spacing: { after: 400 },
    }),

    // Final disclaimer
    new Paragraph({
      text: "Disclaimer",
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: TAX_DISCLAIMER,
          italics: true,
          size: 18,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ children: sections }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function createForm8949Table(lines: Form8949Line[]): Table {
  const headers = ["(a) Description", "(b) Acquired", "(c) Sold", "(d) Proceeds", "(e) Cost Basis", "(g) Adjust.", "(h) Gain/Loss"];
  const headerRow = new TableRow({
    children: headers.map((text, i) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 16 })],
          }),
        ],
        width: { size: i === 0 ? 28 : 12, type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = lines.map(
    (line) =>
      new TableRow({
        children: [
          line.description.slice(0, 50),
          format(line.dateAcquired, "MM/dd/yyyy"),
          format(line.dateSold, "MM/dd/yyyy"),
          formatCurrency(line.proceeds),
          formatCurrency(line.costBasis),
          formatCurrency(line.adjustments),
          formatCurrency(line.gainLoss),
        ].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, size: 16 })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function createKeyValueTable(data: [string, string][]): Table {
  const rows = data.map(
    ([key, value]) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: key, bold: true, size: 20 })],
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: value, size: 20 })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        ],
      })
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
