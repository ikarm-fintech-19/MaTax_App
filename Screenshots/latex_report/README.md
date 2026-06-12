# LaTeX Report - MaTax Thesis

This folder contains the LaTeX version of the MaTax thesis, following academic writing standards.

## Files

- `thesis.tex` - The main LaTeX file (865 lines)
- `README.md` - This file

## Document Structure

The thesis follows the standard academic structure:

1. **Title Page** - University information, committee members
2. **Abstract** - Arabic and English abstracts with keywords
3. **Table of Contents** - Auto-generated
4. **List of Figures** - Auto-generated
5. **List of Tables** - Auto-generated
6. **Dedication** - Personal dedication
7. **Acknowledgments** - Thanks and appreciation
8. **Chapter 1: Introduction** - Research background, problem, objectives, methodology
9. **Chapter 2: Theoretical Framework** - Concepts and theories
10. **Chapter 3: Legal Framework** - Algerian tax legislation
11. **Chapter 4: Methodology** - Platform design and technical analysis
12. **Chapter 5: Strategic Analysis** - Market analysis, SWOT, PESTEL
13. **Chapter 6: Prototype** - Platform demonstration
14. **Chapter 7: Conclusion** - Summary, recommendations
15. **Bibliography** - Arabic, French, and electronic references
16. **Appendices** - Tax forms, user guide, team structure, technical specs

## How to Compile

### Prerequisites

You need a LaTeX distribution with XeLaTeX support:
- **Windows**: [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/)
- **macOS**: [MacTeX](https://www.tug.org/mactex/)
- **Linux**: `sudo apt-get install texlive-xetex texlive-fonts-recommended texlive-fonts-extra texlive-lang-arabic`

### Compilation Commands

#### Using XeLaTeX (Recommended for Arabic support)

```bash
xelatex thesis.tex
xelatex thesis.tex  # Run twice for table of contents
```

#### Using latexmk (Automatic)

```bash
latexmk -xelatex thesis.tex
```

### Output

After compilation, you will get:
- `thesis.pdf` - The compiled PDF document

## Arabic Support

This document uses XeLaTeX with the `polyglossia` package for Arabic support. The main font is set to "Traditional Arabic" which should be installed on your system.

## Academic Writing Standards

The document follows these academic writing standards:
- **Font**: Traditional Arabic (12pt)
- **Spacing**: 1.5 line spacing
- **Margins**: 1 inch (2.54 cm)
- **Citations**: APA 7.0 style
- **Structure**: IMRaD-like format adapted for Arabic theses
- **Language**: Bilingual (Arabic and English abstracts)

## Troubleshooting

If you encounter font issues:
1. Make sure "Traditional Arabic" font is installed
2. Try changing the font in the preamble to a different Arabic font
3. Check that your LaTeX distribution has Arabic language support

If you encounter compilation errors:
1. Check that all packages are installed
2. Verify that the font paths are correct
3. Ensure XeLaTeX is used (not pdfLaTeX)

## Notes

- The document uses the `report` document class
- Page layout: A4 paper with 1-inch margins
- Font size: 12pt
- Line spacing: 1.5
- Includes hyperlinks for digital versions
- Supports bilingual content (Arabic and English)
