import express from 'express';
import importRoutes from './routes/import.routes.js';
import { runMercadoLivreJob } from './jobs/mercadolivre.job.js';

const app = express();
app.use(express.json());

app.use('/import', importRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// 🔁 JOB AUTOMÁTICO (a cada 30 minutos)
const KEYWORDS = ['geladeira', 'tv', 'notebook'];

async function runJobs() {
  for (const q of KEYWORDS) {
    await runMercadoLivreJob(q);
  }
}

// primeira execução
runJobs();

// intervalo
setInterval(runJobs, 30 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Importer rodando na porta ${PORT}`)
);
