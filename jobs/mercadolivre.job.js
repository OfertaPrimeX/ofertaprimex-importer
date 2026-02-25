import axios from 'axios';
import { searchMercadoLivreBrowser } from '../services/mercadolivre.browser.js';

const BACKEND_URL = process.env.BACKEND_URL;
const INTERNAL_KEY = process.env.INTERNAL_KEY;

export async function runMercadoLivreJob(query = 'geladeira') {
  console.log(`🔍 ML JOB (Puppeteer) iniciado para: ${query}`);

  const products = await searchMercadoLivreBrowser(query);

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

  console.log(`🚀 ${products.length} produtos enviados ao backend`);
}