import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Importador Mercado Livre via SCRAPING
 * Executa SOMENTE na camada IMPORTER
 */
export async function searchMercadoLivre(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    },
    timeout: 15000
  });

  const $ = cheerio.load(data);
  const products = [];

  $('.ui-search-result').each((i, el) => {
    if (i >= limit) return false;

    const external_id =
      $(el).attr('data-id') ||
      $(el).find('[data-id]').attr('data-id');

    const title = $(el)
      .find('.ui-search-item__title')
      .text()
      .trim();

    if (!external_id || !title) return;

    const thumbnail =
      $(el).find('img').attr('data-src') ||
      $(el).find('img').attr('src') ||
      null;

    const product_url = $(el).find('a').attr('href') || null;

    products.push({
      platform: 'mercadolivre',
      external_id: external_id.toString(),
      title,
      thumbnail,
      price: null, // opcional: tratar depois
      product_url,
      affiliate_url: product_url,
      score: 3
    });
  });

  return products;
}