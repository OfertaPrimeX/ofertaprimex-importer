// /app/index.js - Servidor básico do importer
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rota de saúde (para saber se o serviço está vivo)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        servico: 'importer-ofertaprimex',
        versao: '1.0.0'
    });
});

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        nome: 'Importer OfertaPrimeX',
        versao: '1.0.0',
        status: 'ativo',
        endpoints: [
            { rota: '/health', metodo: 'GET', descricao: 'Verificar saúde do serviço' }
        ],
        observacao: 'Serviço de importação de produtos'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 IMPORTER OFERTAPRIMEX');
    console.log('='.repeat(50));
    console.log(`📡 Servidor rodando na porta: ${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(50) + '\n');
});