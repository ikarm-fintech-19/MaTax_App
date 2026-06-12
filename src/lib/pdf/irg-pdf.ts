import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { IrgInput, IrgResult } from "@/lib/engines/irg";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n).replace(/[\u202f\u00a0\s]/g, " ");
}

export function buildIrgPdf(input: IrgInput, result: IrgResult): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IRG — Impôt sur le Revenu Global", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.text("Calcul des salaires — Loi de Finances 2026", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  // Input summary
  let y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Paramètres de calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["Salaire brut mensuel", fmt(input.grossMonthly), "DA"],
      ["Autres déductions", fmt(input.otherDeductions ?? 0), "DA"],
      ["CNAS (9%)", fmt(result.cnas), "DA"],
      ["Situation familiale", input.maritalStatus === "married" ? "Marié(e)" : "Célibataire", ""],
      ["Enfants à charge", String(input.children ?? 0), ""],
      ["Handicapé / Retraité", input.isHandicappedOrRetiree ? "Oui" : "Non", ""],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Results
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Résultat du calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["Salaire brut mensuel", fmt(result.grossMonthly), "DA"],
      ["CNAS", fmt(result.cnas), "DA"],
      ["Salaire imposable mensuel", fmt(result.taxableMonthly), "DA"],
      ["Base IRG après abattement", fmt(result.irgBase), "DA"],
      ["Abattement appliqué", fmt(result.abatement), "DA"],
      ["IRG mensuel dû", fmt(result.irgMonthly), "DA"],
      ["Salaire net mensuel", fmt(result.netMonthly), "DA"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Bracket breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Détail par tranche d'imposition", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Tranche annuelle", "Taux", "Montant IRG"]],
    body: result.breakdown.map((b) => [
      `${fmt(b.bracket.from)} → ${b.bracket.to ? fmt(b.bracket.to) : "∞"}`,
      `${(b.bracket.rate * 100).toFixed(0)}%`,
      fmt(b.tax),
    ]),
    foot: [
      [
        { content: "Total IRG mensuel", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmt(result.irgMonthly), styles: { fontStyle: "bold" } },
      ],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: { 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(
    `Document généré par MATAX — Conforme LF 2026 — ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    footerY,
  );
  doc.text(
    `Page 1/1`,
    pageWidth - margin,
    footerY,
    { align: "right" },
  );

  return doc;
}

export function downloadIrgPdf(input: IrgInput, result: IrgResult) {
  const doc = buildIrgPdf(input, result);
  doc.save(`IRG_${new Date().toISOString().slice(0, 10)}.pdf`);
}
