// G50 PDF export — produces a document that mirrors the official
// "Série G n°50 (2025)" layout: header, identification, section A
// (imposable lines), section B (déductions), and the recap block.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { G50Input, G50Result } from "@/lib/engines/tva";

export interface G50CompanyInfo {
  raisonSociale: string;
  nif: string;
  activite: string;
  adresse: string;
  articleImposition?: string;
  codeActivite?: string;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);
}

function periodLabel(p: G50Input["period"]): string {
  if (p.kind === "monthly" && p.month) {
    return `${MONTHS_FR[p.month - 1]} ${p.year}`;
  }
  if (p.kind === "quarterly" && p.quarter) {
    return `${p.quarter}ᵉ trimestre ${p.year}`;
  }
  return String(p.year);
}

export function buildG50Pdf(
  company: G50CompanyInfo,
  input: G50Input,
  result: G50Result,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // ============ Header ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("REPUBLIQUE ALGERIENNE DEMOCRATIQUE ET POPULAIRE", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(9);
  doc.text("DIRECTION GENERALE DES IMPOTS", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text("DÉCLARATION G n°50", pageWidth / 2, 28, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Impôts et taxes perçus au comptant ou par voie de retenue à la source",
    pageWidth / 2, 33, { align: "center" },
  );
  doc.text(
    "(Déclaration tenant lieu de bordereau-avis de versement)",
    pageWidth / 2, 37, { align: "center" },
  );

  // ============ Identification ============
  let y = 44;
  doc.setDrawColor(120);
  doc.rect(margin, y, pageWidth - margin * 2, 28);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Période :", margin + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(periodLabel(input.period), margin + 22, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("NIF :", margin + 90, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(company.nif || "—", margin + 102, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("Raison sociale :", margin + 2, y + 11);
  doc.setFont("helvetica", "normal");
  doc.text(company.raisonSociale || "—", margin + 36, y + 11);

  doc.setFont("helvetica", "bold");
  doc.text("Activité :", margin + 2, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(company.activite || "—", margin + 22, y + 17);

  if (company.codeActivite) {
    doc.setFont("helvetica", "bold");
    doc.text("Code activité :", margin + 110, y + 17);
    doc.setFont("helvetica", "normal");
    doc.text(company.codeActivite, margin + 140, y + 17);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Adresse :", margin + 2, y + 23);
  doc.setFont("helvetica", "normal");
  doc.text(company.adresse || "—", margin + 22, y + 23, { maxWidth: pageWidth - margin - 40 });

  y += 32;

  // ============ Section 11 / A — Chiffres d'affaires imposables ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("11 — TAXE SUR LA VALEUR AJOUTÉE", margin, y);
  y += 1;
  doc.setFontSize(8);
  doc.text("A/ Chiffres d'affaires imposables", margin, y + 4);
  y += 6;

  const rows = result.lines.map((l) => [
    l.code,
    l.label,
    fmt(l.caHT),
    l.rate === 0 ? "Exonéré" : `${(l.rate * 100).toFixed(0)}%`,
    fmt(l.tva),
  ]);
  if (rows.length === 0) {
    rows.push(["—", "Aucune opération saisie", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Code", "Désignation", "CA imposable (HT)", "Taux", "TVA (DA)"]],
    body: rows,
    foot: [
      [
        { content: "Sous-total CA imposable", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmt(result.totalCAImposable), styles: { fontStyle: "bold" } },
        "",
        { content: fmt(result.totalDroitsDus), styles: { fontStyle: "bold" } },
      ],
    ],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [38, 109, 109], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "center", cellWidth: 16 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  // Position after the table
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  if (result.totalCAExonere > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Chiffre d'affaires exonéré (Art. 9 CTCA) : ${fmt(result.totalCAExonere)} DA`,
      margin, y,
    );
    y += 5;
  }

  // ============ Section 11 / B — Déductions ============
  if (y > 230) { doc.addPage(); y = 15; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("B/ Déductions à opérer", margin, y);
  y += 2;

  const d = input.deductions;
  autoTable(doc, {
    startY: y,
    head: [["Code", "Désignation", "Montant (DA)"]],
    body: [
      ["E3B90", "Précompte antérieur", fmt(d.precompteAnterieur)],
      ["E3B91", "TVA sur achats de biens, matières et services (art. 29 CTCA)", fmt(d.tvaAchatsBiensServices)],
      ["E3B92", "TVA sur achat de biens (art. 38 CTCA)", fmt(d.tvaAchatsBiens)],
      ["E3B93", "Régularisation du prorata — déduction complémentaire (art. 40)", fmt(d.proRataDeductionComplementaire)],
      ["E3B94", "TVA à récupérer sur factures annulées/impayées (art. 18)", fmt(d.tvaFacturesAnnulees)],
      ["E3B95", "Autres déductions (notification de précompte, etc.)", fmt(d.autresDeductions)],
    ],
    foot: [[
      { content: "11-3 — Total des déductions à opérer (B)", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      { content: fmt(result.totalDeductions), styles: { fontStyle: "bold" } },
    ]],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [38, 109, 109], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ============ TVA à payer / recap ============
  if (y > 230) { doc.addPage(); y = 15; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TVA à payer", margin, y);
  y += 2;

  const isCredit = result.precompteAReporter > 0;
  const recapHighlight: [number, number, number] = isCredit ? [220, 240, 232] : [232, 245, 245];
  const recapLabel = isCredit
    ? "11 — CRÉDIT DE TVA À REPORTER  (E3B130)"
    : "11 — TOTAL TVA À PAYER  (C/500020)";
  const recapAmount = isCredit ? result.precompteAReporter : result.totalTvaAPayer;

  autoTable(doc, {
    startY: y,
    head: [["Code", "Désignation", "Montant (DA)"]],
    body: [
      ["E3B96", "Total des droits dus", fmt(result.totalDroitsDus)],
      ["E3B97", "Régularisation prorata (+) — déduction excédentaire", fmt(input.regularisationProrataPlus ?? 0)],
      ["E3B98", "Régularisation (régime des acomptes)", fmt(input.regularisationAcomptes ?? 0)],
      ["E3B99", "Reversement de la déduction (art. 38 CTCA)", fmt(input.reversementDeduction ?? 0)],
      ["E3B100", "(+) Total à rappeler (C)", fmt(result.totalRappeler)],
      ["E3B110", "Total des déductions à opérer (B)", fmt(result.totalDeductions)],
      ["E3B120", "TVA à payer au titre du mois (C − B)", fmt(result.tvaAPayer)],
      ["E3B130", "Précompte à reporter sur le mois suivant (B − C)", fmt(result.precompteAReporter)],
      ["E3B140", "TVA auto-liquidée à payer (art. 83 CTCA)", fmt(result.tvaAutoLiquidee)],
    ],
    foot: [[
      { content: recapLabel, colSpan: 2, styles: { halign: "right", fontStyle: "bold", fillColor: recapHighlight } },
      { content: fmt(recapAmount), styles: { fontStyle: "bold", fillColor: recapHighlight } },
    ]],
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [38, 109, 109], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Compliance badge line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(38, 109, 109);
  doc.text("✓ Conforme Loi de Finances 2026 — Art. 28-33 CID", margin, y);
  doc.setTextColor(0);
  y += 4;

  // Footer signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Fait à ............................., le ${new Date().toLocaleDateString("fr-FR")}`, margin, y + 4);
  doc.text("Signature et cachet du contribuable :", pageWidth - margin - 70, y + 4);

  // Page numbering + compliance footer on every page
  const pageCount = doc.getNumberOfPages();
  const today = new Date().toLocaleDateString("fr-FR");
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Document généré par MATAX — Conforme LF 2026 — ${today}`,
      margin, doc.internal.pageSize.getHeight() - 6,
    );
    doc.text(
      `${periodLabel(input.period)} · ${i}/${pageCount}`,
      pageWidth - margin, doc.internal.pageSize.getHeight() - 6, { align: "right" },
    );
    doc.setTextColor(0);
  }

  return doc;
}

export function downloadG50Pdf(
  company: G50CompanyInfo,
  input: G50Input,
  result: G50Result,
) {
  const doc = buildG50Pdf(company, input, result);
  const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 40) || "matax";
  doc.save(`G50_${safe(company.raisonSociale || "matax")}_${periodLabel(input.period).replace(/\s+/g, "_")}.pdf`);
}
