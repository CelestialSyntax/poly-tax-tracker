import ExcelJS from "exceljs";
import type {
  TaxReport,
  Form8949Line,
} from "@/lib/tax/types";
import { TAX_DISCLAIMER } from "@/lib/tax/forms";
import { format } from "date-fns";

export async function generateExcelReport(
  report: TaxReport
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PolyTax Tracker";
  workbook.created = new Date();

  // Summary sheet
  addSummarySheet(workbook, report);

  // Transactions sheet
  addTransactionsSheet(workbook, report);

  // Form 8949 sheet (capital gains only)
  if (report.treatment === "capital_gains" && report.form8949Lines) {
    addForm8949Sheet(workbook, report.form8949Lines);
  }

  // Schedule D sheet (capital gains only)
  if (report.capitalGains) {
    addScheduleDSheet(workbook, report);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addSummarySheet(workbook: ExcelJS.Workbook, report: TaxReport) {
  const sheet = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: "6366F1" } },
  });

  // Title
  sheet.mergeCells("A1:D1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `PolyTax Tracker - Tax Report ${report.taxYear}`;
  titleCell.font = { bold: true, size: 16, color: { argb: "6366F1" } };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells("A2:D2");
  sheet.getCell("A2").value = `Generated: ${format(report.generatedAt, "MMMM d, yyyy")}`;
  sheet.getCell("A2").alignment = { horizontal: "center" };

  // Overview section
  let row = 4;
  const addSection = (title: string, data: [string, string | number][]) => {
    const headerCell = sheet.getCell(`A${row}`);
    headerCell.value = title;
    headerCell.font = { bold: true, size: 12, color: { argb: "FFFFFF" } };
    headerCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "6366F1" },
    };
    sheet.mergeCells(`A${row}:D${row}`);
    row++;

    for (const [label, value] of data) {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`A${row}`).font = { bold: true };
      const valCell = sheet.getCell(`B${row}`);
      valCell.value = typeof value === "number" ? value : value;
      if (typeof value === "number") {
        valCell.numFmt = "$#,##0.00";
        if (value < 0) valCell.font = { color: { argb: "EF4444" } };
        else if (value > 0) valCell.font = { color: { argb: "22C55E" } };
      }
      row++;
    }
    row++;
  };

  addSection("Overview", [
    ["Tax Treatment", report.treatment.replace("_", " ").toUpperCase()],
    ["Cost Basis Method", report.costBasisMethod.toUpperCase()],
    ["Total Transactions", report.totalTransactions],
    ["Total Volume", report.totalVolume],
    ["Total Fees", report.totalFees],
    ["Win Rate", `${(report.winRate * 100).toFixed(1)}%`],
    ["Open Positions", report.openPositionsCount],
  ]);

  if (report.capitalGains) {
    const cg = report.capitalGains;
    addSection("Capital Gains Summary (Schedule D)", [
      ["Short-Term Gains", cg.shortTermGains],
      ["Short-Term Losses", -cg.shortTermLosses],
      ["Short-Term Net", cg.shortTermNet],
      ["Long-Term Gains", cg.longTermGains],
      ["Long-Term Losses", -cg.longTermLosses],
      ["Long-Term Net", cg.longTermNet],
      ["Total Net", cg.totalNet],
      ["Capital Loss Deduction", -cg.capitalLossDeduction],
      ["Loss Carryforward", cg.carryforwardLoss],
    ]);
  }

  if (report.gambling) {
    const g = report.gambling;
    addSection("Gambling Income Summary", [
      ["Gross Winnings", g.grossWinnings],
      ["Total Losses", -g.totalLosses],
      ["Deductible Losses (90% limit)", -g.deductibleLosses],
      ["Net Gambling Income", g.netGamblingIncome],
    ]);
  }

  if (report.business) {
    const b = report.business;
    addSection("Business Income Summary (Schedule C)", [
      ["Gross Income", b.grossIncome],
      ["Total Expenses", -b.totalExpenses],
      ["Net Business Income", b.netBusinessIncome],
      ["Self-Employment Tax", -b.selfEmploymentTax],
    ]);
  }

  // Set column widths
  sheet.getColumn("A").width = 30;
  sheet.getColumn("B").width = 18;
  sheet.getColumn("C").width = 18;
  sheet.getColumn("D").width = 18;
}

function addTransactionsSheet(
  workbook: ExcelJS.Workbook,
  report: TaxReport
) {
  const sheet = workbook.addWorksheet("Dispositions", {
    properties: { tabColor: { argb: "8B5CF6" } },
  });

  const headers = [
    "Market",
    "Outcome",
    "Quantity",
    "Cost Basis/Share",
    "Proceeds/Share",
    "Total Cost Basis",
    "Total Proceeds",
    "Gain/Loss",
    "Holding Period",
    "Acquired",
    "Disposed",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "8B5CF6" },
  };

  for (const d of report.dispositions) {
    const row = sheet.addRow([
      d.marketTitle,
      d.outcome,
      d.quantity,
      d.costBasisPerShare,
      d.proceedsPerShare,
      d.totalCostBasis,
      d.totalProceeds,
      d.gainLoss,
      d.holdingPeriod,
      format(d.acquiredAt, "MM/dd/yyyy"),
      format(d.disposedAt, "MM/dd/yyyy"),
    ]);

    // Color gain/loss
    const glCell = row.getCell(8);
    if (d.gainLoss < 0) glCell.font = { color: { argb: "EF4444" } };
    else if (d.gainLoss > 0) glCell.font = { color: { argb: "22C55E" } };
  }

  // Format number columns
  for (let col = 3; col <= 8; col++) {
    sheet.getColumn(col).numFmt = "#,##0.00####";
  }

  sheet.getColumn(1).width = 50;
  sheet.getColumn(2).width = 8;
  sheet.getColumn(9).width = 14;
  sheet.getColumn(10).width = 12;
  sheet.getColumn(11).width = 12;
}

