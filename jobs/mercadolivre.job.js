import { searchMercadoLivre } from '../services/mercadolivre.service.js';
import { findLocalProducts, insertProduct } from '../services/product.service.js';

export async function runMercadoLivreJob(query) {
  console.log(`🔍 ML JOB iniciado para: ${query}`);

  // 1️⃣ Busca produtos já existentes hoje
  const existing = await findLocalProducts(query);
  const existingIds = new Set(existing.map(p => p.external_id));

  // 2️⃣ Busca no Mercado Livre
  const imported = await searchMercadoLivre(query);

  let inserted = 0;

  // 3️⃣ Insere somente novos
  for (const product of imported) {
    if (existingIds.has(product.external_id)) continue;

    await insertProduct(product);
    inserted++;
  }

  console.log(
    `✅ ML JOB finalizado | encontrados: ${imported.length} | inseridos: ${inserted}`
  );

  return {
    found: imported.length,
    inserted
  };
}
