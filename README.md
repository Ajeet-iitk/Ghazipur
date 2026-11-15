# Ghazipur — a living portrait

A dynamic, bilingual (English / हिन्दी / Hinglish) website about Ghazipur on the Ganga.
Light and dark modes, mobile friendly, with background music, ambient animation and sound effects.

![Hero](assets/img/screens/hero.png)

## Highlights

- **Day and night, blended smoothly.** By day, kids play on the ghat and a fisherman casts his net. At night, the Ganga Aarti begins, diyas are lit along the steps, and people sit and watch.
- **Naav** — a small-boat game. Row, steer, collect floating diyas, with water and oar sound effects. A **Night lantern** level lights only your lamp, and cross-currents shove the boat sideways.
- **Season switch** — Summer (the river thins, sandbars rise), Clear, or Monsoon (rain, thunder, a swollen river flooding the lower ghat steps).
- **Wildlife spotter** — Gangetic dolphins, bar-headed geese and ruddy shelduck cross the river now and then. Tap them when they appear.
- **The Opium Factory yard** — a working crew (loaders carrying sacks, a screw press, sorters, a crane, a foreman, a watchman), an operable narrow-gauge trolley, and an industrial siren that sends everyone hurrying.
- **Explore** section listing every creative piece on the site.
- Audio controller, language switch, theme switch, search, and a custom favicon.

| Night | The yard | Places |
|---|---|---|
| ![Night](assets/img/screens/night-hero.png) | ![Poppy](assets/img/screens/poppy.png) | ![Places](assets/img/screens/places.png) |

| River | Explore | Mobile |
|---|---|---|
| ![River](assets/img/screens/river.png) | ![Explore](assets/img/screens/explore.png) | ![Mobile](assets/img/screens/mobile-hero.png) |

## Run locally

No build step. Open `index.html`, or serve the folder:

```
python -m http.server 8000
```

## Structure

- `index.html` — page
- `assets/css/style.css` — styles
- `assets/js/scene.js` — canvas scene (day/night, ghat life)
- `assets/js/naav.js` — boat game
- `assets/js/nature.js` — season switch and wildlife spotting
- `assets/js/yard.js` — the factory crew animation
- `assets/js/audio.js` — music and sound effects (Web Audio)
- `assets/js/i18n.js`, `assets/js/app.js` — languages and interactions
