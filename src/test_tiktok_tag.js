import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractPrice, extractPhone, extractGenderType, extractAmenities } from './scraper/extractors.js';

async function testTikTokTag(tag = 'kostugm') {
  console.log(`Testing TikTok Tag Page Scraper for hashtag #${tag}...`);
  try {
    const url = `https://www.tiktok.com/tag/${tag}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
      }
    });

    const $ = cheerio.load(res.data);
    const scriptJson = $('#SIGI_STATE, #__UNIVERSAL_DATA_FOR_REHYDRATION__').html();

    if (scriptJson) {
      const data = JSON.parse(scriptJson);
      console.log('✅ Found TikTok Rehydration JSON Payload!');
      const items = data?.ItemModule || data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct || {};
      
      const leads = [];
      Object.values(items).forEach(item => {
        if (item.desc) {
          const price = extractPrice(item.desc);
          const phone = extractPhone(item.desc);
          leads.push({
            caption: item.desc,
            author: item.author || item.nickname,
            videoUrl: `https://www.tiktok.com/@${item.author}/video/${item.id}`,
            price: price.priceText,
            phone: phone?.rawNumber
          });
        }
      });

      console.log(`Found ${leads.length} video leads under #${tag}:`);
      console.log(leads.slice(0, 5));
    } else {
      console.log('No SIGI_STATE JSON found in raw HTML payload.');
    }
  } catch (err) {
    console.error('Error fetching TikTok tag:', err.message);
  }
}

testTikTokTag();
