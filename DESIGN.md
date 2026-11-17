---
version: alpha
name: chemprocesseng.com
description: Editorial engineering site for process calculations, lessons, data and techno-economics. Built on the JPMorgan Chase web language (light serif headlines, black text, powder-blue pill actions, sienna accents, flat surfaces, a stone page tint with white cards), extended with J.P. Morgan Salt colours for charts and status.
colors:
  primary: "#a6d7f0"
  primary-hover: "#8fcbe9"
  secondary: "#8f5a39"
  tertiary: "#f5f7f8"
  ink: "#000000"
  ink-muted: "#4d5459"
  ink-subtle: "#5f646a"
  link: "#000000"
  focus: "#12647e"
  interactive: "#12647e"
  brand-deep: "#3a2206"
  canvas: "#f5f7f8"
  canvas-alt: "#f2f8fb"
  surface: "#ffffff"
  surface-muted: "#f5f7f8"
  surface-sunken: "#e6e9eb"
  art-1: "#a6d7f0"
  art-2: "#cfe8f5"
  art-3: "#e7f3f9"
  border: "#e5e7eb"
  border-strong: "#b1b5b9"
  rule: "#000000"
  neutral-100: "#e6e9eb"
  neutral-200: "#d3d5d8"
  neutral-300: "#b1b5b9"
  neutral-500: "#72777d"
  neutral-600: "#5f646a"
  neutral-700: "#4c5157"
  neutral-900: "#292e33"
  success: "#006b48"
  warning: "#9e4200"
  error: "#b42318"
  info: "#005ea6"
  logo-badge: "#4c5157"
  logo-letters: "#ffffff"
  logo-accent: "#a6d7f0"
  logo-accent-on-light: "#3a8db5"
  chart-1: "#12647e"
  chart-2: "#ab6528"
  chart-3: "#4676bf"
  chart-4: "#2a8285"
  chart-5: "#697694"
  chart-6: "#9f55c2"
  chart-7: "#6d7c4d"
  chart-8: "#bd5558"
  chart-muted: "#b1b5b9"
  chart-grid: "#e6e9eb"
  seq-1: "#e9f4fa"
  seq-2: "#c9e6f5"
  seq-3: "#a6d7f0"
  seq-4: "#6fb3d6"
  seq-5: "#3a8db5"
  seq-6: "#12647e"
  seq-7: "#094a60"
  div-low-3: "#094a60"
  div-low-2: "#3a8db5"
  div-low-1: "#c9e6f5"
  div-mid: "#f5f7f8"
  div-high-1: "#e3c4a6"
  div-high-2: "#ab6528"
  div-high-3: "#744015"
typography:
  display:
    fontFamily: "Newsreader"
    fontSize: 64px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: "Newsreader"
    fontSize: 45px
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: -0.0067em
  headline-lg:
    fontFamily: "Newsreader"
    fontSize: 44px
    fontWeight: 300
    lineHeight: 1.15
    letterSpacing: -0.005em
  headline-md:
    fontFamily: "Newsreader"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0em
  title-card:
    fontFamily: "system-ui"
    fontSize: 23px
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: 0em
  marker:
    fontFamily: "Newsreader"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.02em
  result:
    fontFamily: "Newsreader"
    fontSize: 30px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: "Open Sans"
    fontSize: 19px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0em
  body-lg:
    fontFamily: "Open Sans"
    fontSize: 19px
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: -0.01em
  body-md:
    fontFamily: "Open Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: -0.01em
  body-sm:
    fontFamily: "Open Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0em
  label-md:
    fontFamily: "Open Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0em
  label-sm:
    fontFamily: "Open Sans"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.01em
  caption:
    fontFamily: "Open Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  mono:
    fontFamily: "IBM Plex Mono"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0em
rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 20px
  lg: 100px
  full: 9999px
