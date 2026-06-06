// G50 PDF export — produces a document that mirrors the official
// "Série G n°50 (2025)" layout: header, identification, section A
// (imposable lines), section B (déductions), and the recap block.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { G50Input, G50Result } from "@/lib/engines/tva";
import { calculateIrg } from "@/lib/engines/irg";
import { calculateIbs } from "@/lib/engines/ibs";

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
  if (!Number.isFinite(n)) return "";
  const formatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return formatted.replace(/[\u202f\u00a0\s]/g, " ");
}

function detectFormeJuridique(raisonSociale: string): string {
  if (!raisonSociale) return "";
  const upper = raisonSociale.toUpperCase();
  if (upper.includes("SARL")) return "SARL";
  if (upper.includes("EURL")) return "EURL";
  if (upper.includes("SPA")) return "SPA";
  if (upper.includes("SNC")) return "SNC";
  return "";
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

// Draw a blue bordered box with header
function drawBlueBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  headerText?: string,
) {
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);

  if (headerText) {
    doc.setFillColor(0, 51, 102);
    doc.rect(x, y, width, 6, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(headerText, x + width / 2, y + 4, { align: "center" });
    doc.setTextColor(0);
  }
}

// Draw character boxes for NIF/NIN input
function drawCharBoxes(
  doc: jsPDF,
  x: number,
  y: number,
  count: number,
  value?: string,
) {
  const boxSize = 4;
  const gap = 0.5;
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.3);

  for (let i = 0; i < count; i++) {
    doc.rect(x + i * (boxSize + gap), y, boxSize, boxSize);
    if (value && value[i]) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(value[i], x + i * (boxSize + gap) + 1.2, y + 3);
    }
  }
}

// Draw dotted line for manual entry
function drawDottedLine(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
) {
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.2);
  const dashLength = 1;
  const gapLength = 1;
  let currentX = x;

  while (currentX < x + width) {
    doc.line(currentX, y, currentX + dashLength, y);
    currentX += dashLength + gapLength;
  }
}

