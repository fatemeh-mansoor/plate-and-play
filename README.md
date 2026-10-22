# Plate and Play

Cook it, then play it: each episode pairs an Iranian dish with a traditional game.

- `index.html`: English page
- `fa.html`: Persian (RTL) page
- `app.js`: loads the episode from the content sheet and runs the score, shopping list and copy/print buttons

## Content

All text comes from the Google Sheet **Plate and Play: content** (tabs `Episodes`, `Ingredients`, `Steps`; the `راهنما` tab explains how to fill it in). The sheet must stay shared as "anyone with the link can view".

- The page shows the newest episode with `published` = TRUE. Open another one with `?ep=<id>`, e.g. `index.html?ep=2`.
- "More episodes" lists the other published episodes and stays hidden while there is only one.
- If the sheet can't be loaded, the page falls back to episode 1, which is written into the HTML.

No build step: open `index.html` in a browser or serve the folder with any static host (e.g. GitHub Pages).
