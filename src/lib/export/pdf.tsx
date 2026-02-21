import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { TaxReport, Form8949Line } from "@/lib/tax/types";
import { TAX_DISCLAIMER } from "@/lib/tax/forms";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#6366F1",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#71717A",
  },
  disclaimer: {
    fontSize: 8,
    padding: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#6366F1",
    borderBottomWidth: 1,
    borderBottomColor: "#6366F1",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  label: {
    fontWeight: "bold",
    width: "50%",
  },
  value: {
    textAlign: "right",
    width: "50%",
  },
  positive: {
    color: "#22C55E",
  },
  negative: {
    color: "#EF4444",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6366F1",
    padding: 6,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tableCell: {
    fontSize: 8,
  },
  col1: { width: "30%" },
  col2: { width: "10%" },
  col3: { width: "12%" },
  col4: { width: "12%" },
  col5: { width: "12%" },
  col6: { width: "12%" },
  col7: { width: "12%" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94A3B8",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 4,
  },
  f8949Header: {
    flexDirection: "row",
    backgroundColor: "#06B6D4",
    padding: 4,
    borderRadius: 2,
  },
  f8949HeaderText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 7,
  },
  f8949Row: {
    flexDirection: "row",
    padding: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    fontSize: 7,
  },
  f8949PartTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    color: "#6366F1",
  },
  fcol1: { width: "28%" },
  fcol2: { width: "10%" },
  fcol3: { width: "10%" },
  fcol4: { width: "13%" },
  fcol5: { width: "13%" },
  fcol6: { width: "13%" },
  fcol7: { width: "13%" },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function ValueRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const formatted =
    typeof value === "number" ? formatCurrency(value) : value;
  const isNeg = typeof value === "number" && value < 0;
  const isPos = typeof value === "number" && value > 0;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          isNeg ? styles.negative : isPos ? styles.positive : {},
        ]}
      >
        {formatted}
      </Text>
    </View>
  );
}

