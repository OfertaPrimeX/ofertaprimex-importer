import axios from 'axios';
import fs from 'fs';
import * as cheerio from 'cheerio';

export async function searchMercadoLivre(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Referer': 'https://www.google.com/',
      'Connection': 'keep-alive'
    },
    timeout: 20000
  });

  // 🔥 SALVA O HTML PARA DEBUG
  fs.writeFileSync('debug-ml.html', data);

  const $ = cheerio.load(data);
  const products = [];

  $('.ui-search-result').each((i, el) => {
    if (i >= limit) return;

    const link = $(el).find('a').attr('href');

    products.push({
      platform: 'mercadolivre',
      external_id: $(el).attr('data-id') || `ml-${i}`,
      title: $(el).find('.ui-search-item__title').text().trim(),
      thumbnail:
        $(el).find('img').attr('data-src') ||
        $(el).find('img').attr('src'),
      price: null,
      product_url: link,
      affiliate_url: link
    });
  });

  console.log('🧪 Itens encontrados no HTML:', products.length);
  return products;
}