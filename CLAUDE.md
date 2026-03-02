# Mat Assignment Display — Previewer

## Project overview

Preview/development tool for building NCAA wrestling mat assignment display layouts. Outputs production-ready HTML and CSS that gets pasted into the Trackwrestling webapp's `MatAssignmentDisplay.jsp` via `EditMADLayout.jsp`.

## Architecture

```
src/
  index.html            # Preview environment entry point
  card-template.html    # Production card template (exported artifact)
  styles.css            # Production CSS (exported artifact)
  preview.css           # Preview-only overrides (not exported)
  js/
    app.js              # Preview controller, rendering, export, settings
    template.js         # Template token replacement, export helpers
    data.js             # Mock data generation (teams, wrestlers, scores)
    score-animation.js  # Score change detection and animation (preview watcher)
  assets/
    backgrounds/        # Local preview backgrounds (S3-hosted in production)
    fonts/              # United Sans font files (S3-hosted in production)
```

## Key concepts

### Template token system
Card template uses `[tokenName]` placeholders (e.g., `[w1FirstName]`, `[mat]`, `[w1Score]`). Optional length truncation via `[tokenName:N]`. Prefixes `ondeck-` and `inhole-` scope tokens to upcoming bouts.

### Two rendering contexts
- **Preview**: `app.js` calls `fillTemplate()` which replaces tokens from mock data. The `<img onerror>` bootstrap script is stripped out — `score-animation.js` handles animations instead.
- **Production (JSP)**: `assignedMatchesReady()` calls `assignedMatches[i].replaceCodes(l, prefix)` to fill tokens from live data. The `<img onerror>` bootstrap in card-template.html initializes score animations and derives `data-rows` for layout.

### CSS custom properties
- `--columns`: Set in `:root` as `1` default. Exported CSS replaces it with `[columns]` placeholder; the JSP substitutes the actual column count.
- `--rows`: Set on the grid element by `app.js` in preview. In production, derived by the `<img onerror>` bootstrap from card count / `[columns]`.
- `--upcoming-bars`: Controls upcoming bout bar visibility (0-2).

### Export flow
1. "Export HTML" copies card-template.html (with `[upcomingDepth]` baked to current value)
2. "Export CSS" copies styles.css (with `--columns: 1` replaced to `--columns: [columns]`)
3. User pastes both into `EditMADLayout.jsp` in Trackwrestling
4. JSP stores in `tbl_*_mad_layouts`, retrieves on page load, applies `[columns]` substitution

### data-rows derivation
Row count determines stacked vs inline team name layout (< 6 rows = stacked). Derived at runtime:
- **Preview**: `app.js` sets `data-rows` on each `.outer-frame` after rendering
- **Production**: `<img onerror>` bootstrap computes `Math.ceil(frames.length / [columns])` and stamps each `.outer-frame`

## Trackwrestling integration

### JSP variants (all share same pattern)
- `predefinedtournaments/MatAssignmentDisplay.jsp`
- `opentournaments/MatAssignmentDisplay.jsp`
- `freestyletournaments/MatAssignmentDisplay.jsp`
- `teamtournaments/MatAssignmentDisplay.jsp`

### Production data flow
`getAssignedMatches()` polls `GetAssignedMatches.jsp` every 30s (configurable). Response is pipe-delimited match data parsed into `AssignedMatch` objects. `assignedMatchesReady()` iterates matches, calls `replaceCodes()` on the stored template, assembles into a table, and sets `matAssignDisplayFrame.innerHTML`.

### Live updates
- Match data: polled via `getAssignedMatches()` interval
- Clock/period/score: polled via `getClockStates()` at 500ms-5s intervals
- Score animations: `<img onerror>` bootstrap runs a 250ms `setInterval` watching `.wScore` elements for value changes

## Commands

This is a static site. Serve from `src/`:
```
cd src && python3 -m http.server 8080
```

## Code style

- ES6 modules in preview JS (`import`/`export`)
- No build step or bundler
- The `<img onerror>` script in card-template.html is intentionally minified on a single line — it must remain a self-contained inline script for production
- CSS uses `em` units relative to `.outer-frame` font-size for scalable card sizing
- Template tokens use square bracket syntax: `[name]` or `[name:maxLength]`
