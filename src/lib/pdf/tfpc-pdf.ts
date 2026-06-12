import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { TfpcInput, TfpcResult } from "@/lib/engines/tfpc";

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n).replace(/[\u202f\u00a0\s]/g, " ");
}

export function buildTfpcPdf(input: TfpcInput, result: TfpcResult): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TFPC & TA — Taxes de Formation et d'Apprentissage", pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(8);
  doc.text("Loi de Finances 2026 — Art. 196 bis à sexies CIDTA", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  let y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Paramètres de calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    body: [
      ["Période", `S${input.semester} ${input.year}`, ""],
      ["Masse salariale brute semestrielle", fmt(input.grossPayroll), "DA"],
      ["Effectif", String(input.employeeCount), "salariés"],
      ["Dépenses de formation", fmt(input.trainingExpenses), "DA"],
      ["Dépenses d'apprentissage", fmt(input.apprenticeshipExpenses), "DA"],
      ["Assujetti", result.isSubjectToTax ? "Oui (≥ 20 salariés)" : "Non (< 20 salariés)", ""],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  if (!result.isSubjectToTax) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Non assujetti — effectif inférieur à 20 salariés", margin, y);
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Document généré par MATAX — ${new Date().toLocaleDateString("fr-FR")}`, margin, footerY);
    doc.text("Page 1/1", pageWidth - margin, footerY, { align: "right" });
    return doc;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Résultat du calcul", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Rubrique", "Montant (DA)"]],
    body: [
      ["TFPC — Assiette (1% masse salariale)", fmt(result.tfpcTarget)],
      ["Dépenses de formation éligibles", fmt(result.trainingExpenses)],
      ["TFPC due", fmt(result.tfpcDue)],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: y,
    head: [["Rubrique", "Montant (DA)"]],
    body: [
      ["TA — Assiette (1% masse salariale)", fmt(result.taTarget)],
      ["Dépenses d'apprentissage éligibles", fmt(result.apprenticeshipExpenses)],
      ["Report excédent formation", fmt(result.apprenticeshipOffsetApplied)],
      ["TA due", fmt(result.taDue)],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    body: [
      [
        { content: "TOTAL GÉNÉRAL À PAYER", styles: { fontStyle: "bold", fontSize: 11 } },
        { content: `${fmt(result.totalDue)} DA`, styles: { fontStyle: "bold", fontSize: 11, halign: "right" } },
      ],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin },
  });

  if (result.trainingSurplus > 0) {
    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Excédent de dépenses de formation disponible : ${fmt(result.trainingSurplus)} DA`, margin, y);
  }

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

export function downloadTfpcPdf(input: TfpcInput, result: TfpcResult) {
  const doc = buildTfpcPdf(input, result);
  doc.save(`TFPC_${input.year}_S${input.semester}.pdf`);
}
