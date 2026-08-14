import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDDG() {
  const query = 'tiktok rekomendasi kost UGM Yogyakarta';
  console.log(`Testing DuckDuckGo search for: ${query}`);
  
  const res = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
    }
  });

  const $ = cheerio.load(res.data);
  const results = [];

  $('.result').each((i, el) => {
    const title = $(el).find('.result__title').text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();
    const link = $(el).find('.result__url').attr('href');

    if (snippet || title) {
      results.push({ title, link, snippet });
    }
  });

  console.log(`Found ${results.length} DuckDuckGo results:`);
  results.slice(0, 5).forEach((r, idx) => {
    console.log(`\n[${idx + 1}] Title: ${r.title}`);
    console.log(`    Link: ${r.link}`);
    console.log(`    Snippet: ${r.snippet}`);
  });
}

testDDG();
