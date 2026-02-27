// index.js - Servidor básico para manter o serviço vivo
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rota de saúde (para saber se o servidor está vivo)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    servico: 'importer-ofertaprimex',
    mensagem: 'Servidor funcionando normalmente'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    nome: 'Importer OfertaPrimeX',
    versao: '1.0.0',
    endpoints: [
      { rota: '/health', metodo: 'GET', descricao: 'Verificar saúde do serviço' }
    ],
    observacao: 'Para testes com Mercado Livre, use: node teste-mercado.js'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 IMPORTER OFERTAPRIMEX');
  console.log('='.repeat(50));
  console.log(`📡 Servidor rodando na porta: ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Para testar Mercado Livre, execute:`);
  console.log(`   node teste-mercado.js`);
  console.log('='.repeat(50) + '\n');
});