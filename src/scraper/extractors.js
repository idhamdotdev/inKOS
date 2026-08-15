/**
 * Advanced Indonesian Rental Data Extractor & Direct-Owner NLP Normalizer
 */

export function extractPrice(text = '') {
  if (!text) return { priceText: 'Hubungi Pemilik', rawPriceMonth: null, billingPeriod: 'bulan' };

  // Match patterns like:
  // "Rp 1.500.000/bln", "1,5 jt", "850rb/bulan", "18 juta / tahun", "IDR 2.000.000", "Rp 800.000,-"
  const rpRegex = /(?:rp|IDR)\.?\s*([\d\.,]+)\s*(jt|juta|rb|ribu|k|m)?\s*(?:\/|\s*per\s*)?\s*(bln|bulan|thn|tahun|hari)?/i;
  const match = text.match(rpRegex);

  if (match) {
    let numStr = match[1].replace(/\./g, '').replace(',', '.');
    let num = parseFloat(numStr);
    let multiplier = (match[2] || '').toLowerCase();
    let period = (match[3] || '').toLowerCase();

    if (multiplier.includes('jt') || multiplier.includes('juta') || multiplier.includes('m')) {
      if (num < 100) num = num * 1000000;
    } else if (multiplier.includes('rb') || multiplier.includes('ribu') || multiplier.includes('k')) {
      if (num < 1000) num = num * 1000;
    }

    let isYearly = period.includes('thn') || period.includes('tahun') || (num >= 8000000 && !period.includes('bln') && !period.includes('bulan'));
    let monthlyEquivalent = isYearly ? Math.round(num / 12) : Math.round(num);

    if (!isNaN(monthlyEquivalent) && monthlyEquivalent > 100000) {
      const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(monthlyEquivalent);
      return {
        priceText: `${formatted}/bulan${isYearly ? ' (Tahunan)' : ''}`,
        rawPriceMonth: monthlyEquivalent,
        billingPeriod: isYearly ? 'tahun' : 'bulan'
      };
    }
  }

  // Backup simple pattern e.g. "1.5jt", "850rb" without "Rp"
  const simpleMatch = text.match(/\b(\d+[\.,]?\d*)\s*(jt|juta|rb|ribu)\b/i);
  if (simpleMatch) {
    let n = parseFloat(simpleMatch[1].replace(',', '.'));
    let unit = simpleMatch[2].toLowerCase();
    let val = (unit.includes('jt') || unit.includes('juta')) ? n * 1000000 : n * 1000;
    if (val >= 200000) {
      const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
      return {
        priceText: `${formatted}/bulan`,
        rawPriceMonth: Math.round(val),
        billingPeriod: 'bulan'
      };
    }
  }

  return { priceText: 'Hubungi Kontak', rawPriceMonth: null, billingPeriod: 'bulan' };
}

export function extractPhone(text = '') {
  if (!text) return null;
  const phoneRegex = /(?:\+?62|0)8[1-9][0-9\s-]{7,12}\b/;
  const match = text.match(phoneRegex);
  if (match) {
    let clean = match[0].replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.substring(1);
    if (clean.length >= 10 && clean.length <= 14) {
      return {
        rawNumber: clean,
        formattedNumber: `+${clean.substring(0, 2)} ${clean.substring(2, 5)}-${clean.substring(5, 9)}-${clean.substring(9)}`,
        whatsappUrl: `https://wa.me/${clean}?text=${encodeURIComponent('Halo, saya melihat info Kost ini di InKOS. Apakah masih ada kamar kosong?')}`
      };
    }
  }
  return null;
}

export function extractGenderType(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('kost putri') || lower.includes('khusus putri') || lower.includes('khusus wanita') || lower.includes('putri')) {
    return 'Putri';
  }
  if (lower.includes('kost putra') || lower.includes('khusus putra') || lower.includes('khusus pria') || lower.includes('putra') || lower.includes('cowok')) {
    return 'Putra';
  }
  if (lower.includes('pasutri') || lower.includes('pasangan suami istri')) {
    return 'Pasutri / Campur';
  }
  return 'Campur';
}

