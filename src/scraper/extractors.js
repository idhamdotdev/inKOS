/**
 * Regular Expression Data Extractors for Indonesian Kost & Apartment Listings
 */

export function extractPrice(text = '') {
  if (!text) return { priceText: 'Hubungi Pemilik', rawPriceMonth: null };

  // Match patterns like Rp 1.500.000, Rp 1,5 jt, 800rb, 1.2M, Rp 2.000.000 / bln
  const rpRegex = /(?:rp|IDR)\.?\s*([\d\.,]+)\s*(jt|juta|rb|ribu|k|m|juta\/bln|jt\/bln|\/bln|\/bulan)?/i;
  const match = text.match(rpRegex);

  if (match) {
    let numStr = match[1].replace(/\./g, '').replace(',', '.');
    let num = parseFloat(numStr);
    let unit = (match[2] || '').toLowerCase();

    if (unit.includes('jt') || unit.includes('juta') || unit.includes('m')) {
      if (num < 100) num = num * 1000000;
    } else if (unit.includes('rb') || unit.includes('ribu') || unit.includes('k')) {
      if (num < 1000) num = num * 1000;
    }

    if (!isNaN(num) && num > 100000) {
      const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
      return {
        priceText: `${formatted}/bulan`,
        rawPriceMonth: Math.round(num)
      };
    }
  }

  return { priceText: 'N/A', rawPriceMonth: null };
}

export function extractPhone(text = '') {
  if (!text) return null;
  // Match Indonesian numbers starting with 08xx or +628xx
  const phoneRegex = /(?:\+?62|0)8[1-9][0-9]{7,10}\b/;
  const match = text.match(phoneRegex);
  if (match) {
    let raw = match[0].replace(/\D/g, '');
    if (raw.startsWith('0')) raw = '62' + raw.substring(1);
    return {
      rawNumber: raw,
      whatsappUrl: `https://wa.me/${raw}?text=${encodeURIComponent('Halo, saya melihat info Kost ini di Inkos. Apakah masih ada kamar kosong?')}`
    };
  }
  return null;
}

export function extractGenderType(text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('kost putri') || lower.includes('khusus wanita') || lower.includes('putri')) {
    return 'Putri';
  }
  if (lower.includes('kost putra') || lower.includes('khusus pria') || lower.includes('putra')) {
    return 'Putra';
  }
  if (lower.includes('campur') || lower.includes('pasutri') || lower.includes('bebas')) {
    return 'Campur';
  }
  return 'Campur / Unspecified';
}

export function extractAmenities(text = '') {
  const lower = text.toLowerCase();
  const amenities = [];

  if (lower.includes('ac') || lower.includes('pendingin')) amenities.push('AC');
  if (lower.includes('kamar mandi dalam') || lower.includes('kmd') || lower.includes('private bathroom')) amenities.push('Kamar Mandi Dalam');
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) amenities.push('Wi-Fi');
  if (lower.includes('water heater') || lower.includes('air panas')) amenities.push('Water Heater');
  if (lower.includes('parkir mobil') || lower.includes('garage')) amenities.push('Parkir Mobil');
  if (lower.includes('parkir motor')) amenities.push('Parkir Motor');
  if (lower.includes('kasur') || lower.includes('bed')) amenities.push('Kasur');
  if (lower.includes('lemari')) amenities.push('Lemari');
  if (lower.includes('dapur')) amenities.push('Dapur Bersama');
  if (lower.includes('24 jam') || lower.includes('akses 24 jam')) amenities.push('Akses 24 Jam');

  return amenities.length > 0 ? amenities : ['Fasilitas Standar'];
}
