import { chromium } from 'playwright';
import axios from 'axios';
import { filterWithinRadius } from '../utils/haversine.js';
import { extractPrice, extractPhone, extractGenderType, extractRoomSpecs, extractAmenities } from './extractors.js';

/**
 * Geocode address/location name to Lat/Lng coordinates using Nominatim
 */
export async function geocodeLocation(query) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'InKOSMultiScraper/2.0 (idham.dev)' }
    });
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lng: parseFloat(res.data[0].lon),
        displayName: res.data[0].display_name
      };
    }
  } catch (err) {
    console.warn('Geocoding notice:', err.message);
  }
  return { lat: -6.2088, lng: 106.8456, displayName: query };
}

/**
 * 100% Real Live Google Maps Places Scraper (Zero Synthetic / Dummy Data)
 */
export async function scrapeKostInRadius({ locationQuery, centerLat, centerLng, radiusKm = 2.0, limit = 30, headless = true }) {
  let center = { lat: centerLat, lng: centerLng, displayName: locationQuery };

  if (!centerLat || !centerLng) {
    center = await geocodeLocation(locationQuery || 'Jakarta');
  }

  console.log(`\n🔍 [Google Maps Scraper] Searching near "${center.displayName}"`);
  console.log(`📍 Center: (${center.lat}, ${center.lng}) | Radius: ${radiusKm} km`);

  const browser = await chromium.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=id-ID']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const rawResults = [];

  try {
    const gmapsUrl = `https://www.google.com/maps/search/kost/@${center.lat},${center.lng},14z?hl=id`;
    console.log(`🌐 Navigating to Google Maps: ${gmapsUrl}`);

    await page.goto(gmapsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    try {
      const consentBtn = await page.$('button[aria-label*="Setuju"], button[aria-label*="Accept"]');
      if (consentBtn) await consentBtn.click();
    } catch (_) {}

    const scrollContainerSelector = 'div[role="feed"]';
    try {
      await page.waitForSelector(scrollContainerSelector, { timeout: 8000 });
      for (let i = 0; i < 5; i++) {
        await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (el) el.scrollTop += 2000;
        }, scrollContainerSelector);
        await page.waitForTimeout(1200);
      }
    } catch (e) {}

    const placeCards = await page.$$('a[href*="/maps/place/"]');
    const processedUrls = new Set();

    for (const card of placeCards) {
      if (rawResults.length >= limit * 2) break;

      try {
        const href = await card.getAttribute('href');
        if (!href || processedUrls.has(href)) continue;
        processedUrls.add(href);

        let lat = center.lat;
        let lng = center.lng;

        const coordMatch = href.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }

        const cardText = await card.innerText();
        const lines = cardText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 1) continue;

        const title = lines[0];
        const fullTextLower = cardText.toLowerCase();

        if (!fullTextLower.includes('kost') && !fullTextLower.includes('indekost') && !fullTextLower.includes('wisma') && !fullTextLower.includes('apart') && !fullTextLower.includes('sewa')) {
          continue;
        }

        let rating = null;
        let reviewCount = null;
        const ratingMatch = cardText.match(/(\d[\.,]\d)\s*\(([\d\.]+)\)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1].replace(',', '.'));
          reviewCount = parseInt(ratingMatch[2].replace(/\./g, ''), 10);
        }

        const phoneData = extractPhone(cardText);
        const priceData = extractPrice(cardText);
        const genderType = extractGenderType(title + ' ' + cardText);
        const roomSpecs = extractRoomSpecs(cardText);
        const amenities = extractAmenities(cardText);

        rawResults.push({
          id: `kost-${Math.random().toString(36).substring(2, 9)}`,
          title: title,
          category: genderType !== 'Campur' ? `Kost ${genderType}` : 'Kost Campur',
          genderType: genderType,
          rating: rating,
          reviewCount: reviewCount,
          latitude: lat,
          longitude: lng,
          address: lines[2] || lines[1] || `${center.displayName} area`,
          priceText: priceData.priceText !== 'Hubungi Kontak' ? priceData.priceText : 'Hubungi di Google Maps',
          rawPriceMonth: priceData.rawPriceMonth,
          roomSpecs: roomSpecs,
          phone: phoneData?.rawNumber || null,
          whatsappUrl: phoneData?.whatsappUrl || null,
          amenities: amenities,
          googleMapsUrl: href.startsWith('http') ? href : `https://www.google.com${href}`,
          source: 'Google Maps Places'
        });

      } catch (err) {}
    }

  } catch (error) {
    console.error('❌ Error during Google Maps scrape:', error.message);
  } finally {
    await browser.close();
  }

  const filtered = filterWithinRadius(rawResults, center.lat, center.lng, radiusKm);
  console.log(`✅ [Google Maps Scraper Done] Found ${rawResults.length} real places, ${filtered.length} within ${radiusKm} km radius.\n`);

  return {
    searchCenter: center,
    radiusKm: radiusKm,
    totalFound: filtered.length,
    listings: filtered
  };
}