spacing:
  2xs: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 84px
  gutter: 24px
  measure: 880px
  sidenote: 280px
  page-max: 1440px
  hero-art: 420px
  hero-overlap: 150px
  hero-inset: 48px
  section: 84px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 10px 48px 10px 24px
    height: 44px
    typography: "{typography.label-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 10px 24px
    height: 44px
    typography: "{typography.label-md}"
  button-secondary-sm:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: 6px 14px
    height: 34px
    typography: "{typography.label-sm}"
  carousel-control:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 34px
  hero-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 40px 44px 30px
    width: 640px
  hero-art:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    height: 420px
  nav-logo:
    src: "/assets/brand/logo.svg"
    size: 52px
    size-mobile: 44px
  result-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 16px
    typography: "{typography.result}"
  result-tile-changed:
    backgroundColor: "{colors.primary}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 44px
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 24px
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.label-sm}"
  figure-caption:
    textColor: "{colors.ink-subtle}"
    typography: "{typography.caption}"
  sidenote:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-sm}"
motion:
  duration:
    fast: 200ms
    base: 400ms
    slow: 700ms
  easing:
    standard: "cubic-bezier(0.4, 0.14, 0.3, 1)"
    enter: "cubic-bezier(0, 0, 0.3, 1)"
    exit: "cubic-bezier(0.4, 0.14, 1, 1)"
  stagger: 60ms
  reduced-motion: crossfade-120ms
---

# Overview

Chemical Process Engineering (chemprocesseng.com) is a site about chemical process engineering for students and engineers, not a personal site about its owner. It is run by Alireza Lotfollahzade, EIT, in Metro Vancouver, and may have several authors; people are named only in bylines, the footer credit and the About page. It has four kinds of content: calculators, lessons, data explorers and techno-economic analyses. Where pages go, the blocks every page must contain, and how pages are published are in `website/SITE-GUIDE.md`; new pages start from `website/page-template.html`.

The visual language comes from jpmorganchase.com: large light serif headlines, black text, a pale stone page with white cards, flat surfaces, pale powder-blue pill buttons and a warm sienna accent. It should read like a well-edited technical report that you can interact with, not like a software product's landing page.

The home page keeps the J.P. Morgan masthead: a wide drawing of rounded columns with a sienna curve, a white card overlapping its lower left, and a featured-story carousel. Below it, the page reads like the rest of the site.

Three ideas hold the design together:

1. **Content first.** Every page opens with the actual thing (a calculation, a figure, a finding), not a slogan.
2. **Engineering conventions are the decoration.** Units, figure numbers, captions, footnotes, sources, dates and an author line do the work that gradients and icons do on generic sites.
3. **Few, deliberate choices.** One display face, one text face, one mono face. One action colour. Charts carry the extra colour, the interface doesn't.

# Colors

