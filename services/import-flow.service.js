import { searchMercadoLivre } from './mercadolivre.service.js';
import { findLocalProducts, insertProduct } from './product.service.js';
import axios from 'axios';

export async function importMercadoLivreFlow(query) {
  // 1️⃣ Verifica cache local (hoje)
  const local = await findLocalProducts(query);
  if (local.length > 0) {
    return { source: 'cache', products: local };
  }

  // 2️⃣ Scraping
  const scraped = await searchMercadoLivre(query);
  if (scraped.length === 0) {
    return { source: 'empty', products: [] };
  }

  // 3️⃣ Persiste local
  for (const p of scraped) {
    await insertProduct(p);
  }

  // 4️⃣ Envia para o BACKEND
  await axios.post(
    `${process.env.BACKEND_URL}/import/internal`,
    { products: scraped },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_KEY
      },
      timeout: 15000
    }
  );

  return { source: 'scraping', products: scraped };
}
