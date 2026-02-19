import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
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
// HEALTH
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
// SCRAPER MERCADO LIVRE
// =======================
async function importProducts(query, limit = 10) {
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
    const link = $(el).find('a.ui-search-link').attr('href');
    const price = $(el).find('.andes-money-amount__fraction').first().text();
    const rating = $(el).find('.ui-search-reviews__rating-number').text();

    // filtro: reputação mínima (>= 3)
    if (rating && Number(rating.replace(',', '.')) < 3) return;
    if (!title || !link) return;

    products.push({
      platform: 'mercadolivre',
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-').slice(0, 80),
      price: price ? Number(price.replace('.', '')) : null,
      thumbnail: null,
      affiliate_url: link,
      active: true
    });
  });

  return products;
}

// =======================
// IMPORT ENDPOINT
// =======================
app.post('/internal/import', async (req, res) => {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query obrigatória' });
  }

  const products = await importProducts(query, 10);

  for (const p of products) {
    await pool.query(
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
  }

  res.json({ imported: products.length, status: 'ok' });
});

// =======================
// START
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Importer rodando na porta ${PORT}`);
});
