import puppeteer from 'puppeteer';

export async function searchMercadoLivreBrowser(query, limit = 10) {
  console.log(`🧪 Abrindo navegador Puppeteer para: ${query}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
  console.log(`🌐 Navegando para: ${url}`);

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // 👇 seletor MAIS ESTÁVEL
  await page.waitForSelector('li.ui-search-layout__item', { timeout: 60000 });

  const products = await page.evaluate((limit) => {
    const items = Array.from(
      document.querySelectorAll('li.ui-search-layout__item')
    ).slice(0, limit);

    return items.map(el => {
      const link = el.querySelector('a')?.href || null;
      return {
        platform: 'mercadolivre',
        external_id: el.getAttribute('data-id') || link,
        title: el.querySelector('h2')?.innerText?.trim() || 'Sem título',
        thumbnail: el.querySelector('img')?.src || null,
        price: null,
        product_url: link,
        affiliate_url: link
      };
    });
  }, limit);

  await browser.close();

  console.log(`✅ Produtos encontrados: ${products.length}`);
  return products;
}