# MaTax Thesis Defense - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift.

## I. Project Information

| Item                | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Project Name**    | MaTax Thesis Defense                                                                        |
| **Canvas Format**   | PPT 16:9 (1280×720)                                                                         |
| **Page Count**      | 16 slides (15 minutes)                                                                      |
| **Design Style**    | B) General Consulting + Academic Defense meets FinTech Professional                         |
| **Target Audience** | Academic jury — Master's in Accounting & Taxation, Ibn Khaldoun University Tiaret           |
| **Use Case**        | Graduation thesis defense (عرض التخرج) for startup: MaTax — Digital Tax Compliance Platform |
| **Created Date**    | 2026-06-10                                                                                  |
| **Language**        | Arabic (primary) with French/English technical terms                                        |

---

## II. Canvas Specification

| Property         | Value                                 |
| ---------------- | ------------------------------------- |
| **Format**       | PPT 16:9                              |
| **Dimensions**   | 1280 × 720 px                         |
| **viewBox**      | `0 0 1280 720`                        |
| **Margins**      | Left/Right 40px, Top 0px, Bottom 35px |
| **Content Area** | x: 40–1240, y: 70–665                 |

---

## III. Visual Theme

### Theme Style

- **Style**: B) General Consulting + Academic Defense meets FinTech Professional
- **Theme**: Light theme (white background + dark blue header)
- **Tone**: Professional, rigorous, trustworthy, data-first

### Color Scheme

| Role                 | HEX       | Purpose                                          |
| -------------------- | --------- | ------------------------------------------------ |
| **Background**       | `#FFFFFF` | Clean white — academic standard                  |
| **Secondary bg**     | `#F8FAFC` | Card/section backgrounds (neutral gray-blue)     |
| **Primary**          | `#00527F` | Dark blue — headers, title bars, key decorations |
| **Accent**           | `#D62828` | Red — data highlights, CTAs, warnings            |
| **Secondary accent** | `#F77F00` | Orange — decorative elements, secondary emphasis |
| **Tertiary accent**  | `#FCD916` | Yellow — highlights, tertiary emphasis           |
| **Light accent**     | `#31ACEA` | Light blue — tertiary elements                   |
| **Dark**             | `#023A51` | Dark backgrounds, shadows                        |
| **Body text**        | `#1E293B` | Dark slate — maximum readability                 |
| **Secondary text**   | `#44546A` | Captions, footnotes                              |
| **Tertiary text**    | `#94A3B8` | Page numbers, metadata                           |
| **Border/divider**   | `#E2E8F0` | Subtle card borders                              |
| **Success**          | `#16A34A` | Positive KPIs, growth indicators                 |
| **Warning**          | `#D62828` | Risk indicators, penalties                       |

> **Gradient**: `#F77F00→#D62828→#00527F→#FCD916` — decorative gradient inspired by Arabic defense presentation theme.

---

## IV. Typography System

### Font Plan

**Typography direction**: Clean modern sans-serif titles + light body (Arabic/French bilingual)

| Role         | Arabic         | Latin                     | Fallback            |
| ------------ | -------------- | ------------------------- | ------------------- |
| **Title**    | `Montserrat`   | `Montserrat`              | `Arial, sans-serif` |
| **Body**     | `"Lato Light"` | `Arial`                   | `sans-serif`        |
| **Emphasis** | `Montserrat`   | `Montserrat`              | `Arial, sans-serif` |
| **Code**     | —              | `Consolas, "Courier New"` | `monospace`         |

**Per-role font stacks**:

- Title: `Montserrat, Arial, sans-serif`
- Body: `"Lato Light", Arial, sans-serif`
- Emphasis: `Montserrat, Arial, sans-serif`
- Code: `Consolas, "Courier New", monospace`

> **Theme Source**: Inspired by Arabic defense presentation (عرض تخرج.pptx) — Montserrat for titles, Lato Light for body text.

### Font Size Hierarchy

