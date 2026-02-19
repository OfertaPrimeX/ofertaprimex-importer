import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();
app.use(express.json());

// =======================
// CONFIG
// =======================
const PORT = process.env.PORT || 3000;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

// =======================
// DATABASE
// =======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false }
});

// =======================
// HEALTHCHECK
// =======================
app.get('/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(500).json({ status: 'db_error' });
  }
});

// =======================
// SCRAPER ML
// =======================
async function scrapeMercadoLivre(query, limit = 10) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    },
    timeout: 15000
  });

  const $ = cheerio.load(html);
  const products = [];

  $('.ui-search-result').each((_, el) => {
    if (products.length >= limit) return;

    const title = $(el).find('.ui-search-item__title').text().trim();
    const price = $(el).find('.price-tag-fraction').first().text();
    const link = $(el).find('a.ui-search-link').attr('href');

    const sellerText = $(el)
      .find('.ui-search-official-store-label, .ui-search-item__seller-info-text')
      .text()
      .toLowerCase();

    // FILTRO DE REPUTAÇÃO (heurístico seguro)
    const goodSeller =
      sellerText.includes('mercado líder') ||
      sellerText.includes('loja oficial');

    if (!title || !price || !link || !goodSeller) return;

    products.push({
      platform: 'mercadolivre',
      title,
      slug: `${query}-${title}`.toLowerCase().replace(/\W+/g, '-'),
      price: Number(price.replace('.', '')),
      thumbnail: null,
      affiliate_url: link,
      active: true
    });
  });

  // ordena por menor preço
  return products.sort((a, b) => a.price - b.price);
}

// =======================
// IMPORT ENDPOINT
// =======================
app.post('/internal/import', async (req, res) => {
  try {
    if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query obrigatória' });
    }

    const products = await scrapeMercadoLivre(query);

    let inserted = 0;

    for (const p of products) {
      const result = await pool.query(
        `
        INSERT INTO products
          (platform, title, slug, price, thumbnail, affiliate_url, active)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (slug) DO NOTHING
        `,
        [
          p.platform,
          p.title,
          p.slug,
          p.price,
          p.thumbnail,
          p.affiliate_url,
          p.active
        ]
      );

      if (result.rowCount > 0) inserted++;
    }

    res.json({
      imported: inserted,
      found: products.length,
      status: 'ok'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// =======================
// START
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Importer rodando na porta ${PORT}`);
});
