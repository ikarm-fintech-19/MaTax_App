import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { WithholdingLine, WithholdingResult } from "@/lib/engines/withholding";
import { WITHHOLDING_LABELS } from "@/lib/engines/withholding";

type Locale = "fr" | "ar" | "en";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n).replace(/[\u202f\u00a0\s]/g, " ");
}

export function buildWithholdingPdf(lines: WithholdingLine[], result: WithholdingResult, locale: Locale = "fr"): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Retenues à la Source", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.text("Loi de Finances 2026", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  let y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Détail des retenues", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Nature", "Taux", "Assiette (DA)", "Montant retenu (DA)"]],
    body: result.lines.map((l) => [
      WITHHOLDING_LABELS[l.kind][locale],
      `${(l.rate * 100).toFixed(0)}%`,
      fmt(l.base),
      fmt(l.amount),
    ]),
    foot: [
      [
        { content: "TOTAL", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmt(result.totalWithheld), styles: { fontStyle: "bold" } },
      ],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Document généré par MATAX — Conforme LF 2026 — ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    footerY,
  );
  doc.text("Page 1/1", pageWidth - margin, footerY, { align: "right" });

  return doc;
}

export function downloadWithholdingPdf(lines: WithholdingLine[], result: WithholdingResult, locale?: Locale) {
  const doc = buildWithholdingPdf(lines, result, locale);
  doc.save(`Retenues_Source_${new Date().toISOString().slice(0, 10)}.pdf`);
}
