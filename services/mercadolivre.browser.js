import { chromium } from 'playwright';

export async function searchMercadoLivreBrowser(query, limit = 10) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  await page.goto(
    `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }
  );

  await page.waitForSelector('.ui-search-result', { timeout: 30000 });

  const products = await page.$$eval('.ui-search-result', (items, limit) =>
    items.slice(0, limit).map(el => ({
      platform: 'mercadolivre',
      external_id: el.getAttribute('data-id'),
      title: el.querySelector('.ui-search-item__title')?.innerText?.trim(),
      product_url: el.querySelector('a')?.href,
      affiliate_url: el.querySelector('a')?.href,
      thumbnail:
        el.querySelector('img')?.getAttribute('data-src') ||
        el.querySelector('img')?.src,
      price: null
    })),
    limit
  );

  await browser.close();
  return products;
}