# InKOS 📍

> **Map-Based Rental & Kost Intelligence Engine**  
> Developed by [@idham.dev](https://idham.dev)

InKOS is a high-performance scraping and intelligence engine for rental accommodations (Kost & Apartments) across Indonesia. It combines precise geographical radius boundary matching with Google Maps Places data and TikTok community comment leads.

---

## ⚡ Features

- 🗺️ **Interactive Radius Mapping**: Pinpoint any location or university campus and dynamically adjust the search boundary ($0.5\text{ km}$ to $5.0\text{ km}$).
- 📍 **Google Maps Intelligence**: Scrapes real-time coordinates, ratings, reviews, and direct Google Maps navigation routes.
- 🎵 **TikTok Lead Extractor**: Scrapes video captions and comment threads (e.g. *"aku ada kost daerah..."*) to extract hidden-gem owner leads with **direct WhatsApp links** (`wa.me/628...`).
- 📐 **Haversine Distance Filtering**: Mathematically filters all listings strictly inside your chosen radius.
- ⚡ **Zero Paid Tokens & Fast In-Memory Cache**: Built with Playwright + local regex parsers. Zero third-party API token costs.
- 🎨 **Minimalist STICam UI**: Clean monochromatic dark theme with monochrome SVG outline icons and mobile responsiveness.
- 🔖 **Saved Favorites & Shareable Links**: Bookmark favorite listings locally and share search results with direct URLs (`?q=Kuningan&r=2`).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Playwright (Chromium Headless), Cheerio, Axios
- **Frontend**: Vanilla JavaScript, Leaflet.js, CartoDB Voyager Map Tiles, Inter & Outfit Typography
- **Deployment**: Docker (`node:20-bookworm-slim`), Railway, Render, Linux VPS

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
git clone https://github.com/idhamdotdev/inKOS.git
cd inKOS
npm install
npx playwright install chromium
```

### 2. Start the Server
```bash
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

---

## 📡 API Endpoints

| Endpoint | Description |
| :--- | :--- |
| `GET /api/health` | Healthcheck and server memory uptime status |
| `GET /api/search?q=UGM&radius=1.5` | Google Maps Radius Scraper |
| `GET /api/tiktok-search?q=UGM` | TikTok Comment & Lead Scraper |
| `GET /api/hybrid-search?q=UGM&radius=1.5` | Combined Google Maps + TikTok Scraper |

---

## 📄 License
MIT License © [Idham Surya](https://idham.dev)
