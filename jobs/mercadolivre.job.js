import axios from 'axios';
import { searchMercadoLivre } from '../services/mercadolivre.service.js';

const BACKEND_URL = process.env.BACKEND_URL;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

export async function runMercadoLivreJob(query = 'geladeira') {
  console.log(`🔍 ML JOB iniciado para: ${query}`);

  const products = await searchMercadoLivre(query);

  if (!products.length) {
    console.log('⚠️ Nenhum produto encontrado');
    return;
  }

  await axios.post(
    `${BACKEND_URL}/import/internal`,
    { products },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY
      },
      timeout: 20000
    }
  );

  console.log(`✅ ${products.length} produtos enviados ao backend`);
}