export function extractRoomSpecs(text = '') {
  const lower = text.toLowerCase();
  
  // Room dimensions e.g. "3x4", "3 x 3 meter", "4x5"
  let size = null;
  const sizeMatch = text.match(/(\d[\.,]?\d*)\s*[xX*]\s*(\d[\.,]?\d*)\s*(?:m|meter)?/i);
  if (sizeMatch) {
    size = `${sizeMatch[1]}x${sizeMatch[2]} m`;
  }

  // Electricity policy
  let electricity = 'Token Sendiri';
  if (lower.includes('termasuk listrik') || lower.includes('free listrik') || lower.includes('sudah listrik') || lower.includes('listrik gratis')) {
    electricity = 'Termasuk Listrik';
  } else if (lower.includes('token') || lower.includes('listrik token') || lower.includes('pulsa listrik')) {
    electricity = 'Listrik Token';
  }

  // Curfew / Akses rules
  let curfew = 'Akses 24 Jam';
  if (lower.includes('jam malam') && (lower.includes('ada jam malam') || lower.includes('tutup jam'))) {
    const jamMatch = text.match(/tutup\s*(?:jam|pukul)?\s*(\d{1,2}[\.:]\d{2}|\d{1,2})/i);
    curfew = jamMatch ? `Tutup Jam ${jamMatch[1]}` : 'Ada Jam Malam';
  } else if (lower.includes('bebas 24 jam') || lower.includes('akses 24 jam') || lower.includes('pegang kunci sendiri')) {
    curfew = 'Akses 24 Jam (Pegang Kunci)';
  }

  // Direct Owner Tagging
  const isDirectOwner = 
    lower.includes('tanpa perantara') || 
    lower.includes('langsung pemilik') || 
    lower.includes('owner') || 
    lower.includes('ibu kos') || 
    lower.includes('bapak kos') || 
    lower.includes('wa') || 
    !lower.includes('agen');

  return { size, electricity, curfew, isDirectOwner };
}

export function extractAmenities(text = '') {
  const lower = text.toLowerCase();
  const amenities = [];

  if (lower.includes('ac') || lower.includes('pendingin')) amenities.push('AC');
  if (lower.includes('kamar mandi dalam') || lower.includes('kmd') || lower.includes('private bath') || lower.includes('km dalam')) amenities.push('Kamar Mandi Dalam');
  if (lower.includes('kamar mandi luar') || lower.includes('km luar')) amenities.push('Kamar Mandi Luar');
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) amenities.push('Wi-Fi');
  if (lower.includes('water heater') || lower.includes('air panas')) amenities.push('Water Heater');
  if (lower.includes('parkir mobil') || lower.includes('garage') || lower.includes('garasi mobil')) amenities.push('Parkir Mobil');
  if (lower.includes('parkir motor')) amenities.push('Parkir Motor');
  if (lower.includes('kasur') || lower.includes('springbed') || lower.includes('bed')) amenities.push('Kasur Springbed');
  if (lower.includes('lemari')) amenities.push('Lemari Pakaian');
  if (lower.includes('meja') || lower.includes('meja belajar') || lower.includes('kursi')) amenities.push('Meja & Kursi');
  if (lower.includes('dapur') || lower.includes('dapur bersama')) amenities.push('Dapur Bersama');
  if (lower.includes('kulkas') || lower.includes('kulkas bersama')) amenities.push('Kulkas Bersama');
  if (lower.includes('mesin cuci')) amenities.push('Mesin Cuci');
  if (lower.includes('cctv') || lower.includes('security')) amenities.push('CCTV 24 Jam');

  return amenities.length > 0 ? amenities : ['Kasur', 'Lemari', 'Wi-Fi'];
}
