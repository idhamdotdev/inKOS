import { scrapeKostInRadius } from './scraper/gmapsScraper.js';

const location = process.argv[2] || 'UGM Yogyakarta';
const radius = parseFloat(process.argv[3] || '1.5');

console.log('🚀 Running Inkos CLI Scraper Test...');
console.log(`📍 Query: "${location}" | Radius: ${radius} km\n`);

try {
  const results = await scrapeKostInRadius({
    locationQuery: location,
    radiusKm: radius,
    limit: 15,
    headless: true
  });

  console.log('--- 📊 SCRAPING RESULTS SUMMARY ---');
  console.log(`Center Location: ${results.searchCenter.displayName}`);
  console.log(`Coordinates: (${results.searchCenter.lat}, ${results.searchCenter.lng})`);
  console.log(`Radius Limit: ${results.radiusKm} km`);
  console.log(`Total Valid Listings Found: ${results.totalFound}\n`);

  results.listings.forEach((item, index) => {
    console.log(`[${index + 1}] 🏠 ${item.title}`);
    console.log(`    💰 Price: ${item.priceText}`);
    console.log(`    🏷️ Category: ${item.category} (${item.genderType})`);
    console.log(`    📍 Distance: ${item.distanceKm} km (${item.distanceMeters}m from center)`);
    console.log(`    ⭐ Rating: ${item.rating} (${item.reviewCount} reviews)`);
    console.log(`    🛋️ Amenities: ${item.amenities.join(', ')}`);
    if (item.whatsappUrl) console.log(`    💬 WhatsApp: ${item.whatsappUrl}`);
    console.log(`    🔗 Google Maps: ${item.googleMapsUrl}`);
    console.log('--------------------------------------------------');
  });

} catch (err) {
  console.error('Scraper CLI Error:', err);
}
