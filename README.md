# Mat Assignment Display — Previewer

NCAA wrestling mat assignment display — a card-based layout system for showing live match information across multiple mats on large screens and broadcast displays.

Built as a standalone previewer that exports production-ready HTML and CSS for use in the [Trackwrestling](https://www.trackwrestling.com) webapp.

## Quick start

No build step required. Serve the `src/` directory with any static file server:

```bash
cd src && python3 -m http.server 8080
```

Open `http://localhost:8080` to launch the preview environment.

## Preview controls

| Control | Description |
|---------|-------------|
| **Mats** | Number of mat cards to display (1–8) |
| **Columns** | Grid column count (1–4) |
| **Upcoming** | How many upcoming bout bars to show per card (0–2) |
| **Screen** | Aspect ratio safe-area preview (Fill, 16:9, 4:3, 21:9, etc.) |
| **Randomize Data** | Generate new mock wrestlers, teams, and scores |
| **Simulate Score** | Trigger a random score change to preview animations |
| **Export HTML / CSS** | Copy production-ready template or stylesheet to clipboard |

## How it works

Each mat is rendered from a single card template (`card-template.html`) containing placeholder tokens like `[mat]`, `[w1FirstName]`, `[w1Score]`, etc. The preview fills these with mock data; in production, the Trackwrestling server fills them with live match data.

### Card anatomy

```
┌─────────────────────────────────┐
│ MAT 1              Quarterfinal │  ← Header bar (mat number + rotating bout info)
├─────────────────────────────────┤
│ █ #3 J. SMITH  Penn State   12 │  ← Wrestler 1 (color bar, seed, name, team, score)
│ █ #6 A. JONES  Iowa          8 │  ← Wrestler 2
│                  P2  4:32  0:24│  ← Clock panel (period, time, riding time)
├─────────────────────────────────┤
│ On Deck    A. Lee (PSU) vs ... │  ← Upcoming bout 1
│ In Hole    B. Fox (IOW) vs ... │  ← Upcoming bout 2
└─────────────────────────────────┘
```

### Score animations

When a wrestler's score changes, the system triggers a cascade of visual effects: score box flash and glow, expanding ring, delta overlay (+N), row highlight sweep, and color bar flash. In the preview, `score-animation.js` polls for changes. In production, a self-bootstrapping script embedded in the card template handles this.

## Trackwrestling integration

The exported HTML and CSS are designed to be pasted into Trackwrestling's `EditMADLayout.jsp`, which stores them as a custom layout for `MatAssignmentDisplay.jsp`.

### Export and deploy workflow

1. Configure the display in the preview (mat count, columns, upcoming depth)
2. Click **Export HTML** — copies the card template to clipboard
3. Click **Export CSS** — copies the stylesheet to clipboard
4. In Trackwrestling admin, open the Mat Assignment Display settings
5. Select or create a custom layout and paste the HTML and CSS
6. Save — the layout is stored in the database and used on the live display page

### How production rendering works

```
MatAssignmentDisplay.jsp
  ↓ loads layout HTML + CSS from database
  ↓ substitutes [columns] in CSS with configured column count
  ↓ polls GetAssignedMatches.jsp for live match data (every 30s)
  ↓ for each match, replaceCodes() fills [w1FirstName], [mat], [w1Score], etc.
  ↓ assembled HTML inserted into #matAssignDisplayFrame
  ↓ <img onerror> bootstrap initializes score animations + derives data-rows
  ↓ clock/score polling updates elements in-place (500ms–5s intervals)
```

### Template tokens

Tokens use square bracket syntax. Append `:N` for max character truncation.

| Token | Example output | Description |
|-------|---------------|-------------|
| `[mat]` | Mat 1 | Mat name |
| `[boutType]` | Quarterfinal | Bout round type |
| `[boutNo]` | 42 | Bout number |
| `[weight]` | 165 | Weight class |
| `[w1FirstName:10]` | John | Wrestler 1 first name (max 10 chars) |
| `[w1LastName:16]` | Smith | Wrestler 1 last name |
| `[w1Team:25]` | Penn State | Wrestler 1 team name |
| `[w1TeamAbbr]` | PSU | Wrestler 1 team abbreviation |
| `[w1Seed]` | 3 | Wrestler 1 seed |
| `[w1Score]` | 12 | Wrestler 1 score |
| `[w1Color]` | #CC0000 | Wrestler 1 color bar |
| `[periodName]` | Period 2 | Current period |
| `[clockTime]` | 4:32 | Match clock |
| `[ridingTime]` | 0:24 | Riding time |

Prefix tokens with `ondeck-` or `inhole-` for upcoming bouts (e.g., `[ondeck-w1FirstName]`).

## Project structure

```
src/
├── index.html            # Preview environment
├── card-template.html    # Production card template
├── styles.css            # Production stylesheet
├── preview.css           # Preview-only styles
├── js/
│   ├── app.js            # Preview controller
│   ├── template.js       # Token replacement engine
│   ├── data.js           # Mock data generation
│   └── score-animation.js
└── assets/
    ├── backgrounds/      # Video + poster (S3-hosted in prod)
    └── fonts/            # United Sans family (S3-hosted in prod)
```

## CSS custom properties

The stylesheet uses CSS custom properties for dynamic layout control:

| Property | Default | Description |
|----------|---------|-------------|
| `--columns` | `1` | Grid columns. Exported as `[columns]` placeholder. |
| `--rows` | — | Set at runtime. Controls stacked vs inline team name layout. |
| `--upcoming-bars` | — | Number of visible upcoming bout bars (0–2). |

All card sizing uses `em` units relative to `.outer-frame` font-size, which scales based on `--columns` and viewport/container dimensions.
