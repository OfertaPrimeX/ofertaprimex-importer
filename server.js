import express from 'express';
import axios from 'axios';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();
app.use(express.json());

// =======================
// CONFIGURAÇÕES
// =======================
const PORT = process.env.PORT || 3000;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

// =======================
// BANCO DE DADOS
// =======================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false }
});

// =======================
// HEALTH CHECK
// =======================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      service: 'importer',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

// =======================
// FUNÇÃO DE IMPORTAÇÃO
// =======================
async function importProducts(query, limit = 5) {
  const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR,pt;q=0.9'
    },
    timeout: 15000
  });

  const matches = [...html.matchAll(/ui-search-item__title[^>]*>(.*?)</g)];

  return matches.slice(0, limit).map((m, i) => ({
    platform: 'mercadolivre',
    title: m[1],
    slug: `${query}-${i}-${Date.now()}`,
    price: null,
    thumbnail: null,
    affiliate_url: url,
    active: true
  }));
}

// =======================
// ENDPOINT DE IMPORTAÇÃO
// =======================
app.post('/import', async (req, res) => {
  try {
    if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query obrigatória' });
    }

    const products = await importProducts(query);

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

    res.json({
      imported: products.length,
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
