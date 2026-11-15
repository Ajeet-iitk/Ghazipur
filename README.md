# Ghazipur — a living portrait

A dynamic, bilingual (English / हिन्दी / Hinglish) website about Ghazipur on the Ganga.
Light and dark modes, mobile friendly, with background music, ambient animation and sound effects.

![Hero](assets/img/screens/hero.png)

**Everything on the site is drawn in code (canvas, SVG and Web Audio), apart from two short audio clips. No framework, no build step.** The home view reacts to the weather, the time of day and your clicks; every chapter has something to play with, and the Explorer's Dial lists all of it.

## Highlights

- **Day and night, blended smoothly.** By day, kids play on the ghat and a fisherman casts his net. At night, the Ganga Aarti begins, diyas are lit along the steps, and people sit and watch.
- **The Ashoka Pillar at Latiya** — haul the ~30 ft pillar upright with a rope, then decode its Brahmi-style writing in a short game.
- **Naav** — a small-boat game. Row, steer, collect floating diyas, with water and oar sound effects. A **Night lantern** level lights only your lamp, and cross-currents shove the boat sideways.
- **Season switch** — a boy flies a kite from the ghat in clear weather and summer. Summer (the river thins, sandbars rise; the kids wade out to play there and more children follow), Clear (more people walk the ghat; people bathe, pray and dive in the Ganga), or Monsoon (rain, thunder, a swollen river; the kids run up the steps, scared). People walk to wherever the weather sends them, one after another.
- **Wildlife spotter** — Gangetic dolphins, bar-headed geese and ruddy shelduck cross the river now and then. Tap them when they appear.
- **The Opium Factory yard** — a working crew (loaders carrying sacks, a screw press, sorters, a crane, a foreman, a watchman), an operable narrow-gauge trolley, and an industrial siren that sends everyone hurrying.
- **Temple bells and a hidden diya** — three brass bells hang under the chhatri on the ghat: click them on desktop, shake your phone on mobile. A tiny lamp in the hero corner floats diyas onto the river.
- **The kitchen corner** (a second easter egg) — with cooks who blink, smile and clap, and a child who cheers: roast litti on embers and serve them, mash a chokha from six ingredients, or fry launglata and dip it in syrup.
- **The artists' corner** (an easter egg) — peek inside to draw your own mirrored chowk, drop petals into a copper rose-water still, or weave a bamboo soop.
- **The Chhathi Maiya song** — tap the Chhath card to play it, with a floating player (seek, ±10 s, repeat, volume); the soundtrack ducks while it plays.
- **The living year** — the five festivals as little animated scenes you can poke (raise the arghya, add a diya, call the lightning), plus "Match Ghazipur", a memory game with ten things of the district (twins or name-it modes, three levels, timer, streaks, peek and hint, a collection panel).
- **The eye** — a button in the navbar fades the whole page away so you can simply watch the home view; a slow day drifts by (or pick Dawn, Noon, Dusk, Night, and Summer, Clear or Monsoon), and the scene stays clickable. Esc or the eye brings the page back.
- **A navbar on the water** — it slides away as you scroll down and returns when you scroll up; a boat sails along the header as a scroll-progress river, a wave glides under the links and rests under your chapter, the brand diya flickers and wakes on hover, and the links drop in one by one.
- **The time machine** — the Story chapter as one riverbank diorama that grows across eleven eras, with a layers-of-silt selector, a rolling year counter and a "run the centuries" play button.
- **Eight rivers, one slow current** — a full-width river-system panorama: the Ganga across the page, seven rivers flowing in, boats and lamps on the water, a ferry at Ghazipur. Hover or tap a river.
- **The riverfront** — nine ghats drawn as one swipeable panorama, alive with walkers, a chai-wala, a flower seller, a pandit and a kulfi cart, cows, goats, a dog, pigeons and a monkey, trees, birds and kites, a flowing river with drifting boats, garlands and diyas, and leaping fish. Tap a ghat and the boatman rows to it, or take the tour.
- **A small Google Map strip** above the footer, loaded only when you scroll near it, with an "Open in Google Maps" link.
- **The Explorer's Dial** — every feature as a small coloured tile (filter by Play, Sound, Sky & weather, Go to). A stage card shows and launches the chosen one, with orbiting rings, and it cycles through them on its own.
- **Home-screen details** — click the water and it drips (only on the home view); click near a boat and it rocks; a boy flies a kite; kids, bathers, a diver, walkers, wildlife.
- Audio controller, language switch (English / हिन्दी / Hinglish), day and night theme, command search, and a custom favicon.

| Clear day | Monsoon | Summer |
|---|---|---|
| ![Hero](assets/img/screens/hero.png) | ![Monsoon](assets/img/screens/monsoon.png) | ![Summer](assets/img/screens/summer.png) |

| Night | The riverfront | Eight rivers |
|---|---|---|
| ![Night](assets/img/screens/night-hero.png) | ![Riverfront](assets/img/screens/riverfront.png) | ![Rivers](assets/img/screens/river.png) |

| Time machine | The living year | Explorer's Dial |
|---|---|---|
| ![Story](assets/img/screens/story.png) | ![Living](assets/img/screens/living.png) | ![Explore](assets/img/screens/explore.png) |

| Mobile home | Mobile riverfront | Mobile Explore |
|---|---|---|
| ![Mobile](assets/img/screens/mobile-hero.png) | ![Mobile riverfront](assets/img/screens/mobile-riverfront.png) | ![Mobile Explore](assets/img/screens/mobile-explore.png) |

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
- `assets/js/navfx.js` — the navbar animations
- `assets/js/ghats.js` — the illustrated riverfront
- `assets/js/festivals.js` — animated festival scenes and the match game
- `assets/js/artnook.js` — the artists' corner easter egg (chowk, rose still, soop)
- `assets/js/kitchen.js` — the kitchen corner easter egg (litti, chokha, launglata)
- `assets/audio/` — `drip.mp3` (water click) and `chhathi-maiya.mp3` (the Chhath song)
- `assets/js/audio.js` — music and sound effects (Web Audio)
- `assets/js/i18n.js`, `assets/js/app.js` — languages and interactions
