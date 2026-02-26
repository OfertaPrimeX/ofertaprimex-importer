const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testar() {
  console.log('🚀 Importer iniciado em:', new Date().toISOString());
  
  try {
    const client = await pool.connect();
    console.log('✅ Conectou no banco com sucesso!');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        titulo TEXT,
        preco DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela criada/verificada!');
    
    client.release();
    console.log('✅ Importer finalizado com sucesso!');
  } catch (erro) {
    console.error('❌ Erro:', erro.message);
  }
}

testar();