import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeKostInRadius, geocodeLocation } from './scraper/gmapsScraper.js';
import { scrapeSocialHiddenGems } from './scraper/socialScraper.js';
import { queryCache } from './utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * Health check endpoint for Railway / Cloud monitoring
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  });
});

/**
 * GET /api/hybrid-search?q=UGM+Yogyakarta&radius=2&sort=newest
 * 100% Real Live Scraper (Google Maps Places + Real Social Web Leads)
 */
app.get('/api/hybrid-search', async (req, res) => {
  try {
    const query = req.query.q || 'Jakarta';
    const radiusKm = parseFloat(req.query.radius || '2.0');
    const centerLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const centerLng = req.query.lng ? parseFloat(req.query.lng) : null;
    const sortBy = req.query.sort || 'newest';

    const cacheKey = `hybrid:${query}:${radiusKm}:${centerLat}:${centerLng}:${sortBy}`;
    const cachedData = queryCache.get(cacheKey);

    if (cachedData) {
      console.log(`⚡ [Cache Hit] Returning cached results for "${query}" (${radiusKm} km)`);
      return res.json({ success: true, cached: true, ...cachedData });
    }

    console.log(`\n🚀 [Live Search Engine] Scraping real data for "${query}" (${radiusKm} km)...`);

    const [gmaps, social] = await Promise.allSettled([
      scrapeKostInRadius({ locationQuery: query, centerLat: centerLat, centerLng: centerLng, radiusKm: radiusKm, limit: 30, headless: true }),
      scrapeSocialHiddenGems({ locationQuery: query, sortBy: sortBy })
    ]);

    const resultPayload = {
      timestamp: new Date().toISOString(),
      googleMaps: gmaps.status === 'fulfilled' ? gmaps.value : { error: gmaps.reason },
      socialLeads: social.status === 'fulfilled' ? social.value : { error: social.reason }
    };

    queryCache.set(cacheKey, resultPayload, 180000); // 3 minutes cache

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🌐 [InKOS 100% Real Live Engine Running] Port: ${PORT}`);
  console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});
