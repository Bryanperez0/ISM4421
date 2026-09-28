// Owl Weather - FAU-themed weather app using the free Open-Meteo APIs (no API key needed).

const FAU_BOCA = {
  name: "FAU Boca Raton",
  detail: "Boca Raton, Florida",
  latitude: 26.3705,
  longitude: -80.1024,
};

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const UNIT_KEY = "owl-weather-unit";

// WMO weather codes -> label + icon (https://open-meteo.com/en/docs)
const WEATHER_CODES = {
  0: ["Clear sky", "☀️", "🌙"],
  1: ["Mainly clear", "🌤️", "🌙"],
  2: ["Partly cloudy", "⛅", "☁️"],
  3: ["Overcast", "☁️", "☁️"],
  45: ["Fog", "🌫️", "🌫️"],
  48: ["Freezing fog", "🌫️", "🌫️"],
  51: ["Light drizzle", "🌦️", "🌧️"],
  53: ["Drizzle", "🌦️", "🌧️"],
  55: ["Heavy drizzle", "🌧️", "🌧️"],
  56: ["Freezing drizzle", "🌧️", "🌧️"],
  57: ["Freezing drizzle", "🌧️", "🌧️"],
  61: ["Light rain", "🌦️", "🌧️"],
  63: ["Rain", "🌧️", "🌧️"],
  65: ["Heavy rain", "🌧️", "🌧️"],
  66: ["Freezing rain", "🌧️", "🌧️"],
  67: ["Freezing rain", "🌧️", "🌧️"],
  71: ["Light snow", "🌨️", "🌨️"],
  73: ["Snow", "🌨️", "🌨️"],
  75: ["Heavy snow", "❄️", "❄️"],
  77: ["Snow grains", "🌨️", "🌨️"],
  80: ["Light showers", "🌦️", "🌧️"],
  81: ["Showers", "🌧️", "🌧️"],
  82: ["Heavy showers", "⛈️", "⛈️"],
  85: ["Snow showers", "🌨️", "🌨️"],
  86: ["Heavy snow showers", "❄️", "❄️"],
  95: ["Thunderstorm", "⛈️", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️", "⛈️"],
};

const $ = (id) => document.getElementById(id);

const state = {
  place: FAU_BOCA,
  unit: loadUnit(),
};

function loadUnit() {
  try {
    return localStorage.getItem(UNIT_KEY) === "celsius" ? "celsius" : "fahrenheit";
  } catch {
    return "fahrenheit";
  }
}

function saveUnit(unit) {
  try { localStorage.setItem(UNIT_KEY, unit); } catch { /* storage unavailable */ }
}

function describe(code, isDay = true) {
  const entry = WEATHER_CODES[code] || ["Unknown", "🌡️", "🌡️"];
  return { label: entry[0], icon: isDay ? entry[1] : entry[2] };
}

function setStatus(message, isError = false) {
  const el = $("status");
  el.textContent = message;
  el.classList.toggle("error", isError);
}

// Open-Meteo returns local times like "2026-09-28T14:00" when timezone=auto.
// Parse the parts directly so the display matches the location, not the viewer's device.
function parseLocal(iso) {
  const [date, time = "00:00"] = iso.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return { y, m, d, hh, mm };
}

function formatClock(iso) {
  const { hh, mm } = parseLocal(iso);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
}

function formatHour(iso) {
  const { hh } = parseLocal(iso);
  const suffix = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12} ${suffix}`;
}

function formatDay(iso, index) {
  if (index === 0) return "Today";
  const { y, m, d } = parseLocal(iso);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function formatFullDate(iso) {
  const { y, m, d } = parseLocal(iso);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  });
  return `${date}, ${formatClock(iso)} local time`;
}

const deg = (n) => `${Math.round(n)}°`;

async function fetchForecast(place, unit) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    temperature_unit: unit,
    wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  return res.json();
}

async function searchCities(query) {
  const params = new URLSearchParams({ name: query, count: "6", language: "en", format: "json" });
  const res = await fetch(`${GEOCODE_URL}?${params}`);
  if (!res.ok) throw new Error(`City search failed (${res.status})`);
  const data = await res.json();
  return data.results || [];
}

function windDirection(degrees) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

function renderCurrent(data) {
  const c = data.current;
  const d = data.daily;
  const { label, icon } = describe(c.weather_code, c.is_day === 1);
  const speedUnit = data.current_units.wind_speed_10m;

  $("place-name").textContent = state.place.name;
  $("place-time").textContent = `${state.place.detail ? state.place.detail + " · " : ""}${formatFullDate(c.time)}`;
  $("current-icon").textContent = icon;
  $("current-temp").textContent = deg(c.temperature_2m);
  $("current-desc").textContent = label;
  $("current-feels").textContent = `Feels like ${deg(c.apparent_temperature)}`;
  $("current-hilo").textContent = `High ${deg(d.temperature_2m_max[0])} · Low ${deg(d.temperature_2m_min[0])}`;
  $("stat-humidity").textContent = `${c.relative_humidity_2m}%`;
  $("stat-wind").textContent = `${Math.round(c.wind_speed_10m)} ${speedUnit} ${windDirection(c.wind_direction_10m)}`;
  $("stat-precip").textContent = d.precipitation_probability_max[0] != null ? `${d.precipitation_probability_max[0]}%` : "--";
  $("stat-uv").textContent = d.uv_index_max[0] != null ? d.uv_index_max[0].toFixed(1) : "--";
  $("stat-sunrise").textContent = formatClock(d.sunrise[0]);
  $("stat-sunset").textContent = formatClock(d.sunset[0]);
  $("current").hidden = false;
}

function renderHourly(data) {
  const h = data.hourly;
  const now = data.current.time;
  let start = 0;
  for (let i = 0; i < h.time.length; i++) {
    if (h.time[i] <= now) start = i;
    else break;
  }

  const container = $("hourly");
  container.innerHTML = "";
  for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
    const { label, icon } = describe(h.weather_code[i], h.is_day[i] === 1);
    const el = document.createElement("div");
    el.className = "hour";
    el.title = label;
    el.innerHTML = `
      <div class="h-time">${i === start ? "Now" : formatHour(h.time[i])}</div>
      <div class="h-icon" aria-hidden="true">${icon}</div>
      <div class="h-temp">${deg(h.temperature_2m[i])}</div>
      <div class="h-rain">${h.precipitation_probability[i] ?? 0}%</div>`;
    container.appendChild(el);
  }
  $("hourly-card").hidden = false;
}

function renderDaily(data) {
  const d = data.daily;
  const list = $("daily");
  list.innerHTML = "";
  d.time.forEach((day, i) => {
    const { label, icon } = describe(d.weather_code[i]);
    const rain = d.precipitation_probability_max[i];
    const li = document.createElement("li");
    li.className = "day";
    li.innerHTML = `
      <span class="d-name">${formatDay(day, i)}</span>
      <span class="d-icon" aria-hidden="true">${icon}</span>
      <span class="d-desc">${label}${rain != null ? ` · <span class="d-rain">${rain}% rain</span>` : ""}</span>
      <span class="d-temps">${deg(d.temperature_2m_max[i])}<span class="lo">${deg(d.temperature_2m_min[i])}</span></span>`;
    list.appendChild(li);
  });
  $("daily-card").hidden = false;
}

async function loadWeather() {
  setStatus(`Loading weather for ${state.place.name}...`);
  try {
    const data = await fetchForecast(state.place, state.unit);
    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Couldn't load the weather right now. Check your connection and try again.", true);
  }
}

function hideResults() {
  const list = $("search-results");
  list.hidden = true;
  list.innerHTML = "";
}

function showResults(results) {
  const list = $("search-results");
  list.innerHTML = "";
  if (!results.length) {
    hideResults();
    setStatus("No matching cities found. Try a different spelling.", true);
    return;
  }
  results.forEach((r) => {
    const detail = [r.admin1, r.country].filter(Boolean).join(", ");
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<strong></strong> <small></small>`;
    btn.querySelector("strong").textContent = r.name;
    btn.querySelector("small").textContent = detail;
    btn.addEventListener("click", () => {
      state.place = { name: r.name, detail, latitude: r.latitude, longitude: r.longitude };
      hideResults();
      $("search-input").value = "";
      loadWeather();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  list.hidden = false;
  setStatus("");
}

function setUnit(unit) {
  state.unit = unit;
  saveUnit(unit);
  document.querySelectorAll(".unit-toggle button").forEach((b) => {
    const active = b.dataset.unit === unit;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}

function init() {
  setUnit(state.unit);

  $("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("search-input").value.trim();
    if (q.length < 2) {
      setStatus("Type at least 2 letters to search.", true);
      return;
    }
    setStatus("Searching...");
    try {
      showResults(await searchCities(q));
    } catch (err) {
      console.error(err);
      setStatus("City search failed. Try again in a moment.", true);
    }
  });

  document.addEventListener("click", (e) => {
    if (!$("search-form").contains(e.target)) hideResults();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideResults();
  });

  $("home-btn").addEventListener("click", () => {
    state.place = FAU_BOCA;
    loadWeather();
  });

  $("locate-btn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("Your browser doesn't support location.", true);
      return;
    }
    setStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.place = {
          name: "Your location",
          detail: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        loadWeather();
      },
      () => setStatus("Location permission was denied. Showing the last location instead.", true),
      { timeout: 10000 }
    );
  });

  document.querySelectorAll(".unit-toggle button").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.unit === state.unit) return;
      setUnit(b.dataset.unit);
      loadWeather();
    });
  });

  loadWeather();
}

init();
