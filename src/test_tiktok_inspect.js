import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectTikTok() {
  try {
    const res = await axios.get('https://www.tiktok.com/tag/kostugm', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
      }
    });

    const $ = cheerio.load(res.data);
    const scripts = [];

    $('script').each((i, el) => {
      const id = $(el).attr('id');
      const type = $(el).attr('type');
      if (id || type === 'application/json') {
        scripts.push({ id, type, length: $(el).html()?.length });
      }
    });

    console.log('Script tags with ID or JSON type found:', scripts);

    const universalData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
    if (universalData) {
      console.log('✅ Found __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON!');
      const parsed = JSON.parse(universalData);
      console.log('Keys in universal data:', Object.keys(parsed));
      console.log('Default scope keys:', Object.keys(parsed.__DEFAULT_SCOPE__ || {}));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectTikTok();
