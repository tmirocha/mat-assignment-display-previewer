# Mat Assignment Display — Previewer

## Project overview

Preview/development tool for building custom mat assignment display layouts for Trackwrestling. Outputs production-ready HTML and CSS that gets pasted into the Trackwrestling webapp's `MatAssignmentDisplay.jsp` via `EditMADLayout.jsp`.

The included `card-template.html` and `styles.css` are a **sample layout** — a starting point meant to be replaced with a custom design.

## Architecture

```
src/
  index.html            # Previewer entry point (controls + iframe host)
  frame.html            # Iframe inner page (production styles + preview grid)
  card-template.html    # Card template — sample included (exported artifact)
  styles.css            # Stylesheet — sample included (exported artifact)
  preview.css           # Previewer-only overrides (not exported)
  js/
    app.js              # Previewer controller, rendering, export, settings
    template.js         # Template token replacement, export helpers
    data.js             # Mock data generation (teams, wrestlers, scores)
    score-animation.js  # Score change detection and animation (preview watcher)
  assets/
    backgrounds/        # Local preview backgrounds (S3-hosted in production)
```

## Key concepts

### Template token system
Card template uses `[tokenName]` placeholders (e.g., `[w1FirstName]`, `[mat]`, `[w1Score]`). Optional length truncation via `[tokenName:N]`. Prefixes `ondeck-` and `inhole-` scope tokens to upcoming bouts.

### Iframe isolation
The previewer renders production content inside an `<iframe>` (`frame.html`). `index.html` hosts the preview controls and the iframe. `frame.html` loads production `styles.css` and contains a minimal `<style>` block for the preview grid layout (using `vw`/`vh` units). All production DOM access in `app.js` goes through `innerDoc` (the iframe's `contentDocument`), gated by `waitForIframe()` at startup. `score-animation.js` accepts a `doc` parameter to operate inside the iframe.

### Two rendering contexts
- **Preview**: `app.js` calls `fillTemplate()` which replaces tokens from mock data. The `<img onerror>` bootstrap script is stripped out — `score-animation.js` handles animations instead.
- **Production (JSP)**: `assignedMatchesReady()` calls `assignedMatches[i].replaceCodes(l, prefix)` to fill tokens from live data. The `<img onerror>` bootstrap in card-template.html initializes score animations and derives `data-rows` for layout.

### CSS custom properties
- `--columns`: Set in `:root` as `1` default. Exported CSS replaces it with `[columns]` placeholder; the JSP substitutes the actual column count.
- `--rows`: Set on the iframe document root by `app.js` in preview. In production, derived by the `<img onerror>` bootstrap from card count / `[columns]`.
- `--upcoming-bars`: Controls upcoming bout bar visibility (0-2).

### Export flow
1. "Export HTML" copies card-template.html (with `[upcomingDepth]` baked to current value)
2. "Export CSS" copies styles.css (with `--columns: 1` replaced to `--columns: [columns]`)
3. User pastes both into `EditMADLayout.jsp` in Trackwrestling
4. JSP stores in `tbl_*_mad_layouts`, retrieves on page load, applies `[columns]` substitution

### data-rows derivation
Row count determines layout breakpoints (e.g., stacked vs inline team names in the sample). Derived at runtime:
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
