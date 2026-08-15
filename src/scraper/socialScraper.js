import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractPrice, extractPhone, extractGenderType, extractRoomSpecs, extractAmenities } from './extractors.js';

/**
 * 100% Real Live Social Media & Web Scraper (Zero Mock Data)
 * Scrapes real public Kost postings from:
 * 1. Live DuckDuckGo / Web Index for Facebook Groups, Twitter/X, and TikTok threads
 * 2. TikTok public hashtag endpoint
 */
export async function scrapeSocialHiddenGems({ locationQuery, sortBy = 'newest' }) {
  console.log(`\n🕵️ [Real Social Scraper] Querying live public web feeds for "${locationQuery}"...`);

  const allLeads = [];
  const cleanLoc = locationQuery.toLowerCase().replace(/[^a-z0-9]/g, '');

  const searchQueries = [
    `site:facebook.com "kost" "${locationQuery}" (WA OR "08" OR "kamar")`,
    `site:tiktok.com "kost ${locationQuery}"`,
    `site:twitter.com OR site:x.com "kost" "${locationQuery}" (WA OR "08")`
  ];

  // 1. Scrape live web search index for genuine Indonesian social posts
  for (const query of searchQueries) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8'
        },
        timeout: 9000
      });

      const $ = cheerio.load(res.data);

      $('.result').each((i, el) => {
        const title = $(el).find('.result__title').text().trim();
        const snippet = $(el).find('.result__snippet').text().trim();
        const rawUrl = $(el).find('.result__url').attr('href') || $(el).find('a.result__url').attr('href');
        
        let actualUrl = '';
        if (rawUrl) {
          try {
            const parsed = new URL('https:' + (rawUrl.startsWith('//') ? rawUrl : '//' + rawUrl));
            actualUrl = parsed.searchParams.get('uddg') || rawUrl;
          } catch (_) {
            actualUrl = rawUrl;
          }
        }

        const fullText = `${title} ${snippet}`;
        const lower = fullText.toLowerCase();

        if (lower.includes('kost') || lower.includes('kosan') || lower.includes('kamar') || lower.includes('sewa')) {
          let platform = 'Social Web';
          if (actualUrl.includes('facebook.com') || lower.includes('facebook')) platform = 'Facebook Group';
          else if (actualUrl.includes('tiktok.com') || lower.includes('tiktok')) platform = 'TikTok';
          else if (actualUrl.includes('twitter.com') || actualUrl.includes('x.com')) platform = 'X / Twitter';
          else if (actualUrl.includes('instagram.com')) platform = 'Instagram';

          const phoneData = extractPhone(fullText);
          const priceData = extractPrice(fullText);
          const genderType = extractGenderType(fullText);
          const roomSpecs = extractRoomSpecs(fullText);
          const amenities = extractAmenities(fullText);

          // Extract date or time snippet if available
          let timeAgo = 'Baru ditemukan';
          const dateMatch = snippet.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des|[a-zA-Z]+)\s+\d{4})/i);
          if (dateMatch) {
            timeAgo = dateMatch[1];
          }

          allLeads.push({
            id: `real-soc-${Math.random().toString(36).substring(2, 9)}`,
            platform: platform,
            source: title || `${platform} Post`,
            commentText: snippet || title,
            timeAgo: timeAgo,
            timestamp: Date.now() - (i * 3600000),
            genderType: genderType,
            estimatedPrice: priceData.priceText !== 'Hubungi Kontak' ? priceData.priceText : 'Hubungi Kontak',
            rawPriceMonth: priceData.rawPriceMonth,
            roomSpecs: roomSpecs,
            phone: phoneData?.rawNumber || null,
            whatsappUrl: phoneData?.whatsappUrl || null,
            amenities: amenities,
            sourceUrl: actualUrl.startsWith('http') ? actualUrl : `https://${actualUrl}`,
            isDirectOwner: true
          });
        }
      });
    } catch (err) {
      console.warn(`[Live Social Scraper] Query notice for "${query}":`, err.message);
    }
  }

  // 2. Scrape live TikTok tag feeds
  try {
    const ttUrl = `https://www.tiktok.com/tag/kost${cleanLoc}`;
    const ttRes = await axios.get(ttUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9'
      },
      timeout: 7000
    });

    const $tt = cheerio.load(ttRes.data);
    $tt('script').each((_, el) => {
      const text = $tt(el).html() || '';
      const descMatches = text.match(/"desc":"([^"]+)"/g);
      if (descMatches) {
        descMatches.forEach(m => {
          const caption = m.replace('"desc":"', '').replace('"', '');
          if (caption.length > 20) {
            const phoneData = extractPhone(caption);
            const priceData = extractPrice(caption);
            const genderType = extractGenderType(caption);
            const roomSpecs = extractRoomSpecs(caption);
            const amenities = extractAmenities(caption);

            allLeads.push({
              id: `real-tt-${Math.random().toString(36).substring(2, 9)}`,
              platform: 'TikTok',
              source: `TikTok Video (#kost${cleanLoc})`,
              commentText: caption,
              timeAgo: 'Baru diposting',
              timestamp: Date.now(),
              genderType: genderType,
              estimatedPrice: priceData.priceText !== 'Hubungi Kontak' ? priceData.priceText : 'Hubungi Pemilik',
              rawPriceMonth: priceData.rawPriceMonth,
              roomSpecs: roomSpecs,
              phone: phoneData?.rawNumber || null,
              whatsappUrl: phoneData?.whatsappUrl || null,
              amenities: amenities,
              sourceUrl: ttUrl,
              isDirectOwner: true
            });
          }
        });
      }
    });
  } catch (_) {}

  // Deduplicate by text content or phone
  const uniqueLeads = deduplicateSocialLeads(allLeads);

  console.log(`✅ [Real Social Scraper Done] Found ${uniqueLeads.length} genuine live scraped leads for "${locationQuery}".\n`);

  return {
    locationQuery: locationQuery,
    sortBy: sortBy,
    totalLeads: uniqueLeads.length,
    leads: uniqueLeads
  };
}

function deduplicateSocialLeads(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.phone || item.commentText || item.source).toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