**Baseline**: Body font size = **20px** (medium density — balances data tables + prose)

| Purpose                  | Ratio to body | Size @ 20px | Weight   |
| ------------------------ | ------------- | ----------- | -------- |
| Cover title              | 3x            | 60px        | Bold     |
| Chapter / section opener | 2.2x          | 44px        | Bold     |
| Page title               | 1.8x          | 36px        | Bold     |
| Hero number (KPIs)       | 1.8x          | 36px        | Bold     |
| Subtitle                 | 1.3x          | 26px        | SemiBold |
| **Body content**         | **1x**        | **20px**    | Regular  |
| Annotation / caption     | 0.8x          | 16px        | Regular  |
| Page number / footnote   | 0.6x          | 12px        | Regular  |

### Formula Rendering Policy

**Policy**: `text-only` — no complex formulas; financial figures stay as editable text/numbers.

---

## V. Layout Principles

### Page Structure

- **Header area**: y=0, h=70px — Dark blue background + red left bar + page title
- **Key Message Bar**: y=70, h=50px — Core message/summary (light blue-gray bg)
- **Content area**: y=135, h=515px — Main content area
- **Footer**: y=665, h=55px — Data source, section name, page number

### Layout Pattern Library

| Pattern                    | Suitable Scenarios                   |
| -------------------------- | ------------------------------------ |
| **Single column centered** | Covers, conclusions, key points      |
| **Two-column cards**       | Table of contents                    |
| **Asymmetric split (4:6)** | Image-text mixed layouts             |
| **Card grid**              | Feature lists, parallel points       |
| **Table**                  | Financial data, competitive analysis |
| **Timeline**               | Roadmap, milestones                  |

### Spacing Specification

| Element                      | Value |
| ---------------------------- | ----- |
| Safe margin from canvas edge | 40px  |
| Content block gap            | 24px  |
| Icon-text gap                | 12px  |
| Card gap                     | 20px  |
| Card padding                 | 20px  |
| Card border radius           | 8px   |

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `templates/icons/`
- **Library**: `tabler-outline` (stroke-based, airy, refined — fits academic consulting aesthetic)
- **Stroke weight**: 2 (deck-wide lock)

### Recommended Icon List

| Purpose                | Icon Path                        | Page     |
| ---------------------- | -------------------------------- | -------- |
| Tax compliance         | `tabler-outline/clipboard-check` | P03, P04 |
| Calculator / math      | `tabler-outline/calculator`      | P03, P04 |
| Alerts / notifications | `tabler-outline/bell`            | P04, P05 |
| Cloud / storage        | `tabler-outline/cloud`           | P04, P05 |
| Shield / security      | `tabler-outline/shield-check`    | P04, P05 |
| Chart / analytics      | `tabler-outline/chart-bar`       | P09, P10 |
| Users / team           | `tabler-outline/users`           | P15      |
| Target / market        | `tabler-outline/target`          | P07, P08 |
| Trend / growth         | `tabler-outline/trending-up`     | P10, P11 |
| Calendar / deadlines   | `tabler-outline/calendar`        | P04      |
| Building / business    | `tabler-outline/building`        | P08      |
| Award / innovation     | `tabler-outline/award`           | P06      |
| Roadmap / phases       | `tabler-outline/routes`          | P14      |
| Globe / national       | `tabler-outline/world`           | P08      |

---

## VII. Visualization Reference List

Catalog read: 71 templates

