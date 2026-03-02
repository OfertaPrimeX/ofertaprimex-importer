cat > /app/importar.js << 'EOF'
#!/usr/bin/env node
// /app/importar.js - Script para executar a importação facilmente

const { importarTodosCSVs } = require('./importacao/importar_ml_para_banco');

console.log('📦 Iniciando importação do Mercado Livre...');
importarTodosCSVs().catch(console.error);
EOF

# Dar permissão de execução
chmod +x /app/importar.js