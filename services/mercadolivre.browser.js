import { chromium } from 'playwright';

export async function searchMercadoLivreBrowser(query, limit = 10) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
  console.log('🌐 Abrindo:', url);

  await page.goto(url, { waitUntil: 'networkidle' });

  // Aguarda os cards aparecerem
  await page.waitForSelector('.ui-search-result', { timeout: 15000 });

  const products = await page.$$eval('.ui-search-result', (items, limit) => {
    return items.slice(0, limit).map(el => {
      const link = el.querySelector('a')?.href || null;
      const title =
        el.querySelector('.ui-search-item__title')?.innerText || null;
      const img =
        el.querySelector('img')?.getAttribute('src') ||
        el.querySelector('img')?.getAttribute('data-src');

      return {
        platform: 'mercadolivre',
        external_id: el.getAttribute('data-id'),
        title,
        thumbnail: img,
        price: null,
        product_url: link,
        affiliate_url: link
      };
    });
  }, limit);

  await browser.close();

  console.log(`🧪 Produtos capturados: ${products.length}`);
  return products;
}