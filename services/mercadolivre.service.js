import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchMercadoLivre(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    },
    timeout: 15000
  });

  const $ = cheerio.load(data);
  const products = [];

  $('.ui-search-result').each((i, el) => {
    if (i >= limit) return false;

    const link =
      $(el).find('a.ui-search-link').attr('href') ||
      $(el).find('a').attr('href');

    const title = $(el)
      .find('.ui-search-item__title')
      .text()
      .trim();

    if (!title || !link) return;

    // 🔑 external_id seguro (hash do link)
    const external_id = Buffer.from(link)
      .toString('base64')
      .slice(0, 40);

    // 💰 Preço
    const priceText = $(el)
      .find('.andes-money-amount__fraction')
      .first()
      .text()
      .replace('.', '');

    const price = priceText
      ? Number(priceText)
      : null;

    const thumbnail =
      $(el).find('img').attr('data-src') ||
      $(el).find('img').attr('src') ||
      null;

    products.push({
      platform: 'mercadolivre',
      external_id,
      title,
      price,
      thumbnail,
      product_url: link,
      affiliate_url: link,
      score: 3
    });
  });

  return products;
}