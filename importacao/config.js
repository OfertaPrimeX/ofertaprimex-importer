cat > /app/importacao/config.js << 'EOF'
// /app/importacao/config.js
const path = require('path');

module.exports = {
    // Pastas
    pasta_csv: '/app/csv',
    pasta_logs: '/app/logs',
    
    // Arquivos
    arquivo_log: '/app/logs/importacao.log',
    
    // Configurações de banco (usando variáveis de ambiente)
    banco: {
        host: process.env.DB_HOST || 'postgres',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ofertaprimex',
        user: process.env.DB_USER || 'ofertaprimex_user',
        password: process.env.DB_PASSWORD,
        ssl: false
    },
    
    // Configurações de importação
    importacao: {
        lote_tamanho: 50,  // Inserir em lotes de 50
        ignorar_duplicatas: true
    }
};
EOF