## Brand
- `primary` (powder blue, #a6d7f0) is only a fill: the primary button, selected states, and soft highlights. It is too light for text or lines (1.5:1 on white). Always put black text on it (13.6:1).
- `secondary` (sienna, #8f5a39) is the warm accent: secondary button text, sidenote rules, and the occasional editorial marker. Never more than one sienna element per screen section.
- `ink` (#000000) is for headlines and body text. `ink-muted` (#4d5459) is for standfirsts and secondary text, and `ink-subtle` (#5f646a) for captions, table headers and metadata.
- `interactive` and `focus` (#12647e, J.P. Morgan Salt teal 600) are for focus rings, slider tracks, selected chart series and links inside data modules. They are 6.7:1 on white.
- `brand-deep` (#3a2206, Salt "jpmBrown") is reserved for the footer background or a single dark band per page, with white text.

## Logo
The logo is the AL ChE badge in "Graphite and sky": a `logo-badge` graphite rounded square (#4c5157, the same as `neutral-700`), a white shared-stem AL, and ChE in `logo-accent` sky blue (#a6d7f0, the same as `primary`). On light backgrounds without the badge, ChE switches to `logo-accent-on-light` (#3a8db5) so it stays readable. The files are listed in `website/SITE-GUIDE.md`, section 5.
- The logo is the full badge, `logo.svg` (the same artwork as `android-chrome-512x512.png` and `maskable-icon-512x512.png`). The navigation bar shows it at 52 px, 44 px under 640 px, as the home link, followed by the site name "Chemical Process Engineering".
- `logo-icon.svg`, the simplified AL mark with a sky-blue crossbar, is only for browser-tab icons of 32 px and smaller.
- The logo is the only place graphite appears as a fill, and the only place sky blue appears as a letter colour. Neither rule extends to the rest of the interface.
- Do not recolour, stretch, rotate or outline the logo, and keep clear space of at least a quarter of its width around it.

## Page tint and surfaces
- Every page sits on `canvas` (stone, #f5f7f8), the surface colour from the JPMorgan file. Pure white pages felt glaring on long reading pages; the stone tint softens them and keeps the site on-brand.
- On the tinted canvas, the raised layer is white: cards, inputs, result tiles, equations, the hero card, the hero drawing and section bands all switch to `surface` (#ffffff). The rule is simple: canvas is stone, anything you read or touch inside a box is white.
- `canvas-alt` (mist, #f2f8fb) is an approved alternative tint if the stone ever reads too grey next to photography. Use one tint for the whole site, never both.
- If a page must be white (for example a printable view), swap the roles: canvas becomes white and bands, cards and the hero drawing go back to `surface-muted`.
- Text contrast stays above 5.5:1 for `ink-subtle` on either tint, so no text colours change.

## Lines
- `border` (#e5e7eb) for card and input outlines and table row dividers. `border-strong` (#b1b5b9) for input outlines at rest. `rule` (black, 1px) for the line above a figure or a section heading: this is the strongest structural device on the page.

## Status
`success` #006b48, `warning` #9e4200, `error` #b42318 and `info` #005ea6 come from J.P. Morgan Salt. All are at least 6.5:1 on white, so they can be used for text. Pair each with an icon or a word; never rely on colour alone.

## Hero drawing
The home hero drawing uses only `art-1` (powder blue), `art-2` and `art-3` (two lighter steps of it) for the rounded columns, a `chart-1` teal overlay at 18 % opacity across the lower part of each column, and a single 2 px `secondary` sienna curve. The background is white on the tinted canvas. It is decoration, so it is hidden from screen readers.

## Data visualization
The categorical set is J.P. Morgan Salt's categorical palette, reordered so the first two colours are the brand's cool and warm. Every colour is at least 4.5:1 on white, so lines and direct labels can share the series colour.

| Token | Hex | Salt name | Use |
|---|---|---|---|
| chart-1 | #12647e | teal 600 | First or highlighted series |
| chart-2 | #ab6528 | cider 500 | Second series, or the "swing" factor |
| chart-3 | #4676bf | cobalt 500 | Third series |
| chart-4 | #2a8285 | aqua 500 | Fourth series |
| chart-5 | #697694 | slate 500 | Fifth series |
| chart-6 | #9f55c2 | plum 500 | Sixth series |
| chart-7 | #6d7c4d | olive 500 | Credits and offsets |
| chart-8 | #bd5558 | salmon 500 | Eighth series |
| chart-muted | #b1b5b9 | gray 300 | Context series behind a highlighted one |
| chart-grid | #e6e9eb | gray 100 | Gridlines |

Rules:
- Use at most four categorical colours in one chart. Beyond that, highlight one series in `chart-1` and draw the rest in `chart-muted`.
- Label series directly at the end of the line or bar. Use a legend only when direct labels collide.
- Sequential scales (`seq-1` to `seq-7`) run from pale blue through the brand powder blue to deep teal, for heatmaps and loadings.
- Diverging scales run from teal (`div-low-3`, lower than base) through a neutral midpoint (`div-mid`) to sienna (`div-high-3`, higher than base). In cost charts, teal lowers the cost and sienna raises it.
- Totals are black. Never use `primary` powder blue as a line colour.

# Typography

Three families, all free on Google Fonts:
- **Newsreader** (display serif) stands in for J.P. Morgan's proprietary Queens. Use the light 300 weight at 44 px and above, and 400 at 30 px.
- **Open Sans** for text and interface, as on jpmorganchase.com.
- **IBM Plex Mono** for equations, code, file names and package names only.

Scale: display 64/1.2 (home hero and calculator titles), headline-xl 45/1.2 (home section headings), headline-lg 44/1.15, headline-md 30/1.25, headline-sm 19/1.35 (sans, semibold), body-lg 19/1.6 light, body-md 16/1.65, body-sm 14/1.55, caption 13/1.5. On screens narrower than 700 px, display drops to 45 px, headline-xl to 35 px and headline-lg to 32 px.

Three special styles come from the JPMorgan home page:
- `title-card` (system sans, 23 px, light 300) for titles inside home cards and calculator cards, as JPMorgan uses for its H4.
- `marker` (Newsreader 15 px, sienna) for the small editorial markers above headings: "Featured · 01", "Explore", "Open source", and the 01–04 numbers on the home paths.
- `result` (Newsreader 30 px, light 300, tabular figures) for the value in a calculator result tile, with the unit in body-sm ink-muted next to it.

Rules:
- Body text is regular 400. The source site sets body text at 300; that is kept only for `body-lg` standfirsts, where the larger size keeps it legible.
- All numbers in tables, results and charts use tabular figures (`font-variant-numeric: tabular-nums`) and are right-aligned in columns.
- Use real symbols: the minus sign (−), multiplication (×), subscripts (CH₄, C/C₀), thin spaces before units where possible, and en dashes for ranges (10–20 %).
- Headlines are sentence case. No all-caps labels. The only label above a heading is the sienna serif `marker`, in sentence case.
- Measure: running text never wider than 880 px (about 100 characters). The widths live in one place, the `--page-max`, `--measure`, `--sidenote` and `--wide` variables at the top of `/assets/css/site.css`; pages use them with fallbacks instead of fixed pixel values.

# Layout

- 12-column grid, 1440 px max width, 24 px gutters, 40 px page margins (20 px under 700 px).
- Reading pages (lessons, analyses) use an asymmetric split: an 880 px text column and a 280 px sidenote column to its right, 64 px apart (1224 px together, the `--wide` width for figures and tables that span both) for definitions, sources and asides. Under 1000 px, sidenotes drop inline as indented notes.
- Interactive pages (calculators, data) put the control next to the thing it changes: inputs beside results, chart controls directly above the chart.
- Sections are separated by space (84 px, 46 px under 700 px). Reading and data pages also put a 1 px black rule above the section heading. The home page separates sections with space and one white band instead of rules.
- Choose the layout after the content: lists of items are lists, tabular data is a table, and only self-contained interactive modules get a card.
- Nothing on a page scrolls sideways at 375 px wide; wide tables, equations and diagrams scroll inside their own boxes.

# Elevation & Depth

Flat. No shadows on cards, buttons or images. Depth on the home page comes only from overlap: the white hero card sits 150 px up into the drawing. Separation comes from rules, the stone canvas against white cards, and spacing. The only exception is an element that floats over content (a toast, a menu, the back-to-top button): one soft shadow, `0 8px 24px rgba(0,0,0,0.12)`.

# Shapes

Radius follows hierarchy, so it is never the same everywhere:
- `lg` 100 px: primary pill button only.
- `md` 20 px: secondary buttons and segmented controls.
- `full`: the circular ‹ › carousel controls.
- `sm` 8 px: cards, result tiles, number fields and the hero drawing.
- `xs` 4 px: equation blocks and small tags.
- `none` 0 px: the hero card, figures, tables, rules and section bands.

# Components

## Buttons
- Primary: powder-blue pill, black semibold label, 44 px tall, with a right arrow (→) placed in the extra right padding. Use one per view, for the main next step.
- Secondary: transparent with a 1 px black border, sienna label, 20 px radius. A 34 px small version is used for presets.
- Text link: black, underlined with a 1 px underline offset 3 px; the underline thickens on hover. No arrows on links inside running text.
- Card link: black semibold 16 px with a trailing " →", underlined on hover. Used only for the one link that ends a home card or list row.
- Labels say exactly what happens: "Open the calculator", "Copy results", "Download CSV". Never "Get started" or "Learn more".

## Home hero
- A 420 px drawing (260 px under 700 px) across the content width, 8 px radius.
- A white card, up to 640 px wide, overlapping the drawing by 150 px and inset 48 px from the left (80 px overlap and 12 px inset under 700 px). Inside: the `marker` "Featured · 0n", a display headline, one line of body-lg as the standfirst, one primary pill, then the carousel controls.
- Carousel controls: two 34 px circles with a 1 px black border (‹ and ›) around a "1 / 4" count in tabular figures. They fill with `primary` on hover. The carousel moves only when clicked; it never auto-advances.
- Featured stories point to real pages: an analysis, a lesson, a data explorer and a calculator.

## Home sections
- "Explore / Start where you are.": four path cards in a row (two at tablet width, one on mobile), each with a 01–04 marker, a `title-card` title, one sentence, and a bold text link ending in " →". These four are the site's real sections, so the numbers are allowed here.
- "Open-source tools": on a white band, one card per tool with the package name in IBM Plex Mono and a "View on GitHub" link.
- "Latest": a ruled list with three columns (date · type, title, "Read →").

## Navigation
White bar, 72 px tall. On the left, the home link: the full logo (`/assets/brand/logo.svg`) at 52 px followed, 14 px apart, by the site name "Chemical Process Engineering" in Newsreader 22 px. The site name, never a person's name, sits beside the logo. On the right, five text links (Calculators, Lessons, Data, Analysis, About), then the search box. The current section has a 2 px black underline.
- Search box: 220 × 40 px, white, 1 px `border-strong` outline and 20 px radius (the same shape as a secondary control), placeholder "Search", and a magnifier button at its right end that fills with `primary` on hover. The focus ring is `focus` teal. Typing two or more letters shows live results under the box (up to eight, each with its page, section heading and a snippet with the search words marked in `primary`, plus "See all n results"); arrow keys move through them and Enter opens the selected one. Pressing Enter with nothing selected, or the button, opens the search results page. Both use the same index and matching: every word must appear in a section, anywhere inside a word, as in the NPPE guide's own search.
- 641–1140 px: two rows, logo, name and search box first, links below.
- 640 px and narrower: logo at 44 px, the name wraps onto two lines at 18 px, the search box becomes a 44 px round icon button that opens `/search/`, and the five links spread across the second row.
- No other icons, no sticky bar, no blur.
- All of the bar's CSS is in `/assets/css/site.css`, shared by every page; the markup is in `website/SITE-GUIDE.md`, section 3.2.

## Search results page
`/search/?q=words&page=n`. Page header (breadcrumb "Home / Search", headline "Search", standfirst), then a large search field (48 px tall, 8 px radius) with a primary pill "Search". Below it a status line ("1–20 of 60 results for “pressure”."), then a ruled list of results, 20 per page: a meta line (type · page title) in caption, the section heading in Newsreader 24 px as the link, a snippet in body-sm ink-muted with the search words marked in `primary` fill, and the page address in caption. Numbered page links sit under the list as 40 px pill outlines, the current page filled with `primary`, with "‹ Previous" and "Next ›" in sienna. Every word must appear in a result; when no section has all of them, sections with any of them are shown and the status line says so.

## Back-to-top button
A 44 px circle at the bottom right (24 px from the edges, 16 px on phones): white, 1 px black border, an up arrow, filling with `primary` on hover. It appears once the reader has scrolled more than a screen and scrolls back to the top. It floats over content, so it takes the one soft shadow allowed for floating elements. Added to every page by `/assets/js/site.js`.

## Page header
Breadcrumb (body-sm, ink-subtle), headline, one-sentence standfirst in body-lg, then a byline row: author ("Alireza Lotfollahzade, EIT", linked to the author's entry at `/about/#authors`), "Updated" date, reading time or method note. The byline is what makes a page feel written by a person; never omit it.

## Footer
A `brand-deep` band with white text: the site name "Chemical Process Engineering" in Newsreader 22 px, the line "Lessons, calculators and tools for chemical engineering students and engineers.", links to the five sections and GitHub, a contact line ("Found an error, or something on the site not working? Email support@chemprocesseng.com", the address as a `mailto:` link), and a note: "Run by Alireza Lotfollahzade, EIT, in Metro Vancouver", followed by the statement that the content is educational and that codes, standards and company specifications govern real designs.

## Calculator
- Header: breadcrumb, display headline, one-sentence standfirst in body-lg.
- Two columns (inputs slightly narrower than results), stacking under 860 px.
- Inputs card: `title-card` "Inputs"; each field has a semibold label, a teal slider and a 110 px number field with a grey unit suffix (t/d, %); then a row of small secondary preset buttons (Pilot, 10 t/d · Base, 100 t/d · Large, 300 t/d); then a short assumptions list.
- Results: four tiles in a 2 × 2 grid, each with the value in `result` style, the unit beside it and the quantity name below. One column under 520 px.
- Under the tiles, a card with a "› Show the working" toggle that opens a numbered derivation in IBM Plex Mono with the user's own numbers substituted. The chevron turns 90° when open.
- Actions: "Copy results" as the primary pill and "Open the lesson" as the secondary button.
- Below, a full-width "Flowsheet" card with the process diagram and a "Pause flow" text control.

## Figures and charts
- A 1 px black rule above, then a figure number and a title that states the finding ("Figure 2. At 15 % CO₂ the bed breaks through at 42 min").
- Chart directly below, with no card or border around it. Axis labels with units, light gridlines in `chart-grid`, no chart junk.
- Caption below in `caption`: method, assumptions, source and "Illustrative" where it applies.
- The data behind every chart is available as a table and a CSV download.

## Tables
Header row in `label-sm` ink-subtle with a black 1 px rule under it, rows divided by `border`, numbers right-aligned in tabular figures, units in the header ("Cost, M$"), not repeated in every cell.

## Sidenotes and notes
Body-sm in ink-muted, with a 2 px sienna rule on the left when inline. Use them for definitions, sources and caveats so the main text stays readable.

## Equations
Display equations in IBM Plex Mono on a white `surface` block (on `surface-muted` if a page is ever white), 4 px radius, horizontally scrollable on small screens. Number them when the text refers back to them: (1), (2).

# Motion

Motion follows an "editorial calm" pairing: IBM Carbon's expressive curves at slow durations (fast 200 ms, base 400 ms, slow 700 ms).

- Animate in response to what the reader does: changing an input, switching a scenario, sorting, stepping through a lesson, opening the working.
- When values change, update the number and briefly tint its row or result tile in `primary`, fading out over about 1.5 s. Only tiles whose value actually changed are tinted. No counting animations.
- The home carousel slides: the old story leaves 20 px sideways with a fade (fast, exit curve), the new one enters from the other side (base, enter curve). The marker and count update with it.
- The primary pill's arrow moves 3 px right on hover; buttons press to 98 % scale.
- Charts morph between states so the reader can track the change. Stage complex changes: axis first, then marks.
- Nothing else animates on page load or on scroll, except the back-to-top button, which fades in over 200 ms once the reader is a screen down the page. The other exception is the calculator flowsheet: its streams move slowly by default, because the movement shows the direction of flow, and a "Pause flow" control stops them. Under reduced motion they start paused.
- Under `prefers-reduced-motion`, replace movement with a 120 ms crossfade or an instant change; keep the colour feedback.

# Content and voice

- First person, specific and plain: "I keep redoing this balance, so here it is with the working shown."
- Every page names its assumptions and marks illustrative numbers as illustrative. Never invent statistics.
- Dates are absolute ("6 November 2026"). Units are SI with the engineering conventions of the field (t/d, MW, bar, $/kg H₂).
- The site speaks about engineering, not about its owner. Name people only in bylines, the footer credit and the About page, where every author is listed.
- The owner's name is written "Alireza Lotfollahzade". Professional title: he is an EIT. Write "Alireza Lotfollahzade, EIT" wherever he is named with a role. Never call him an engineer, process engineer or chemical engineer without "EIT" beside it, and never write "P.Eng.". Describe the field instead: "process engineering", "chemical process engineering".

# Do's and Don'ts

## Do
- Open pages with the content itself: a calculation, a figure or a finding.
- Use figure numbers, captions, sources, footnotes and a byline.
- Use rules, space, the stone canvas and white cards for structure.
- Keep the JPMorgan home masthead: column drawing, overlapping white card, ‹ 1 / 4 › controls.
- Use the Salt chart palette, label series directly, and grey out context.
- Keep one primary pill per view and say exactly what it does.

## Don't
- Don't use gradients, glass effects, glows or drop shadows on content.
- Don't use rows of identical icon cards, or wrap every block in a rounded card. The four home path cards are the one row of matching cards on the site.
- Don't put all-caps eyebrow labels or monospace labels above headings. Use numbered markers (01–04) only for the home paths and real sequences such as lesson steps.
- Don't animate counters, fade sections in on scroll, auto-advance the carousel, or bounce anything.
- Don't mix page tints, or put a stone card on a stone page.
- Don't use powder blue for text or chart lines, or more than one sienna accent per section.
- Don't use generic copy ("Elevate your workflow", "Get started") or placeholder people and companies.
- Don't use emoji as icons.
- Don't write the old domain alirezamoghaddam.com or the old name Alireza Moghaddam, don't put a person's name in the navigation bar, and don't add scripts that disable links depending on the domain.
- Don't copy the navigation, search, footer or back-to-top styles into a page; they live only in `/assets/css/site.css`.
