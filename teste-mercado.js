const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.ML_CLIENT_ID || '773777819141...';
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'SEU_CLIENT_SECRET';
const USER_ID_NUMERICO = '306350586'; // 👈 SEU ID NUMÉRICO (do /users/me)
const REDIRECT_URI = 'https://ofertaprimex.com.br';

async function gerarToken() {
  const response = await axios.post('https://api.mercadolibre.com/oauth/token', 
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  return response.data.access_token;
}

async function buscarProdutosUsuario(token) {
  console.log('\n📌 BUSCANDO PRODUTOS DO SEU USUÁRIO (via endpoint oficial)');
  console.log('-'.repeat(60));
  
  // ENDPOINT CORRETO da documentação
  const url = `https://api.mercadolibre.com/marketplace/users/${USER_ID_NUMERICO}/items/search`;
  
  try {
    const response = await axios.get(url, {
      params: { limit: 20 },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Total de produtos: ${response.data.paging?.total || 0}`);
    console.log(`📦 IDs: ${response.data.results?.join(', ') || 'Nenhum'}`);
    
    // Se tiver produtos, busca detalhes do primeiro
    if (response.data.results?.length > 0) {
      const itemId = response.data.results[0];
      const itemResponse = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('\n📌 Primeiro produto:');
      console.log(`   Título: ${itemResponse.data.title}`);
      console.log(`   Preço: R$ ${itemResponse.data.price}`);
      console.log(`   Link: ${itemResponse.data.permalink}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status}`);
    console.log(`📋 Detalhe: ${JSON.stringify(error.response?.data)}`);
  }
}

async function testar() {
  const token = await gerarToken();
  await buscarProdutosUsuario(token);
}

testar();