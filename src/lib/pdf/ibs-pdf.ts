import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { IbsInput, IbsResult, IbsActivity } from "@/lib/engines/ibs";
import { IBS_ACTIVITY_LABELS } from "@/lib/engines/ibs";

type Locale = "fr" | "ar" | "en";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n).replace(/[\u202f\u00a0\s]/g, " ");
}

export function buildIbsPdf(input: IbsInput, result: IbsResult, locale: string = "fr"): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IBS — Impôt sur les Bénéfices des Sociétés", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.text("Loi de Finances 2026", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  const activityLabel = IBS_ACTIVITY_LABELS[input.activity as IbsActivity][locale as Locale] ?? input.activity;

  let y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Paramètres de calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["Activité", activityLabel ?? input.activity, ""],
      ["Taux d'imposition", `${(result.rate * 100).toFixed(0)}%`, ""],
      ["Bénéfice imposable", fmt(input.taxableProfit), "DA"],
      ["Crédits d'impôt / acomptes", fmt(input.creditsAlreadyPaid ?? 0), "DA"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  const credits = Math.max(0, input.creditsAlreadyPaid ?? 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Résultat du calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["Bénéfice imposable", fmt(result.taxableProfit), "DA"],
      ["IBS brut", fmt(result.ibs), "DA"],
      ["Minimum de perception", fmt(result.minimumDue), "DA"],
      ["Crédits / acomptes déduits", fmt(credits), "DA"],
      ["IBS net dû", fmt(result.netDue), "DA"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Acomptes provisionnels", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["1er acompte (20 mars)", fmt(result.installments.first), "DA"],
      ["2e acompte (20 juin)", fmt(result.installments.second), "DA"],
      ["3e acompte (20 novembre)", fmt(result.installments.third), "DA"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
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

export function downloadIbsPdf(input: IbsInput, result: IbsResult, locale?: string) {
  const doc = buildIbsPdf(input, result, locale);
  doc.save(`IBS_${new Date().toISOString().slice(0, 10)}.pdf`);
}
