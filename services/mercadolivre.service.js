import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMercadoLivre(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR'
    },
    timeout: 15000
  });

  const $ = cheerio.load(data);
  const products = [];

  $('.ui-search-result').each((i, el) => {
    if (i >= limit) return;

    const link = $(el).find('a').attr('href');

    products.push({
      platform: 'mercadolivre',
      external_id: $(el).attr('data-id'),
      title: $(el).find('.ui-search-item__title').text().trim(),
      thumbnail:
        $(el).find('img').attr('data-src') ||
        $(el).find('img').attr('src'),
      price: null,
      product_url: link,
      affiliate_url: link,
      score: 3
    });
  });

  return products;
}
