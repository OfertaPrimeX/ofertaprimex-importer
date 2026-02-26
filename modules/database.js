const { Pool } = require('pg');

// Configuração do banco (pega das variáveis de ambiente)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Evita que erros de banco quebrem o servidor
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
});

// Função para testar conexão
async function testarConexao() {
  try {
    const client = await pool.connect();
    console.log('✅ Banco conectado!');
    client.release();
    return true;
  } catch (erro) {
    console.error('❌ Banco DESCONECTADO:', erro.message);
    return false;
  }
}

// Função para salvar produtos (por enquanto só simula)
async function salvarProdutos(produtos) {
  try {
    console.log(`📦 Simulando salvamento de ${produtos.length} produtos...`);
    
    // AQUI você vai implementar depois o INSERT no banco
    // Por enquanto só retorna sucesso
    
    return { sucesso: true, quantidade: produtos.length };
  } catch (erro) {
    console.error('❌ Erro ao salvar:', erro);
    return { sucesso: false, erro: erro.message };
  }
}

module.exports = {
  testarConexao,
  salvarProdutos,
  pool // exporta o pool caso precise em outros arquivos
};