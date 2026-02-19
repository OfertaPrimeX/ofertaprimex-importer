import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMercadoLivre(query) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR'
    }
  });

  const $ = cheerio.load(data);
  const products = [];

  $('.ui-search-result').each((i, el) => {
    if (i >= 10) return;

    products.push({
      platform: 'mercadolivre',
      external_id: $(el).attr('data-id'),
      title: $(el).find('.ui-search-item__title').text().trim(),
      thumbnail: $(el).find('img').attr('data-src'),
      price: null,
      product_url: $(el).find('a').attr('href'),
      affiliate_url: $(el).find('a').attr('href'),
      score: 3
    });
  });

  return products;
}