export function buildG50Pdf(
  company: G50CompanyInfo,
  input: G50Input,
  result: G50Result,
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Load withholding draft
  let withholdingDraft: any[] = [];
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("matax_withholding_draft");
    if (stored) {
      try { withholdingDraft = JSON.parse(stored); } catch (e) {}
    }
  }

  // Load IRG draft
  let irgDraft: any = null;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("matax_irg_draft");
    if (stored) {
      try { irgDraft = JSON.parse(stored); } catch (e) {}
    }
  }

  // Load IBS draft
  let ibsDraft: any = null;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("matax_ibs_draft");
    if (stored) {
      try { ibsDraft = JSON.parse(stored); } catch (e) {}
    }
  }

  function getWithholdingVal(code: string): { base: number; tax: number } | null {
    const codeToKind: Record<string, string> = {
      "E1M10": "foreign_services",
      "E1M20": "foreign_royalties",
      "E1M30": "foreign_artists",
      "E2M10": "dividends_resident_individual",
      "E2M30": "interest_resident",
      "E2M50": "interest_savings_low",
      "E2M60": "interest_savings_high",
      "E2M70": "dividends_nonresident",
      "E2M80": "capital_gains_resident",
      "E2M90": "capital_gains_nonresident",
      "E1B100": "interest_resident",
      "E1B130": "foreign_royalties",
      "E1B150": "capital_gains_nonresident",
      "E1B170": "foreign_services"
    };
    const kind = codeToKind[code];
    if (!kind) return null;
    const items = withholdingDraft.filter((item) => item.kind === kind);
    if (items.length === 0) return null;
    const totalBase = items.reduce((sum, item) => sum + (Number(item.base) || 0), 0);
    const rates: Record<string, number> = {
      foreign_services: 0.24,
      foreign_royalties: 0.24,
      foreign_artists: 0.15,
      dividends_resident_individual: 0.10,
      interest_resident: 0.10,
      interest_savings_low: 0.01,
      interest_savings_high: 0.10,
      dividends_nonresident: 0.15,
      capital_gains_resident: 0.15,
      capital_gains_nonresident: 0.20
    };
    const rate = rates[kind] || 0;
    return { base: totalBase, tax: totalBase * rate };
  }

  function getWithholdingSectionTotal(codes: string[]): { base: number; tax: number } {
    let base = 0;
    let tax = 0;
    codes.forEach((code) => {
      const val = getWithholdingVal(code);
      if (val) {
        base += val.base;
        tax += val.tax;
      }
    });
    return { base, tax };
  }

  // ============ HEADER SECTION ============
  // Left box - Direction Générale des Impôts
  drawBlueBox(doc, margin, 8, 50, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Direction Générale des Impôts", margin + 25, 13, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text("Service : MaTax", margin + 25, 18, { align: "center" });
  doc.text("(Généré par la plateforme)", margin + 25, 22, { align: "center" });

  // Center box - Main title
  drawBlueBox(doc, margin + 55, 8, 100, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Les impôts et les taxes prélevés à la source", margin + 105, 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text("ou recouvrés par voie de recette", margin + 105, 16, { align: "center" });
  doc.text("Toute déclaration doit être accompagnée du paiement", margin + 105, 20, { align: "center" });
  doc.text("au moyen d'un chèque ou de tout autre moyen de paiement", margin + 105, 24, { align: "center" });

  // Right box - Important notice
  drawBlueBox(doc, margin + 160, 8, 30, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.text("Important :", margin + 162, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4);
  doc.text("La déclaration doit être", margin + 162, 15);
  doc.text("déposée à la recette des impôts avant", margin + 162, 18);
  doc.text("les vingt premiers jours du mois.", margin + 162, 21);

  // Series label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Série G n°50 (2025)", pageWidth - margin, 6, { align: "right" });

  // ============ PERIOD AND CODE ACTIVITY ============
  const periodY = 32;
  drawBlueBox(doc, margin, periodY, 100, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  const mOrQ = input.period.kind === "monthly" && input.period.month
    ? MONTHS_FR[input.period.month - 1]
    : input.period.quarter
      ? `${input.period.quarter}ᵉ Trimestre`
      : "";
  doc.text(`Mois/trimestre : ${mOrQ}`, margin + 2, periodY + 5);
  doc.text(`Année : ${input.period.year}`, margin + 2, periodY + 9);

  // Code Activité boxes
  drawBlueBox(doc, margin + 105, periodY, 85, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("CODE ACTIVITÉ", margin + 110, periodY + 5);
  drawCharBoxes(doc, margin + 160, periodY + 3, 6, company.codeActivite);

  // ============ COMPANY INFORMATION ============
  const infoY = 48;
  drawBlueBox(doc, margin, infoY, pageWidth - margin * 2, 38);

  // Row 1: NIF & Article d'imposition
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  
  // Left: NIF
  doc.text("NIF :", margin + 2, infoY + 5);
  drawCharBoxes(doc, margin + 12, infoY + 1.5, 15, company.nif);

  // Right: Article d'imposition
  doc.text("ARTICLE D'IMPOSITION :", margin + 90, infoY + 5);
  drawCharBoxes(doc, margin + 132, infoY + 1.5, 10, company.articleImposition);

  // Row 2: NIN & Forme juridique
  // Left: NIN
  doc.text("NIN :", margin + 2, infoY + 12);
  drawCharBoxes(doc, margin + 12, infoY + 8.5, 15);

  // Right: Forme juridique
  doc.text("FORME JURIDIQUE :", margin + 90, infoY + 12);
  drawCharBoxes(doc, margin + 132, infoY + 8.5, 4, detectFormeJuridique(company.raisonSociale));

  // Company name
  doc.setFontSize(6);
  doc.text(`M : ${company.raisonSociale || ""}`, margin + 2, infoY + 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.text("(nom et prénom – raison sociale)", margin + 2, infoY + 23);

  // Activity/Profession
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(`Activité/Profession: ${company.activite || ""}`, margin + 2, infoY + 28);

  // Address
  doc.text(`Adresse : ${company.adresse || ""}`, margin + 2, infoY + 33);

  // ============ MAIN TABLE ============
  const tableY = 91;
  const tableWidth = pageWidth - margin * 2;

  // Table header
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, tableY, tableWidth, 8, "F");
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, tableY, tableWidth, 8);

  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);

  // Header columns
  const col1X = margin + 15;
  const col2X = margin + 60;
  const col3X = margin + 130;
  const col4X = margin + 155;
  const col5X = margin + 175;

  doc.text("code", col1X, tableY + 5, { align: "center" });
  doc.text("Catégorie de revenus soumis à la retenue à la source", col2X, tableY + 5, { align: "center" });
  doc.text("Revenus imposables", col3X, tableY + 5, { align: "center" });
  doc.text("Taux", col4X, tableY + 5, { align: "center" });
  doc.text("Montants à payer (DA)", col5X, tableY + 5, { align: "center" });
  doc.setTextColor(0);

  // Table content
  let currentY = tableY + 10;

  // Section 1: Prestations de services
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Prestations de services réalisées par des entreprises étrangères:", margin + 2, currentY + 4);
  doc.setTextColor(0);
  currentY += 8;
  const section1Rows = [
    ["E1M10", "Sommes payées en rémunération des prestations de services réalisées par des entreprises étrangères (catégorie IRG)", "24%"],
    ["E1M20", "Produits perçus par les inventeurs au titre soit de la concession de licence d'exploitation de leurs brevets, soit de la cession ou concession de marques de fabrique, procédés ou formules de fabrication", "24%"],
    ["E1M30", "Sommes versées sous forme de cachets ou droits d'auteurs aux artistes ayant leur domicile fiscal hors d'Algérie", "15%"],
  ];

  section1Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, currentY + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, currentY + 3, { maxWidth: 100 });
    
    const wVal = getWithholdingVal(row[0]);
    if (wVal && wVal.base > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(fmt(wVal.base), margin + 145, currentY + 3, { align: "right" });
      doc.text(fmt(wVal.tax), margin + 188, currentY + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 120, currentY + 3, 30);
      drawDottedLine(doc, margin + 170, currentY + 3, 20);
    }
    
    doc.text(row[2], margin + 155, currentY + 3);
    currentY += 8;
  });

  // Sub-total row
  const sub1 = getWithholdingSectionTotal(["E1M10", "E1M20", "E1M30"]);
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("1", margin + 2, currentY + 4);
  doc.text("Sous Total", margin + 20, currentY + 4);
  if (sub1.base > 0) {
    doc.text(fmt(sub1.base), margin + 145, currentY + 4, { align: "right" });
    doc.text(fmt(sub1.tax), margin + 188, currentY + 4, { align: "right" });
  } else {
    drawDottedLine(doc, margin + 120, currentY + 4, 30);
    drawDottedLine(doc, margin + 170, currentY + 4, 20);
  }
  currentY += 8;

  // Section 2: Revenus des Capitaux Mobiliers
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Revenus des Capitaux Mobiliers:", margin + 2, currentY + 4);
  doc.setTextColor(0);
  currentY += 8;

  // Rows for section 2
  const section2Rows = [
    ["E2M10", "Revenus distribués aux personnes physiques résidentes soumis à une retenue libératoire", "10%"],
    ["E2M20", "Produits de bons de caisse anonyme", "50%"],
    ["E2M30", "Les revenus des créances, dépôts et cautionnements", "10%"],
    ["E2M40", "Intérêts des sommes inscrites sur les livrets d'épargne ou les comptes d'épargne particuliers:", ""],
    ["E2M50", "    ○ Fraction des intérêts inférieure ou égale à 50.000 DA", "1%"],
    ["E2M60", "    ○ Fraction du revenu supérieure à 50.000 DA", "10%"],
    ["E2M70", "Les bénéfices répartis au profit de personnes physiques et personnes morales non résidentes en Algérie", "15%"],
    ["E2M80", "Plus-values de cession d'actions ou de parts sociales réalisées par les personnes physiques résidentes", "15%"],
    ["E2M90", "Plus-values de cession d'actions ou de parts sociales réalisées par des personnes physiques non résidentes", "20%"],
    ["E2M95", "Plus-values de cession d'actions ou de parts sociales réalisées par des personnes physiques non résidentes (pays conventionnés)", "...%"],
    ["E2M100", "Bénéfices des sociétés étrangères non résidentes (succursale établie en Algérie ou toute autre installation professionnelle au sens fiscal – article 46-8 du CIDTA) sauf pays conventionnés.", "15%"],
  ];

  section2Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, currentY + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, currentY + 3, { maxWidth: 100 });
    
    const wVal = getWithholdingVal(row[0]);
    if (wVal && wVal.base > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(fmt(wVal.base), margin + 145, currentY + 3, { align: "right" });
      doc.text(fmt(wVal.tax), margin + 188, currentY + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 120, currentY + 3, 30);
      drawDottedLine(doc, margin + 170, currentY + 3, 20);
    }
    
    doc.text(row[2], margin + 155, currentY + 3);
    currentY += 6;
  });

  // Sub-total row
  const sub2 = getWithholdingSectionTotal(["E2M10", "E2M20", "E2M30", "E2M40", "E2M50", "E2M60", "E2M70", "E2M80", "E2M90", "E2M95", "E2M100"]);
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("2", margin + 2, currentY + 4);
  doc.text("Sous Total", margin + 20, currentY + 4);
  if (sub2.base > 0) {
    doc.text(fmt(sub2.base), margin + 145, currentY + 4, { align: "right" });
    doc.text(fmt(sub2.tax), margin + 188, currentY + 4, { align: "right" });
  } else {
    drawDottedLine(doc, margin + 120, currentY + 4, 30);
    drawDottedLine(doc, margin + 170, currentY + 4, 20);
  }
  // Section 3: Revenus locatifs
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Revenus locatifs:", margin + 2, currentY + 4);
  doc.setTextColor(0);
  currentY += 8;
 
  const section3Rows = [
    ["E1L10", "Revenus de location à titre civil de biens immobiliers collectif à usage d'habitation", "7%"],
    ["E1L20", "Revenus de location à titre civil de biens immobiliers individuel", "10%"],
    ["E1L30", "Location de locaux à usage commercial ou professionnel", "15%"],
    ["E1L40", "Les revenus issus de la location de salles des fêtes, fêtes foraines et de cirques", "15%"],
  ];
 
  section3Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, currentY + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, currentY + 3, { maxWidth: 100 });
    drawDottedLine(doc, margin + 120, currentY + 3, 30);
    doc.text(row[2], margin + 155, currentY + 3);
    drawDottedLine(doc, margin + 170, currentY + 3, 20);
    currentY += 6;
  });
 
  // Sub-total row
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, currentY, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("3", margin + 2, currentY + 4);
  doc.text("Sous Total", margin + 20, currentY + 4);
  drawDottedLine(doc, margin + 120, currentY + 4, 30);
  drawDottedLine(doc, margin + 170, currentY + 4, 20);
  currentY += 8;
 
  // ============ PAGE 2 - Traitements et salaires ============
  doc.addPage();
  let y2 = 15;
 
  let irgResult: any = null;
  if (irgDraft) {
    try {
      irgResult = calculateIrg(
        Number(irgDraft.gross) || 0,
        Number(irgDraft.otherDeductions) || 0,
        irgDraft.maritalStatus || "single",
        Number(irgDraft.children) || 0,
        irgDraft.handicapped || false
      );
    } catch (e) {}
  }
 
  // Section 4: Traitements et salaires
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y2, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("Traitements et salaires:", margin + 2, y2 + 4);
  doc.setTextColor(0);
  y2 += 8;
 
  const section4Rows = [
    ["E2L20", "Traitements et salaires versés par les employeurs:", "", "", ""],
    ["E2L30", "    ○ Personnel résident", irgResult ? fmt(irgResult.base) : "", "Barème", irgResult ? fmt(irgResult.irg) : ""],
    ["E2L40", "    ○ Personnel non résident", "", "Barème", ""],
    ["E2L50", "Primes de rendement, gratification ou autres, ainsi que les rappels y afférents, d'une périodicité autre que mensuelle servies par les employeurs", "", "10%", ""],
    ["E2L60", "Sommes versées à des personnes exerçant, en sus de leur activité principale de salarié, une activité d'enseignement, de recherche, de surveillance ou d'assistanat à titre vacataire, ainsi que les rémunérations provenant de toutes activités occasionnelles à caractère intellectuel (montant annuel n'excède pas 2 000 000 DA)", "", "10%", ""],
  ];
 
  section4Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, y2 + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, y2 + 3, { maxWidth: 100 });
    
    if (row[2]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[2], margin + 145, y2 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 120, y2 + 3, 30);
    }
    
    doc.text(row[3], margin + 155, y2 + 3);
    
    if (row[4]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[4], margin + 188, y2 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 170, y2 + 3, 20);
    }
    y2 += 8;
  });
 
  // Sub-total row
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, y2, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("4", margin + 2, y2 + 4);
  doc.text("Sous Total", margin + 20, y2 + 4);
  if (irgResult) {
    doc.text(fmt(irgResult.base), margin + 145, y2 + 4, { align: "right" });
    doc.text(fmt(irgResult.irg), margin + 188, y2 + 4, { align: "right" });
  } else {
    drawDottedLine(doc, margin + 120, y2 + 4, 30);
    drawDottedLine(doc, margin + 170, y2 + 4, 20);
  }
  y2 += 10;

  // Section 5: SOLDE DE LIQUIDATION IRG / Professionnel
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y2, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("SOLDE DE LIQUIDATION IRG / Professionnel:", margin + 2, y2 + 4);
  doc.setTextColor(0);
  y2 += 8;

  const section5Rows = [
    ["E3L10", "Résultat taxable: ....................................................................", "", "", ""],
    ["", "Montant des acomptes à verser", "", "", ""],
    ["", "A) - IRG/ au taux de:", "", "", ""],
    ["E3L20", "Montant du 1er acompte (1)......................................................", "", "...%.", ""],
    ["E3L30", "Montant du 2ème acompte (2)......................................................", "", "...%.", ""],
    ["E3L40", "Acomptes versés par les entreprises non résidentes (3)......................................................", "", "", ""],
    ["E3L50", "Crédit d'impôt (4)....................................................................", "", "", ""],
    ["E3L60", "B) – Montant global à déduire (1+2+3+4)......................................................", "", "", ""],
    ["E3L70", "Solde de liquidation (A-B)......................................................", "", "Barème", ""],
    ["E3L80", "Excédent de versement (B-A)......................................................", "", "", ""],
    ["E3L90", "Minimum d'Imposition......................................................", "", "", ""],
  ];

  section5Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, y2 + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, y2 + 3, { maxWidth: 100 });
    drawDottedLine(doc, margin + 120, y2 + 3, 30);
    doc.text(row[3], margin + 155, y2 + 3);
    drawDottedLine(doc, margin + 170, y2 + 3, 20);
    y2 += 6;
  });

  // Sub-total row
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, y2, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("5", margin + 2, y2 + 4);
  doc.text("Sous Total", margin + 20, y2 + 4);
  drawDottedLine(doc, margin + 120, y2 + 4, 30);
  drawDottedLine(doc, margin + 170, y2 + 4, 20);
  y2 += 10;

  // ============ PAGE 3 - IMPOT SUR LES BENEFICES DES SOCIETES ============
  doc.addPage();
  let y3 = 15;

  let ibsResult: any = null;
  if (ibsDraft) {
    try {
      let activityKey: any = "services_trade";
      if (ibsDraft.activity === "production") activityKey = "production";
      else if (ibsDraft.activity === "btp_tourism") activityKey = "btp_tourism";
      else if (ibsDraft.activity === "services_trade") activityKey = "services_trade";
      else if (ibsDraft.activity === "banks_insurance") activityKey = "banks_insurance";

      ibsResult = calculateIbs({
        activity: activityKey,
        taxableProfit: Number(ibsDraft.taxableProfit) || 0,
        creditsAlreadyPaid: Number(ibsDraft.creditsAlreadyPaid) || 0,
      });
    } catch (e) {}
  }

  // Section 6: IMPOT SUR LES BENEFICES DES SOCIETES
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y3, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("IMPOT SUR LES BENEFICES DES SOCIETES:", margin + 2, y3 + 4);
  doc.setTextColor(0);
  y3 += 8;

  const section6Rows = [
    ["E1B40", "Résultat taxable:....................................................................", ibsResult ? fmt(ibsResult.taxableProfit) : "", "", ""],
    ["E1B60", "Montant du capital social appelé......................................................", "", "5%", ""],
    ["", "A) IBS au taux de :", "", "", ""],
    ["E1B10", "Activités de production de biens......................................................", ibsResult && ibsResult.activity === "production" ? fmt(ibsResult.taxableProfit) : "", "19%", ibsResult && ibsResult.activity === "production" ? fmt(ibsResult.ibs) : ""],
    ["E1B20", "Activité de bâtiment, de travaux publics et d'hydraulique ainsi que les activités touristiques et thermales à l'exclusion des agences de voyages...", ibsResult && ibsResult.activity === "btp_tourism" ? fmt(ibsResult.taxableProfit) : "", "23%", ibsResult && ibsResult.activity === "btp_tourism" ? fmt(ibsResult.ibs) : ""],
    ["E1B30", "Les activités de commerce et de services......................................................", ibsResult && (ibsResult.activity === "services_trade" || ibsResult.activity === "banks_insurance") ? fmt(ibsResult.taxableProfit) : "", "26%", ibsResult && (ibsResult.activity === "services_trade" || ibsResult.activity === "banks_insurance") ? fmt(ibsResult.ibs) : ""],
    ["E1B70", "Excédent de versement antérieur à déduire (1)......................................................", "", "", ""],
    ["E1B80", "Montant du 1er acompte (2)......................................................", "", "", ""],
    ["E1B81", "Montant du 2ème acompte (3)......................................................", "", "", ""],
    ["E1B82", "Montant du 3ème acompte (4)......................................................", "", "", ""],
    ["E1B83", "Acomptes versés par les sociétés non résidentes (5)......................................................", "", "0.5%", ""],
    ["E1B84", "Crédit d'impôt (6) ......................................................", "", "", ibsResult && ibsResult.netDue < ibsResult.ibsDue ? fmt(ibsResult.ibsDue - ibsResult.netDue) : ""],
    ["E1B85", "B) Montant global à déduire (1+2+3+4+5+6)......................................................", "", "", ibsResult && ibsResult.netDue < ibsResult.ibsDue ? fmt(ibsResult.ibsDue - ibsResult.netDue) : ""],
    ["E1B86", "Solde de liquidation / IBS à payer (A-B)......................................................", "", "", ibsResult ? fmt(ibsResult.netDue) : ""],
    ["E1B90", "C) Excédent de versement à reporter (B-A)......................................................", "", "", ""],
    ["E1B91", "Minimum d'Imposition......................................................", "", "", ibsResult ? fmt(ibsResult.minimumDue) : ""],
  ];

  section6Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, y3 + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, y3 + 3, { maxWidth: 100 });
    
    if (row[2]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[2], margin + 145, y3 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 120, y3 + 3, 30);
    }
    
    doc.text(row[3], margin + 155, y3 + 3);
    
    if (row[4]) {
      doc.setFont("helvetica", "bold");
      doc.text(row[4], margin + 188, y3 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 170, y3 + 3, 20);
    }
    y3 += 6;
  });

  // Section: IBS RETENUS A LA SOURCE
  y3 += 4;
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y3, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("IBS RETENUS A LA SOURCE", margin + 2, y3 + 4);
  doc.setTextColor(0);
  y3 += 8;

  const section7Rows = [
    ["E1B100", "Revenus des créances, dépôts et cautionnement......................................................", "10%"],
    ["E1B110", "Revenus provenant de bons de caisses anonymes......................................................", "50%"],
    ["E1B120", "Revenus perçus dans le cadre d'un contrat de management...", "20%"],
    ["E1B130", "Produits versés à des inventeurs résidents à l'étranger au titre, soit de la concession de licence de l'exploitation de leurs brevets, soit de la cession ou concession de marque de fabrique, procédé ou formule de fabrication...", "24%"],
    ["E1B140", "Revenus des entreprises étrangères de transport maritime...", "10%"],
    ["E1B150", "Plus values de cession d'actions ou de parts sociales réalisées par des personnes physiques non résidentes d'actions ou de parts sociales réalisées par des personnes morales non résidentes (pays non conventionné) ......(1)", "20%"],
    ["E1B160", "Plus values de cession d'actions ou de parts sociales réalisées par des personnes physiques non résidentes d'actions ou de parts sociales réalisées par des personnes morales non résidentes (pays conventionnés)...", "...%"],
    ["E1B170", "Sommes payées à des sociétés n'ayant pas d'installation permanente en Algérie, en rémunération de prestations de services...", "...%"],
  ];

  section7Rows.forEach((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text(row[0], margin + 2, y3 + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.text(row[1], margin + 20, y3 + 3, { maxWidth: 100 });
    
    const wVal = getWithholdingVal(row[0]);
    if (wVal && wVal.base > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(fmt(wVal.base), margin + 145, y3 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 120, y3 + 3, 30);
    }
    
    doc.text(row[2], margin + 155, y3 + 3);
    
    if (wVal && wVal.base > 0) {
      doc.setFont("helvetica", "bold");
      doc.text(fmt(wVal.tax), margin + 188, y3 + 3, { align: "right" });
      doc.setFont("helvetica", "normal");
    } else {
      drawDottedLine(doc, margin + 170, y3 + 3, 20);
    }
    y3 += 6;
  });

  // Sub-total row Section 7
  const sub7 = getWithholdingSectionTotal(["E1B100", "E1B130", "E1B150", "E1B170"]);
  doc.setDrawColor(0, 51, 102);
  doc.rect(margin, y3, tableWidth, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("7", margin + 2, y3 + 4);
  doc.text("Sous Total IBS Retenues", margin + 20, y3 + 4);
  if (sub7.base > 0) {
    doc.text(fmt(sub7.base), margin + 145, y3 + 4, { align: "right" });
    doc.text(fmt(sub7.tax), margin + 188, y3 + 4, { align: "right" });
  } else {
    drawDottedLine(doc, margin + 120, y3 + 4, 30);
    drawDottedLine(doc, margin + 170, y3 + 4, 20);
  }

  // ============ PAGE 4 - TAXE SUR LA VALEUR AJOUTEE (TVA) ============
  doc.addPage();
  let y4 = 15;

  // Header banner for Section 11 / A
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y4, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("11 — TAXE SUR LA VALEUR AJOUTÉE (TVA) — A/ Chiffres d'affaires imposables:", margin + 2, y4 + 4);
  doc.setTextColor(0);
  y4 += 8;

  // Let's print the operations entered by the user
  const tvaRows = result.lines.map((l) => [
    l.code,
    l.label,
    fmt(l.caHT),
    l.rate === 0 ? "Exonéré" : `${(l.rate * 100).toFixed(0)}%`,
    fmt(l.tva),
  ]);
  if (tvaRows.length === 0) {
    tvaRows.push(["—", "Aucune opération saisie", "", "", ""]);
  }

  autoTable(doc, {
    startY: y4,
    head: [["Code", "Désignation", "CA imposable (HT)", "Taux", "TVA (DA)"]],
    body: tvaRows,
    foot: [
      [
        { content: "Sous-total CA imposable", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmt(result.totalCAImposable), styles: { fontStyle: "bold" } },
        "",
        { content: fmt(result.totalDroitsDus), styles: { fontStyle: "bold" } },
      ],
    ],
    styles: { font: "helvetica", fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "center", cellWidth: 16 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  y4 = (doc as any).lastAutoTable.finalY + 6;

  // Section 11 / B: Déductions à opérer
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y4, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("11 — B/ Déductions à opérer:", margin + 2, y4 + 4);
  doc.setTextColor(0);
  y4 += 8;

  const d = input.deductions;
  autoTable(doc, {
    startY: y4,
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
      { content: "Total des déductions à opérer (B)", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
      { content: fmt(result.totalDeductions), styles: { fontStyle: "bold" } },
    ]],
    styles: { font: "helvetica", fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });

  y4 = (doc as any).lastAutoTable.finalY + 6;

  // Recap Section / TVA à payer
  doc.setFillColor(0, 51, 102);
  doc.rect(margin, y4, tableWidth, 6, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("11 — C/ Récapitulatif & Total à Payer:", margin + 2, y4 + 4);
  doc.setTextColor(0);
  y4 += 8;

  const isCredit = result.precompteAReporter > 0;
  const recapHighlight: [number, number, number] = isCredit ? [230, 245, 235] : [245, 230, 230];
  const recapLabel = isCredit
    ? "11 — CRÉDIT DE TVA À REPORTER  (E3B130)"
    : "11 — TOTAL TVA À PAYER  (C/500020)";
  const recapAmount = isCredit ? result.precompteAReporter : result.totalTvaAPayer;

  autoTable(doc, {
    startY: y4,
    head: [["Code", "Désignation", "Montant (DA)"]],
    body: [
      ["E3B96", "Total des droits dus", fmt(result.totalDroitsDus)],
      ["E3B97", "Régularisation prorata (+) — déduction excédentaire", fmt(input.regularisationProrataPlus ?? 0)],
      ["E3B98", "Régularisation (régime des acomptes)", fmt(input.regularisationAcomptes ?? 0)],
      ["E3B99", "Reversement de la déduction (art. 38 CTCA)", fmt(input.reversementDeduction ?? 0)],
      ["E3B100", "(+) Total à rappeler (C)", fmt(result.totalRappeler)],
      ["E3B110", "Total des déductions à opérer (B)", fmt(result.totalDeductions)],
      ["E3B120", "TVA à payer au titre du mois (C - B)", fmt(result.tvaAPayer)],
      ["E3B130", "Précompte à reporter sur le mois suivant (B - C)", fmt(result.precompteAReporter)],
      ["E3B140", "TVA auto-liquidée à payer (art. 83 CTCA)", fmt(result.tvaAutoLiquidee)],
    ],
    foot: [[
      { content: recapLabel, colSpan: 2, styles: { halign: "right", fontStyle: "bold", fillColor: recapHighlight } },
      { content: fmt(recapAmount), styles: { fontStyle: "bold", fillColor: recapHighlight } },
    ]],
    styles: { font: "helvetica", fontSize: 6, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });

  y4 = (doc as any).lastAutoTable.finalY + 8;

  // Compliance badge line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 102, 102);
  doc.text("Conforme Loi de Finances 2026 — Art. 28-33 CID", margin, y4);
  doc.setTextColor(0);
  y4 += 4;

  // Footer signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Fait à ............................., le ${new Date().toLocaleDateString("fr-FR")}`, margin, y4 + 4);
  doc.text("Signature et cachet du contribuable :", pageWidth - margin - 70, y4 + 4);

  // ============ FOOTER ============
  const footerY = pageHeight - 10;
  const pageCount = doc.getNumberOfPages();
  const today = new Date().toLocaleDateString("fr-FR");

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Document généré par MATAX — Conforme LF 2026 — ${today}`, margin, footerY);
    doc.text(`${periodLabel(input.period)} · ${i}/${pageCount}`, pageWidth - margin, footerY, { align: "right" });
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