function Form8949Section({ title, lines }: { title: string; lines: Form8949Line[] }) {
  if (lines.length === 0) return null;

  const colWidths = [styles.fcol1, styles.fcol2, styles.fcol3, styles.fcol4, styles.fcol5, styles.fcol6, styles.fcol7];
  const headers = ["(a) Description", "(b) Acquired", "(c) Sold", "(d) Proceeds", "(e) Cost Basis", "(g) Adjust.", "(h) Gain/Loss"];

  return (
    <View>
      <Text style={styles.f8949PartTitle}>{title}</Text>
      <View style={styles.f8949Header}>
        {headers.map((h, i) => (
          <Text key={i} style={[styles.f8949HeaderText, colWidths[i]]}>
            {h}
          </Text>
        ))}
      </View>
      {lines.map((line, idx) => (
        <View key={idx} style={styles.f8949Row}>
          <Text style={colWidths[0]}>{line.description.slice(0, 40)}</Text>
          <Text style={colWidths[1]}>{format(line.dateAcquired, "MM/dd/yy")}</Text>
          <Text style={colWidths[2]}>{format(line.dateSold, "MM/dd/yy")}</Text>
          <Text style={[colWidths[3], { textAlign: "right" }]}>{formatCurrency(line.proceeds)}</Text>
          <Text style={[colWidths[4], { textAlign: "right" }]}>{formatCurrency(line.costBasis)}</Text>
          <Text style={[colWidths[5], { textAlign: "right" }]}>{formatCurrency(line.adjustments)}</Text>
          <Text style={[colWidths[6], { textAlign: "right" }, line.gainLoss < 0 ? styles.negative : line.gainLoss > 0 ? styles.positive : {}]}>
            {formatCurrency(line.gainLoss)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TaxReportPDF({ report }: { report: TaxReport }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>PolyTax Tracker</Text>
        <Text style={styles.subtitle}>
          Tax Report {report.taxYear} -{" "}
          {format(report.generatedAt, "MMMM d, yyyy")}
        </Text>

        <Text style={styles.disclaimer}>{TAX_DISCLAIMER}</Text>

        <Text style={styles.sectionTitle}>Overview</Text>
        <ValueRow
          label="Tax Treatment"
          value={report.treatment.replace("_", " ").toUpperCase()}
        />
        <ValueRow
          label="Cost Basis Method"
          value={report.costBasisMethod.toUpperCase()}
        />
        <ValueRow label="Total Transactions" value={String(report.totalTransactions)} />
        <ValueRow label="Total Volume" value={report.totalVolume} />
        <ValueRow label="Total Fees" value={report.totalFees} />
        <ValueRow
          label="Win Rate"
          value={`${(report.winRate * 100).toFixed(1)}%`}
        />

        {report.capitalGains && (
          <>
            <Text style={styles.sectionTitle}>
              Capital Gains (Schedule D)
            </Text>
            <ValueRow
              label="Short-Term Net"
              value={report.capitalGains.shortTermNet}
            />
            <ValueRow
              label="Long-Term Net"
              value={report.capitalGains.longTermNet}
            />
            <ValueRow
              label="Total Net"
              value={report.capitalGains.totalNet}
            />
            <ValueRow
              label="Capital Loss Deduction"
              value={-report.capitalGains.capitalLossDeduction}
            />
            <ValueRow
              label="Carryforward"
              value={report.capitalGains.carryforwardLoss}
            />
          </>
        )}

        {report.gambling && (
          <>
            <Text style={styles.sectionTitle}>Gambling Income</Text>
            <ValueRow
              label="Gross Winnings"
              value={report.gambling.grossWinnings}
            />
            <ValueRow
              label="Deductible Losses (90%)"
              value={-report.gambling.deductibleLosses}
            />
            <ValueRow
              label="Net Gambling Income"
              value={report.gambling.netGamblingIncome}
            />
          </>
        )}

        {report.business && (
          <>
            <Text style={styles.sectionTitle}>
              Business Income (Schedule C)
            </Text>
            <ValueRow
              label="Gross Income"
              value={report.business.grossIncome}
            />
            <ValueRow
              label="Total Expenses"
              value={-report.business.totalExpenses}
            />
            <ValueRow
              label="Net Business Income"
              value={report.business.netBusinessIncome}
            />
            <ValueRow
              label="Self-Employment Tax"
              value={-report.business.selfEmploymentTax}
            />
          </>
        )}

        {/* Footer on summary page */}
        <View style={styles.footer} fixed>
          <Text>PolyTax Tracker</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Dispositions page */}
      {report.dispositions.length > 0 && (
        <Page size="LETTER" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Disposition Details</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Market</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Outcome</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>
              Cost Basis
            </Text>
            <Text style={[styles.tableHeaderText, styles.col5]}>
              Proceeds
            </Text>
            <Text style={[styles.tableHeaderText, styles.col6]}>
              Gain/Loss
            </Text>
            <Text style={[styles.tableHeaderText, styles.col7]}>Period</Text>
          </View>
          {report.dispositions.slice(0, 50).map((d, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>
                {d.marketTitle.slice(0, 40)}
              </Text>
              <Text style={[styles.tableCell, styles.col2]}>{d.outcome}</Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {d.quantity.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {formatCurrency(d.totalCostBasis)}
              </Text>
              <Text style={[styles.tableCell, styles.col5]}>
                {formatCurrency(d.totalProceeds)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.col6,
                  d.gainLoss < 0 ? styles.negative : styles.positive,
                ]}
              >
                {formatCurrency(d.gainLoss)}
              </Text>
              <Text style={[styles.tableCell, styles.col7]}>
                {d.holdingPeriod}
              </Text>
            </View>
          ))}
          <View style={styles.footer} fixed>
            <Text>PolyTax Tracker</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}

      {/* Form 8949 page (capital gains only) */}
      {report.form8949Lines && report.form8949Lines.length > 0 && (
        <Page size="LETTER" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>
            Form 8949 - Sales and Other Dispositions of Capital Assets
          </Text>
          <Form8949Section
            title="Part I: Short-Term (Box B - basis NOT reported to IRS)"
            lines={report.form8949Lines.filter((l) => l.holdingPeriod === "short-term")}
          />
          <Form8949Section
            title="Part II: Long-Term (Box E - basis NOT reported to IRS)"
            lines={report.form8949Lines.filter((l) => l.holdingPeriod === "long-term")}
          />
          <View style={styles.footer} fixed>
            <Text>PolyTax Tracker</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  );
}

export async function generatePdfReport(
  report: TaxReport
): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<TaxReportPDF report={report} />));
}
