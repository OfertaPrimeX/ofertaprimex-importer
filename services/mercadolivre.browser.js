import puppeteer from 'puppeteer';

export async function searchMercadoLivreBrowser(query, limit = 10) {
  console.log(`🧪 Abrindo navegador Puppeteer para: ${query}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  );

  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Aguarda os produtos aparecerem
  await page.waitForSelector('.ui-search-result', { timeout: 30000 });

  const products = await page.evaluate((limit) => {
    const items = [];
    const nodes = document.querySelectorAll('.ui-search-result');

    nodes.forEach((el, i) => {
      if (i >= limit) return;

      const title = el.querySelector('.ui-search-item__title')?.innerText;
      const link = el.querySelector('a')?.href;
      const img = el.querySelector('img')?.src || null;
      const id = el.getAttribute('data-id');

      if (!title || !link || !id) return;

      items.push({
        platform: 'mercadolivre',
        external_id: id,
        title,
        price: null,
        thumbnail: img,
        product_url: link,
        affiliate_url: link
      });
    });

    return items;
  }, limit);

  await browser.close();

  console.log(`🧪 Produtos capturados: ${products.length}`);
  return products;
}