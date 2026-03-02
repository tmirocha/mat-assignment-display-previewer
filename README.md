# Mat Assignment Display — Previewer

A preview and development tool for building custom mat assignment display layouts for [Trackwrestling](https://www.trackwrestling.com). Design your card template and stylesheet locally, then export production-ready HTML and CSS to plug into Trackwrestling's `MatAssignmentDisplay.jsp` system.

The included card template and stylesheet are a **sample layout** — a starting point meant to be replaced with your own design.

## Getting started

### 1. Serve the previewer

No build step required. Serve the `src/` directory with any static file server:

```bash
cd src && python3 -m http.server 8080
```

Open `http://localhost:8080` to launch the preview environment.

### 2. Create your layout

The previewer loads two files that define the display layout:

| File | Purpose |
|------|---------|
| `src/card-template.html` | The HTML for a single mat card. Uses `[token]` placeholders that Trackwrestling fills with live match data. |
| `src/styles.css` | The stylesheet for the card layout. Exported alongside the HTML. |

These ship with a sample layout to demonstrate the token system and CSS structure. Replace them with your own:

**card-template.html** — Build your card markup using [template tokens](#template-tokens). The outermost element must have class `outer-frame`. Wrap it in a single root `<div>`:

```html
<div class="outer-frame" data-upcoming-depth="[upcomingDepth]">
  <div class="match-card">
    <div class="mat-name">[mat]</div>
    <div class="wrestler">[w1FirstName] [w1LastName] — [w1Team]</div>
    <div class="wrestler">[w2FirstName] [w2LastName] — [w2Team]</div>
    <!-- ...your layout here -->
  </div>
</div>
```

**styles.css** — Write your card styles. The previewer and production system both use these CSS custom properties:

| Property | Description |
|----------|-------------|
| `--columns` | Grid column count. Exported as the `[columns]` placeholder for the JSP. |
| `--rows` | Row count, set at runtime. Useful for responsive layout breakpoints. |
| `--upcoming-bars` | Number of visible upcoming bout bars (0–2). |

### 3. Preview and iterate

Use the toolbar controls to test your layout at different mat counts, column configurations, and aspect ratios. The previewer fills your template with randomized mock data so you can see how it looks with realistic content.

### 4. Export to Trackwrestling

1. Click **Export HTML** — copies your card template to the clipboard
2. Click **Export CSS** — copies your stylesheet to the clipboard
3. In Trackwrestling admin, open the Mat Assignment Display layout editor (`EditMADLayout.jsp`)
4. Paste the HTML and CSS into the appropriate fields
5. Save — the layout is stored in the database and served on the live display page

### Background assets

The previewer references background files from `src/assets/backgrounds/` (gitignored). To use the preview background:

1. Place a `background.png` (poster) and `background.mp4` (video) in `src/assets/backgrounds/`
2. Or remove the `<video>` tag from `src/index.html` if you don't need a background

In production, the exported HTML references backgrounds from S3 via the `BG_VIDEO` constant in `src/js/template.js`. Update that path to match your hosting setup.

## Preview controls

| Control | Description |
|---------|-------------|
| **Mats** | Number of mat cards to display (1–8) |
| **Columns** | Grid column count (1–4) |
| **Upcoming** | How many upcoming bout bars to show per card (0–2) |
| **Screen** | Aspect ratio safe-area preview (Fill, 16:9, 4:3, 21:9, etc.) |
| **Team Scores** | Toggle team scores marquee bar |
| **Randomize Data** | Generate new mock wrestlers, teams, and scores |
| **Simulate Score** | Trigger a random score change to preview animations |
| **Simulate Redraw** | Mimic production innerHTML replacement cycle |
| **Export HTML / CSS** | Copy production-ready template or stylesheet to clipboard |

## Template tokens

Tokens use square bracket syntax: `[tokenName]`. Append `:N` for max character truncation (e.g., `[w1FirstName:10]`).

### Current bout

| Token | Example | Description |
|-------|---------|-------------|
| `[mat]` | Mat 1 | Mat name |
| `[boutType]` | Quarterfinal | Bout round type |
| `[boutNo]` | 42 | Bout number |
| `[weight]` | 165 | Weight class |
| `[w1FirstName]` | John | Wrestler 1 first name |
| `[w1LastName]` | Smith | Wrestler 1 last name |
| `[w1Team]` | Penn State | Wrestler 1 team name |
| `[w1TeamAbbr]` | PSU | Wrestler 1 team abbreviation |
| `[w1Seed]` | 3 | Wrestler 1 seed |
| `[w1Score]` | 12 | Wrestler 1 score |
| `[w1Color]` | #CC0000 | Wrestler 1 color bar hex |
| `[periodName]` | Period 2 | Current period |
| `[clockTime]` | 4:32 | Match clock |
| `[ridingTime]` | 0:24 | Riding time |

All `w1` tokens have `w2` equivalents. Prefix tokens with `ondeck-` or `inhole-` for upcoming bouts (e.g., `[ondeck-w1FirstName]`, `[inhole-weight]`).

## How production rendering works

```
MatAssignmentDisplay.jsp
  ↓ loads layout HTML + CSS from database
  ↓ substitutes [columns] in CSS with configured column count
  ↓ polls GetAssignedMatches.jsp for live match data (every 30s)
  ↓ for each match, replaceCodes() fills [w1FirstName], [mat], [w1Score], etc.
  ↓ assembled HTML inserted into #matAssignDisplayFrame
  ↓ clock/score polling updates elements in-place (500ms–5s intervals)
```

## Score animations

The sample layout includes a score animation system. When a wrestler's score changes, it triggers visual effects (score box flash, expanding ring, delta overlay, row highlight). Two implementations exist:

- **Preview**: `score-animation.js` polls for `.wScore` element changes
- **Production**: A self-bootstrapping `<img onerror>` script embedded in `card-template.html` handles the same detection

If your custom layout doesn't need score animations, you can omit the `<img onerror>` bootstrap from your card template.

## Project structure

```
src/
├── card-template.html    ← Your card template (sample included)
├── styles.css            ← Your stylesheet (sample included)
├── index.html            # Previewer entry point
├── preview.css           # Previewer-only styles (not exported)
├── js/
│   ├── app.js            # Previewer controller
│   ├── template.js       # Token replacement and export helpers
│   ├── data.js           # Mock data generation
│   └── score-animation.js# Score change detection (preview)
└── assets/
    └── backgrounds/      # Local preview backgrounds (gitignored)
```
