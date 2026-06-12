# MaTax Thesis Defense - Spec Lock

> Machine-readable execution contract. Executor re-reads before every SVG page.
> On divergence with design_spec.md, THIS FILE WINS.

## canvas

- format: ppt169
- width: 1280
- height: 720
- viewBox: 0 0 1280 720

## colors

| name             | hex                             | role                                   |
| ---------------- | ------------------------------- | -------------------------------------- |
| bg               | #FFFFFF                         | Page background                        |
| bg_secondary     | #F8FAFC                         | Card/section backgrounds               |
| primary          | #00527F                         | Headers, title bars, decorations       |
| accent           | #D62828                         | Data highlights, CTAs, warnings        |
| accent_secondary | #F77F00                         | Secondary accents, decorative elements |
| accent_tertiary  | #FCD916                         | Tertiary accents, highlights           |
| accent_light     | #31ACEA                         | Light blue accents                     |
| dark             | #023A51                         | Dark backgrounds, shadows              |
| text             | #1E293B                         | Body text                              |
| text_secondary   | #44546A                         | Captions, footnotes                    |
| text_tertiary    | #94A3B8                         | Page numbers                           |
| border           | #E2E8F0                         | Card borders                           |
| success          | #16A34A                         | Positive KPIs                          |
| warning          | #D62828                         | Risk indicators                        |
| gradient         | #F77F00→#D62828→#00527F→#FCD916 | Decorative gradient                    |

## typography

| role          | font_family                     | font_size | font_weight |
| ------------- | ------------------------------- | --------- | ----------- |
| title         | Montserrat, Arial, sans-serif   | 58        | bold        |
| chapter_title | Montserrat, Arial, sans-serif   | 56        | bold        |
| page_title    | Montserrat, Arial, sans-serif   | 28        | bold        |
| hero_number   | Montserrat, Arial, sans-serif   | 40        | bold        |
| subtitle      | Montserrat, Arial, sans-serif   | 38        | 600         |
| body          | "Lato Light", Arial, sans-serif | 20        | 400         |
| caption       | "Lato Light", Arial, sans-serif | 16        | 400         |
| footnote      | "Lato Light", Arial, sans-serif | 12        | 400         |

## icons

- library: tabler-outline
- stroke_width: 2
- inventory:
  - tabler-outline/clipboard-check
  - tabler-outline/calculator
  - tabler-outline/bell
  - tabler-outline/cloud
  - tabler-outline/shield-check
  - tabler-outline/chart-bar
  - tabler-outline/users
  - tabler-outline/target
  - tabler-outline/trending-up
  - tabler-outline/calendar
  - tabler-outline/building
  - tabler-outline/award
  - tabler-outline/routes
  - tabler-outline/world

## images

| filename                | status   | acquire_via | no_crop | layout_pattern                        |
| ----------------------- | -------- | ----------- | ------- | ------------------------------------- |
| prototype_dashboard.png | Existing | user        | no-crop | #38 background image + native overlay |
| prototype_g50.png       | Existing | user        | no-crop | #38 background image + native overlay |
| prototype_irg.png       | Existing | user        | no-crop | #38 background image + native overlay |

## page_rhythm

| page | rhythm    |
| ---- | --------- |
| P01  | breathing |
| P02  | dense     |
| P03  | breathing |
| P04  | dense     |
| P05  | breathing |
| P06  | dense     |
| P07  | breathing |
| P08  | dense     |
| P09  | dense     |
| P10  | breathing |
| P11  | dense     |
| P12  | breathing |
| P13  | breathing |
| P14  | dense     |
| P15  | dense     |
| P16  | breathing |

## page_layouts

| page | layout_template |
| ---- | --------------- |
| P01  | 01_cover.svg    |
| P02  | 02_toc.svg      |
| P03  | 02_chapter.svg  |
| P04  | 03_content.svg  |
| P05  | 02_chapter.svg  |
| P06  | 03_content.svg  |
| P07  | 02_chapter.svg  |
| P08  | 03_content.svg  |
| P09  | 03_content.svg  |
| P10  | 02_chapter.svg  |
| P11  | 03_content.svg  |
| P12  | 03_content.svg  |
| P13  | 02_chapter.svg  |
| P14  | 03_content.svg  |
| P15  | 03_content.svg  |
| P16  | 04_ending.svg   |

## page_charts

| page | chart_template        |
| ---- | --------------------- |
| P04  | icon_grid             |
| P08  | quadrant_text_bullets |
| P11  | consulting_table      |
| P12  | kpi_cards             |
| P14  | comparison_table      |
| P15  | roadmap_vertical      |
| P16  | team_roster           |
