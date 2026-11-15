# Ghazipur — a living portrait

A dynamic, bilingual (English / हिन्दी / Hinglish) website about Ghazipur on the Ganga.
Light and dark modes, mobile friendly, with background music, ambient animation and sound effects.

![Hero](assets/img/screens/hero.png)

## Highlights

- **Day and night, blended smoothly.** By day, kids play on the ghat and a fisherman casts his net. At night, the Ganga Aarti begins, diyas are lit along the steps, and people sit and watch.
- **The Ashoka Pillar at Latiya** — haul the ~30 ft pillar upright with a rope, then decode its Brahmi-style writing in a short game.
- **Naav** — a small-boat game. Row, steer, collect floating diyas, with water and oar sound effects. A **Night lantern** level lights only your lamp, and cross-currents shove the boat sideways.
- **Season switch** — Summer (the river thins, sandbars rise; the kids wade out to play there and more children follow), Clear (more people walk the ghat; people bathe, pray and dive in the Ganga), or Monsoon (rain, thunder, a swollen river; the kids run up the steps, scared). People walk to wherever the weather sends them, one after another.
- **Wildlife spotter** — Gangetic dolphins, bar-headed geese and ruddy shelduck cross the river now and then. Tap them when they appear.
- **The Opium Factory yard** — a working crew (loaders carrying sacks, a screw press, sorters, a crane, a foreman, a watchman), an operable narrow-gauge trolley, and an industrial siren that sends everyone hurrying.
- **Temple bells and a hidden diya** — three brass bells hang under the chhatri on the ghat: click them on desktop, shake your phone on mobile. A tiny lamp in the hero corner floats diyas onto the river.
- **The living year** — the five festivals as little animated scenes you can poke (raise the arghya, add a diya, call the lightning), plus "Match Ghazipur", a memory game with ten things of the district (twins or name-it modes, three levels, timer, streaks, peek and hint, a collection panel).
- **The time machine** — the Story chapter as one riverbank diorama that grows across eleven eras, with a layers-of-silt selector, a rolling year counter and a "run the centuries" play button.
- **Eight rivers, one slow current** — a full-width river-system panorama: the Ganga across the page, seven rivers flowing in, boats and lamps on the water, a ferry at Ghazipur. Hover or tap a river.
- **The riverfront** — nine ghats drawn as one swipeable panorama; tap a ghat and the boatman rows to it, or take the tour. A ferry crosses to Tari Ghat.
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
- `assets/js/pillar.js` — the Ashoka Pillar game
- `assets/js/rivers.js` — the full-width river-system panorama
- `assets/js/story.js` — the Story chapter time machine
- `assets/js/ghats.js` — the illustrated riverfront
- `assets/js/festivals.js` — animated festival scenes and the match game
- `assets/js/audio.js` — music and sound effects (Web Audio)
- `assets/js/i18n.js`, `assets/js/app.js` — languages and interactions