| Page | Template              | Path                                         | Summary-quote (verbatim)                                                                                                                                                                                                                              | Usage                                              |
| ---- | --------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| P03  | icon_grid             | `templates/charts/icon_grid.svg`             | "Pick for 4-9 parallel features/capabilities/services as icon cards — feature grid, service lineup, benefits matrix, brand values, product highlights. Skip for sequential ordering (use numbered_steps) or hierarchical layers (use pyramid_chart)." | Problem/solution 5-pillar grid                     |
| P07  | quadrant_text_bullets | `templates/charts/quadrant_text_bullets.svg` | "Pick for any 2×2 framework where each quadrant holds a titled bullet list — SWOT (Strengths/Weaknesses/Opportunities/Threats, internal-external × helpful-harmful)..."                                                                               | SWOT analysis                                      |
| P09  | consulting_table      | `templates/charts/consulting_table.svg`      | "Pick for high-density tables with embedded micro bar visuals (consulting/financial reports). Skip for plain text data (use basic_table)."                                                                                                            | Financial projections 7-year table                 |
| P10  | kpi_cards             | `templates/charts/kpi_cards.svg`             | "Pick for 4-8 standalone numeric metrics shown as overview cards (2x2 or 1x4) — exec summary opener, dashboard headline, quarterly recap, results-at-a-glance."                                                                                       | Financial viability metrics (VAN, DR, BEP, Margin) |
| P12  | comparison_table      | `templates/charts/comparison_table.svg`      | "Pick for 2-4 plans/products compared across many feature rows (dense matrix). Skip for pricing-tier marketing layout (use comparison_columns)."                                                                                                      | Competitive analysis (MaTax vs alternatives)       |
| P14  | roadmap_vertical      | `templates/charts/roadmap_vertical.svg`      | "Pick for 4-8 milestones on a vertical timeline with status indicators. Skip for horizontal time emphasis (use timeline) or tasks with durations (use gantt_chart)."                                                                                  | Project roadmap phases                             |
| P15  | team_roster           | `templates/charts/team_roster.svg`           | "Pick for 3-12 leadership/team profile cards (photo + name + title + short bio). Skip for reporting hierarchy (use top_down_tree)."                                                                                                                   | Team & acknowledgments                             |

**Runners-up considered** (3 entries minimum):

- `process_flow` | rejected for P03: sequential flow not needed — parallel problem pillars
- `pie_chart` | rejected for P09: revenue composition is a table, not a pie
- `gantt_chart` | rejected for P14: no task dependencies — simple milestone timeline

---

## VIII. Image Resource List

| Filename                | Dimensions | Ratio | Purpose                                      | Type        | Layout pattern                        | Acquire Via | Status   | Reference                                                                            | text_policy | page_role |
| ----------------------- | ---------- | ----- | -------------------------------------------- | ----------- | ------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------ | ----------- | --------- |
| prototype_dashboard.png | 1280x720   | 1.78  | Dashboard screenshot for prototype demo page | Photography | #38 background image + native overlay | user        | Existing | MaTax application dashboard screenshot showing obligation calendar and quick actions | none        | local     |
| prototype_g50.png       | 1280x720   | 1.78  | G50 declaration form screenshot              | Photography | #38 background image + native overlay | user        | Existing | MaTax G50 VAT declaration form with auto-calculated fields                           | none        | local     |
| prototype_irg.png       | 1280x720   | 1.78  | IRG calculator screenshot                    | Photography | #38 background image + native overlay | user        | Existing | MaTax IRG salary calculator with bracket breakdown                                   | none        | local     |

> **Note**: Prototype screenshots are extracted from existing PPTX sources (user-provided). AI-generated images not needed for this academic defense — all visuals are authentic application screenshots.

---

## IX. Content Outline

### Part 1: Opening

#### Slide 01 - Cover (01_cover)

- **Layout**: Full-screen centered title
- **Title**: منصة MATAX — التسيير الجبائي الرقمي الذكي
- **Subtitle**: جامعة ابن خلدون تيارت | ماستر محاسبة وجباية | 2025/2026
- **Info**: إعداد: حموم إكرام | إشراف: أ. بلعباس مخطار

#### Slide 02 - Table of Contents (02_toc)

- **Layout**: Card-style TOC (2 columns)
- **Title**: فهرس المحتويات
- **Core message**: Structured defense roadmap
- **Content**: 8 sections covering problem → solution → innovation → market → financials → prototype → team → conclusion

