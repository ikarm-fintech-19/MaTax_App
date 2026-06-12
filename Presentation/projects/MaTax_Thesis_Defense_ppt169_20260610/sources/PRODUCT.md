# PRODUCT.md — Matax

## Product Name

Matax

## Tagline

Conformité fiscale algérienne / Algerian Tax Compliance

## Register

product

## Product Purpose

Matax is a SaaS web application that helps Algerian SMEs, accountants, and sole traders stay fiscally compliant with the DGI (Direction Générale des Impôts) and the Algerian Finance Act (Loi de Finances) 2026. It automates the computation and PDF export of the main Algerian tax declarations (G50/TVA, IRG, IBS, TFPC, Withholding), surfaces an obligation calendar, and provides an in-app AI fiscal assistant grounded in the official legal texts.

## Users

1. **SME owner / gérant** — non-expert in tax law, uses the app to produce monthly/quarterly declarations without a full-time accountant. Primary language: French or Arabic. Urgency is high; deadlines are non-negotiable.
2. **Chartered accountant / expert-comptable** — handles multiple client files, uses Matax to speed up routine computation and PDF generation. Expects precision, tabular data, and professional output.
3. **HR / payroll officer** — runs IRG salary calculations for employees. Needs fast input + visual breakdown of brackets.

## Brand Tone

Authoritative but approachable. The product operates in a compliance context where trust and accuracy are paramount. Never playful. Never alarmist. Clear, measured, professional. French is the default language, Arabic and English are supported.

## Anti-references

- No generic "fintech" SaaS aesthetics: navy + gold, full-bleed gradients, oversized hero numbers.
- No consumer banking app softness (rounded pastel bubbles, confetti animations).
- No French government CERFA form ugliness.
- No dark-mode-by-default: users access this in bright offices on work laptops during business hours.

## Strategic Principles

1. **Compliance signal first.** Every screen must instantly communicate "this is official and trustworthy." The LF 2026 compliance badge earns its placement.
2. **Data over decoration.** Numbers, tables, and reference codes are the content. Design frames them; it does not compete with them.
3. **Speed of task completion.** The G50 declaration must be reachable in ≤2 taps from login. Form fields are the hero.
4. **RTL-ready.** All layouts use logical properties (start/end). Arabic font (Cairo) is defined; any spacing change must be tested against RTL.
5. **PDF as deliverable.** The jsPDF export is a core feature, not an afterthought. The compliance badge on PDF reinforces brand.

## Current Tech Stack

- **Framework:** React 19 + TanStack Start (file-based routing, SSR-capable)
- **Styling:** Tailwind CSS v4 + tw-animate-css, OKLCH color tokens, custom @theme inline design system
- **State:** TanStack Query + localStorage (drafts), Supabase (declarations, auth)
- **PDF:** jsPDF + jspdf-autotable
- **Icons:** Lucide React
- **i18n:** Custom in-memory FR/AR/EN dictionary (useI18n hook)
- **Font stack:** Lexend (display/headings), Source Sans 3 (body), Cairo (Arabic RTL)
- **Palette:** Teal-tinted neutrals, deep fiscal teal primary (oklch 0.5 0.09 180), accent blue

## Pages / Routes

- `/login` — email + Google auth, demo bypass
- `/dashboard` — obligation calendar, recent declarations table, quick-action grid, example PDF download
- `/g50` — G50 VAT declaration form (company ID, period, operation lines, deductions, summary + export)
- `/irg` — IRG salary calculator (gross, marital, children, brackets table)
- `/ibs` — IBS corporate tax calculator
- `/tfpc` — TFPC petroleum tax
- `/withholding` — Withholding tax calculator
- `/settings` — company info, language switcher

## What Needs Improving (design audit summary)

- **Dashboard quick-action grid** is an identical card grid (banned pattern): icon + label repeated 5×, no differentiation.
- **Login page** is a plain centered card with no brand character.
- **Sidebar** has no visual weight hierarchy; all nav items look identical.
- **Section cards** throughout use uniform `surface-card` padding with no rhythm variation.
- **Typography scale** is flat: headline-text and title-text are both font-weight 600 with similar sizing.
- **Empty states** (recent declarations) are a single muted line with no guidance.
- **Modal pattern** is overused: consultation, regime selector, V2 placeholder all use the same centered `fixed inset-0` overlay.
- **Fiscal chat button** is a floating element with no persistent context affordance.
- **Color underused in product register:** the teal primary and accent blue are declared but rarely given "committed" weight anywhere.
