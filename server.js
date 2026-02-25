import express from 'express';
import importRoutes from './routes/import.routes.js';
import { runMercadoLivreJob } from './jobs/mercadolivre.job.js';

const app = express();
app.use(express.json());

app.use('/import', importRoutes);

app.get('/health', (_, res) =>
  res.json({ status: 'ok' })
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Importer rodando na porta ${PORT}`);

  // teste inicial controlado
  await runMercadoLivreJob('geladeira');
});