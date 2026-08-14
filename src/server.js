import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeKostInRadius, geocodeLocation } from './scraper/gmapsScraper.js';
import { scrapeTikTokKostRecommendations } from './scraper/tiktokScraper.js';
import { queryCache } from './utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * GET /api/hybrid-search?q=UGM+Yogyakarta&radius=2
 */
app.get('/api/hybrid-search', async (req, res) => {
  try {
    const query = req.query.q || 'UGM Yogyakarta';
    const radiusKm = parseFloat(req.query.radius || '2.0');
    const centerLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const centerLng = req.query.lng ? parseFloat(req.query.lng) : null;

    const cacheKey = `hybrid:${query}:${radiusKm}:${centerLat}:${centerLng}`;
    const cachedData = queryCache.get(cacheKey);

    if (cachedData) {
      console.log(`⚡ [Cache Hit] Returning cached results for "${query}" (${radiusKm} km)`);
      return res.json({ success: true, cached: true, ...cachedData });
    }

    console.log(`\n🚀 [Hybrid Search Engine] Scraping Google Maps + TikTok for "${query}" (${radiusKm} km)...`);

    const [gmaps, tiktok] = await Promise.allSettled([
      scrapeKostInRadius({ locationQuery: query, centerLat: centerLat, centerLng: centerLng, radiusKm: radiusKm, limit: 15, headless: true }),
      scrapeTikTokKostRecommendations({ locationQuery: query, limitVideos: 3, headless: true })
    ]);

    const resultPayload = {
      timestamp: new Date().toISOString(),
      googleMaps: gmaps.status === 'fulfilled' ? gmaps.value : { error: gmaps.reason },
      tiktokLeads: tiktok.status === 'fulfilled' ? tiktok.value : { error: tiktok.reason }
    };

    queryCache.set(cacheKey, resultPayload, 600000); // Cache for 10 minutes

    res.json({ success: true, cached: false, ...resultPayload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/geocode?q=UGM+Yogyakarta
 */
app.get('/api/geocode', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter q is required' });
    const location = await geocodeLocation(query);
    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🌐 [Inkos Production Server] Running on Port ${PORT}`);
  console.log(`==================================================\n`);
});
