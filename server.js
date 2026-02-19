import express from 'express';
import importRoutes from './routes/import.routes.js';

const app = express();
app.use(express.json());

app.use('/import', importRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Importer rodando na porta ${PORT}`)
);
