import { scrapeTikTokKostRecommendations } from './scraper/tiktokScraper.js';

const location = process.argv[2] || 'UGM Yogyakarta';
const limit = parseInt(process.argv[3] || '3', 10);

console.log('🚀 Running Inkos TikTok Scraper CLI...');
console.log(`🎵 Location Query: "${location}" | Limit Videos: ${limit}\n`);

try {
  const result = await scrapeTikTokKostRecommendations({
    locationQuery: location,
    limitVideos: limit,
    headless: true
  });

  console.log('--- 📊 TIKTOK SCRAPING SUMMARY ---');
  console.log(`Target Location: ${result.locationQuery}`);
  console.log(`Total Leads Found: ${result.totalLeadsFound}\n`);

  result.recommendations.forEach((item, index) => {
    console.log(`[${index + 1}] 💬 TikTok Comment Lead`);
    console.log(`    📝 Content: "${item.commentText.substring(0, 120)}..."`);
    console.log(`    💰 Price Detected: ${item.estimatedPrice}`);
    console.log(`    🏷️ Category: ${item.genderType}`);
    console.log(`    🛋️ Amenities: ${item.amenities.join(', ')}`);
    if (item.whatsappUrl) console.log(`    📱 WhatsApp Link: ${item.whatsappUrl}`);
    console.log(`    🎥 TikTok Video Link: ${item.tiktokVideoUrl}`);
    console.log('--------------------------------------------------');
  });

} catch (err) {
  console.error('TikTok CLI Error:', err);
}
