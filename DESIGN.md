# Design System

## Typography

- Display Font: `Lexend`
- Body Font: `Source Sans 3`
- Arabic Font: `Cairo`

## Colors

### Brand Colors

- Primary: `oklch(0.54 0.25 263)` / `#6366F1` (Indigo-500)
- Secondary: `oklch(0.62 0.29 280)` / `#8B5CF6` (Violet-500)
- Brand Dark: `oklch(0.21 0.034 255)` / `#1E293B` (Slate-800)

### Neutral Colors

- Canvas: `oklch(0.985 0.005 250)` / `#F8FAFC` (Slate-50)
- Surface: `oklch(1 0 0)` / `#FFFFFF`
- Ink: `oklch(0.18 0.02 255)` / `#0F172A` (Slate-900)
- Muted: `oklch(0.44 0.02 250)` / `#475569` (Slate-600)
- Border: `oklch(0.93 0.01 250)` / `#E2E8F0` (Slate-200)

### Feedback Colors

- Destructive: `oklch(0.58 0.22 27)` / `#DC2626`
- Success: `oklch(0.69 0.19 163)` / `#10B981` (Emerald-500)
- Warning: `oklch(0.78 0.15 75)` / `#F59E0B` (Amber-500)

## Elevation & Layers

The interface uses flat tonal layering and precise borders instead of fuzzy shadows. Shadows are reserved solely for dropdown menus and floating modals.

1. **Canvas Layer (`--color-background`)**: Page-level default canvas container.
2. **Surface Layer (`--color-surface`)**: Default container for cards, sidebars, and form fields.
3. **Elevated Surface (`--color-surface-elevated`)**: Accentuated elements, headers, active states, or overlays.

## Components & Elements

- **Inputs**: Border `oklch(0.93 0.01 250)` (Slate-200), focus outline/ring utilizing primary Indigo with `0.45` alpha. Font uses `Source Sans 3` for French, and `Cairo` for Arabic.
- **Buttons**: Primary has background Indigo, white text. Secondary has neutral border with slate text. Active and hover states have slightly deeper tint.
- **Layout Grid**: Consistent use of responsive grid classes (e.g. `grid-cols-1 md:grid-cols-3` or `lg:grid-cols-12`) with flat slate borders to divide areas cleanly.

## Do's & Don'ts

- **Do**: Always provide clear tooltips or reference tags next to inputs (e.g. _Article 104 LF 2026_).
- **Do**: Rely on borders (`border-border`) and background shifts (`bg-background` vs `bg-surface`) to separate functional regions rather than adding shadows.
- **Do**: Mirror LTR and RTL styling carefully (Arabic text needs larger line heights and the Cairo font family).
- **Don't**: Introduce highly saturated background gradients on workspace cards.
- **Don't**: Mix multiple corner radius values arbitrarily; follow the system (`6px` for small indicators, `8px` for inputs/inner buttons, `10px` for main cards).
