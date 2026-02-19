import express from 'express';
import { findLocalProducts } from '../services/product.service.js';
import { searchMercadoLivre } from '../services/mercadolivre.service.js';

const router = express.Router();

router.post('/search', async (req, res) => {
  const { query } = req.body;

  const local = await findLocalProducts(query);
  if (local.length > 0) {
    return res.json({ source: 'local', products: local });
  }

  const external = await searchMercadoLivre(query);
  res.json({ source: 'external', products: external });
});

export default router;