function addForm8949Sheet(
  workbook: ExcelJS.Workbook,
  lines: Form8949Line[]
) {
  const sheet = workbook.addWorksheet("Form 8949", {
    properties: { tabColor: { argb: "06B6D4" } },
  });

  sheet.mergeCells("A1:H1");
  const title = sheet.getCell("A1");
  title.value = "Form 8949 - Sales and Other Dispositions of Capital Assets";
  title.font = { bold: true, size: 14 };

  const headers = [
    "(a) Description",
    "(b) Date Acquired",
    "(c) Date Sold",
    "(d) Proceeds",
    "(e) Cost Basis",
    "(f) Code",
    "(g) Adjustments",
    "(h) Gain or Loss",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E5E7EB" },
  };

  // Part I: Short-Term
  sheet.addRow(["Part I: Short-Term (Box B - basis NOT reported to IRS)"]);
  sheet.getRow(sheet.rowCount).font = { bold: true, italic: true };

  const shortTerm = lines.filter((l) => l.holdingPeriod === "short-term");
  for (const line of shortTerm) {
    sheet.addRow([
      line.description,
      format(line.dateAcquired, "MM/dd/yyyy"),
      format(line.dateSold, "MM/dd/yyyy"),
      line.proceeds,
      line.costBasis,
      "",
      line.adjustments,
      line.gainLoss,
    ]);
  }

  sheet.addRow([]);

  // Part II: Long-Term
  sheet.addRow(["Part II: Long-Term (Box E - basis NOT reported to IRS)"]);
  sheet.getRow(sheet.rowCount).font = { bold: true, italic: true };

  const longTerm = lines.filter((l) => l.holdingPeriod === "long-term");
  for (const line of longTerm) {
    sheet.addRow([
      line.description,
      format(line.dateAcquired, "MM/dd/yyyy"),
      format(line.dateSold, "MM/dd/yyyy"),
      line.proceeds,
      line.costBasis,
      "",
      line.adjustments,
      line.gainLoss,
    ]);
  }

  sheet.getColumn(1).width = 50;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 14;
  for (let col = 4; col <= 8; col++) {
    sheet.getColumn(col).numFmt = "$#,##0.00";
    sheet.getColumn(col).width = 14;
  }
}

function addScheduleDSheet(workbook: ExcelJS.Workbook, report: TaxReport) {
  const cg = report.capitalGains!;
  const sheet = workbook.addWorksheet("Schedule D", {
    properties: { tabColor: { argb: "F59E0B" } },
  });

  sheet.getColumn("A").width = 50;
  sheet.getColumn("B").width = 20;

  sheet.mergeCells("A1:B1");
  const title = sheet.getCell("A1");
  title.value = "Schedule D - Capital Gains and Losses";
  title.font = { bold: true, size: 16 };

  sheet.getCell("A2").value = `Tax Year ${report.taxYear}`;
  sheet.getCell("A2").font = { italic: true };

  const addPart = (
    partTitle: string,
    rows: [string, number][],
    startRow: number
  ) => {
    const hdr = sheet.getRow(startRow);
    hdr.getCell(1).value = partTitle;
    hdr.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFF" } };
    hdr.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F59E0B" },
    };
    sheet.mergeCells(`A${startRow}:B${startRow}`);

    let r = startRow + 1;
    for (const [label, value] of rows) {
      sheet.getCell(`A${r}`).value = label;
      sheet.getCell(`A${r}`).font = { bold: true };
      const valCell = sheet.getCell(`B${r}`);
      valCell.value = value;
      valCell.numFmt = "$#,##0.00";
      if (value < 0) valCell.font = { color: { argb: "EF4444" } };
      else if (value > 0) valCell.font = { color: { argb: "22C55E" } };
      r++;
    }
    return r + 1;
  };

  let nextRow = 4;
  nextRow = addPart(
    "Part I - Short-Term Capital Gains and Losses",
    [
      ["Line 1b: Totals for all short-term from Form 8949", cg.shortTermNet],
      ["Line 7: Net short-term capital gain/(loss)", cg.shortTermNet],
    ],
    nextRow
  );

  nextRow = addPart(
    "Part II - Long-Term Capital Gains and Losses",
    [
      ["Line 8b: Totals for all long-term from Form 8949", cg.longTermNet],
      ["Line 15: Net long-term capital gain/(loss)", cg.longTermNet],
    ],
    nextRow
  );

  addPart(
    "Part III - Summary",
    [
      ["Line 16: Combine lines 7 and 15", cg.totalNet],
      [
        "Line 21: Capital loss deduction (max $3,000)",
        cg.capitalLossDeduction > 0 ? -cg.capitalLossDeduction : 0,
      ],
      ["Loss carryforward to next year", cg.carryforwardLoss],
    ],
    nextRow
  );

  // Disclaimer row at the bottom
  const lastRow = sheet.rowCount + 2;
  sheet.mergeCells(`A${lastRow}:B${lastRow}`);
  sheet.getCell(`A${lastRow}`).value = TAX_DISCLAIMER;
  sheet.getCell(`A${lastRow}`).font = {
    italic: true,
    size: 9,
    color: { argb: "94A3B8" },
  };
  sheet.getRow(lastRow).alignment = { wrapText: true };
}
