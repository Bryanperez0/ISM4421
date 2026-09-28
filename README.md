# ISM4421

This repo holds two separate Netlify sites:

| Folder | App | Netlify base directory |
|---|---|---|
| `weather-app/` | Owl Weather (FAU-branded weather) | `weather-app` (root `netlify.toml`) |
| `nfl-analytics/` | Prop Lab: NFL player prop analytics (research only, not a sportsbook) | `nfl-analytics` (see `nfl-analytics/README.md`) |

## Owl Weather (FAU weather app)

A weather app branded for Florida Atlantic University. Defaults to FAU's Boca Raton campus.
Uses the free [Open-Meteo](https://open-meteo.com/) APIs, so there are no API keys or logins.

Features:
- Current conditions: temperature, feels like, humidity, wind, rain chance, UV, sunrise and sunset
- Next 24 hours and 7-day forecast
- City search (Open-Meteo geocoding)
- "My location" button and a "FAU Boca" button to jump back home
- °F / °C toggle (remembered in the browser)

### Files

```
netlify.toml            Netlify settings (publishes the weather-app folder, no build step)
weather-app/
  index.html            Page layout
  styles.css            FAU colors (blue #003366, red #CC0000)
  app.js                Open-Meteo calls and rendering
  _redirects            Sends any path to index.html
  assets/fau-logo.svg   Logo (placeholder, see below)
```

### Run locally

Open `weather-app/index.html` in a browser, or serve the folder:

```
cd weather-app
python3 -m http.server 8000
```

Then go to http://localhost:8000.

### Deploy to Netlify

Option A: connect the GitHub repo (auto-deploys on every push)
1. In Netlify, choose **Add new site > Import an existing project > GitHub**.
2. Pick this repo and the branch you want to deploy.
3. Leave build settings as they are. `netlify.toml` already sets the base directory to
   `weather-app`, no build command, and publishes that folder.
4. Click **Deploy**.

Option B: drag and drop
1. Go to https://app.netlify.com/drop.
2. Drag the `weather-app` folder onto the page.

### Logo

`weather-app/assets/fau-logo.svg` is a simple "FAU" placeholder. To use the official
logo, download it from FAU's brand resources and save it over that file with the same
name (or update the two `fau-logo.svg` references in `index.html` if you use a PNG).
The FAU name and logo are trademarks of Florida Atlantic University.