### Part 2: Problem & Solution

#### Slide 03 - Chapter Divider: المشكلة والحل (02_chapter)

- **Layout**: Dark blue full-screen + chapter number
- **Chapter num**: 01
- **Chapter title**: المشكلة والحل المقترح
- **Chapter desc**: تعقيد الإجراءات الجبائية وغياب الرقمنة

#### Slide 04 - Problem + Solution (03_content)

- **Layout**: Left-right split (5:5)
- **Title**: المشكلة والحل المقترح
- **Core message**: MaTax solves 4 critical tax compliance problems through 5 integrated digital pillars
- **Content**:
  - **Left (Problem)**: 4 problem cards — تعقيد التشريعات، أخطاء بشرية، غرامات تأخير، غياب أرشفة
  - **Right (Solution)**: 5 solution pillars — تبسيط الجباية، تنبيهات ذكية، أتمتة، أرشفة سحابية، اشتراكات اقتصادية

### Part 3: Innovation

#### Slide 05 - Chapter Divider: الجوانب الابتكارية (02_chapter)

- **Layout**: Dark blue full-screen + chapter number
- **Chapter num**: 02
- **Chapter title**: الجوانب الابتكارية للمشروع
- **Chapter desc**: 6 مبادرات تميز MATAX عن الحلول التقليدية

#### Slide 06 - Innovation Aspects (03_content)

- **Layout**: Card grid (2×3)
- **Title**: الجوانب الابتكارية
- **Core message**: 6 innovation pillars differentiate MaTax from traditional solutions
- **Content**: 6 cards — هندسة الجباية بضغطة زر، نظام تنبيه استباقي، أرشفة سحابية مشفرة، لوحة قيادة لحظية، نموذج هجين، تحديث تلقائي للقوانين

### Part 4: Market & Business Model

#### Slide 07 - Chapter Divider: السوق والنموذج التجاري (02_chapter)

- **Layout**: Dark blue full-screen + chapter number
- **Chapter num**: 03
- **Chapter title**: السوق المستهدف والنموذج التجاري
- **Chapter desc**: من تيارت إلى الجزائر — توسع تدريجي

#### Slide 08 - Target Market + SWOT (03_content)

- **Layout**: Left-right split (4:6)
- **Title**: السوق المستهدف وتحليل SWOT
- **Core message**: 1.5M+ registered entities in Algeria; MaTax targets 400 clients in Year 1 from Tiaret
- **Content**:
  - **Left**: TAM/SAM/SOM breakdown
  - **Right**: SWOT 2×2 matrix (Strengths: ريادة محلية، تكامل المسار / Weaknesses: تكاليف التطوير / Opportunities: دعم الدولة / Threats: المنافسة التقليدية)

#### Slide 09 - Business Model (03_content)

- **Layout**: Card grid (2 columns)
- **Title**: النموذج التجاري (BMC)
- **Core message**: 5 revenue streams generate 9.6M DZD in Year 1
- **Content**:
  - **Left**: Revenue streams — اشتراكات SaaS (3.8M)، خدمات بالوحدة (2.4M)، شراكات (962K)، تكوين (1.7M)، إعلانات (740K)
  - **Right**: Key partners — مكاتب المحاسبة، حاضنات الأعمال، مزودو السحابة

### Part 5: Financials

#### Slide 10 - Chapter Divider: الدراسة المالية (02_chapter)

- **Layout**: Dark blue full-screen + chapter number
- **Chapter num**: 04
- **Chapter title**: الدراسة المالية
- **Chapter desc**: VAN إيجابي، استرداد في أقل من سنتين

#### Slide 11 - Financial Projections (03_content)

- **Layout**: Table layout
- **Title**: جدول حساب النتائج — 7 سنوات
- **Core message**: Revenue grows from 9.6M to 24.7M DZD over 3 years with 46.6% operating margin
- **Content**: 7-year income statement table (Year 1-7) with revenues, costs, taxes, net profit

