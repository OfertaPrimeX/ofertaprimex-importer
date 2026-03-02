import express from 'express';
//import { runMercadoLivreJob } from './jobs/mercadolivre.job.js';

const app = express();
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Importer rodando na porta ${PORT}`);

  // dispara uma vez no start
  await runMercadoLivreJob('geladeira');
});