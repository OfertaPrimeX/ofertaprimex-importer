cat > /app/importacao/utils.js << 'EOF'
// /app/importacao/utils.js
const fs = require('fs');

function log(mensagem, tipo = 'INFO', arquivoLog = '/app/logs/importacao.log') {
    const linha = `[${new Date().toISOString()}] ${tipo}: ${mensagem}`;
    console.log(linha);
    fs.appendFileSync(arquivoLog, linha + '\n');
}

function formatarPreco(valor) {
    if (!valor) return 0;
    // Remove R$, pontos e substitui vírgula por ponto
    const numero = String(valor).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numero) || 0;
}

function formatarInteiro(valor) {
    if (!valor) return 0;
    return parseInt(String(valor).replace(/\D/g, '')) || 0;
}

function formatarBooleano(valor) {
    if (!valor) return false;
    return String(valor).toLowerCase().includes('sim');
}

module.exports = {
    log,
    formatarPreco,
    formatarInteiro,
    formatarBooleano
};
EOF