#### Slide 12 - Financial Viability KPIs (03_content)

- **Layout**: KPI cards (2×2)
- **Title**: مؤشرات الجدوى المالية
- **Core message**: VAN +79.6M DZD, payback in 1 year 9 months, breakeven at 61 clients
- **Content**: 4 KPI cards — VAN (79.6M DZD ✓), DR (1 year 9 months ✓), BEP (61 clients Month 4 ✓), OM (46.6% ✓)

### Part 6: Prototype

#### Slide 13 - Chapter Divider: النموذج الأولي (02_chapter)

- **Layout**: Dark blue full-screen + chapter number
- **Chapter num**: 05
- **Chapter title**: النموذج التجريبي
- **Chapter desc**: منصة تعمل الآن — matax-frontend.onrender.com

#### Slide 14 - Prototype Demo (03_content)

- **Layout**: Left-right split (5:5)
- **Title**: النموذج الأولي — MaTax Prototype
- **Core message**: Working prototype with dashboard, G50 form, IRG calculator, cloud archival, and alerts
- **Content**:
  - **Left**: Dashboard screenshot + feature list (حساب آلي، إرسال G50، أرشفة سحابية، تنبيهات، تقارير، حماية 18-07)
  - **Right**: G50 form screenshot + IRG calculator screenshot

### Part 7: Roadmap & Team

#### Slide 15 - Roadmap (03_content)

- **Layout**: Timeline / vertical roadmap
- **Title**: المراحل التنفيذية
- **Core message**: 5 phases from legal setup (Week 1-2) to national launch (Week 11-12)
- **Content**: 5 milestone cards — التخطيط والدراسة القانونية، التطوير التقني، الإطلاق التجريبي، التوسع والامتياز، الإطلاق الرسمي

### Part 8: Closing

#### Slide 16 - Ending (04_ending)

- **Layout**: Centered thank-you + contact card
- **Title**: شكرا لكم
- **Subtitle**: Construisons ensemble la conformité fiscale de demain en Algérie
- **Contact**: حموم إكرام — ikramhamoum00@gmail.com — 0672532599

---

## X. Speaker Notes Requirements

- **Total duration**: 15 minutes
- **Notes style**: Formal academic (Arabic)
- **Presentation purpose**: Defend startup thesis — demonstrate problem validity, solution viability, innovation, market potential, financial feasibility

| Slide | Duration | Notes Focus                             |
| ----- | -------- | --------------------------------------- |
| P01   | 30 sec   | Introduction, greet jury                |
| P02   | 30 sec   | Outline overview                        |
| P03   | 15 sec   | Chapter transition                      |
| P04   | 60 sec   | Problem elaboration + solution pillars  |
| P05   | 15 sec   | Chapter transition                      |
| P06   | 60 sec   | Innovation details with examples        |
| P07   | 15 sec   | Chapter transition                      |
| P08   | 60 sec   | Market sizing + SWOT explanation        |
| P09   | 60 sec   | Business model + revenue streams        |
| P10   | 15 sec   | Chapter transition                      |
| P11   | 60 sec   | Financial projections walkthrough       |
| P12   | 60 sec   | KPI highlights — emphasize VAN, DR, BEP |
| P13   | 15 sec   | Chapter transition                      |
| P14   | 90 sec   | Prototype demo — show working features  |
| P15   | 60 sec   | Roadmap phases explanation              |
| P16   | 30 sec   | Thank you + contact                     |

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

1. viewBox: `0 0 1280 720`
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: write typography & symbols as raw Unicode; HTML named entities FORBIDDEN
8. `marker-start` / `marker-end` conditionally allowed
9. `clipPath` conditionally allowed ONLY on `<image>` elements

### PPT Compatibility Rules:

- `<g opacity="...">` FORBIDDEN (group opacity); set on each child element individually
- Image transparency uses overlay mask layer
- Inline styles only; external CSS and `@font-face` FORBIDDEN
