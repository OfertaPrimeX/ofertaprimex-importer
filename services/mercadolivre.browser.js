import puppeteer from 'puppeteer-core';

export async function searchMercadoLivreBrowser(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
  console.log(`🌐 Navegando para: ${url}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  // 🎭 User-Agent REAL (isso é crucial)
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/122.0.0.0 Safari/537.36'
  );

  await page.setViewport({ width: 1366, height: 768 });

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // ⏳ Aguarda qualquer card de produto (genérico)
  await page.waitForSelector('a[href*="/MLB-"]', {
    timeout: 30000
  });

  const products = await page.evaluate((limit) => {
    const items = [];
    const links = document.querySelectorAll('a[href*="/MLB-"]');

    links.forEach((link) => {
      if (items.length >= limit) return;

      const card = link.closest('div');
      if (!card) return;

      const title =
        card.querySelector('h2')?.innerText?.trim() ||
        link.innerText?.trim();

      if (!title) return;

      const img =
        card.querySelector('img')?.src ||
        card.querySelector('img')?.getAttribute('data-src');

      items.push({
        platform: 'mercadolivre',
        external_id: link.href.split('/').pop(),
        title,
        thumbnail: img || null,
        price: null,
        product_url: link.href,
        affiliate_url: link.href
      });
    });

    return items;
  }, limit);

  await browser.close();

  console.log(`✅ Produtos coletados: ${products.length}`);
  return products;
}