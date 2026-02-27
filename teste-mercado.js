const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.ML_CLIENT_ID || '773777819141...';
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'SEU_CLIENT_SECRET';
const USER_ID_NUMERICO = '306350586'; // SEU ID NUMÉRICO (do /users/me)
const REDIRECT_URI = 'https://ofertaprimex.com.br';

async function gerarToken() {
  console.log('🔄 Gerando token...');
  const response = await axios.post('https://api.mercadolibre.com/oauth/token', 
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  console.log('✅ Token gerado!');
  return response.data.access_token;
}

async function buscarProdutosUsuario(token) {
  console.log('\n📌 BUSCANDO PRODUTOS DO SEU USUÁRIO');
  console.log('-'.repeat(50));
  
  // ENDPOINT CORRETO da documentação oficial [citation:1]
  const url = `https://api.mercadolibre.com/users/${USER_ID_NUMERICO}/items/search`;
  
  console.log(`🔗 URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      params: { 
        limit: 50,
        status: 'active' // Opcional: filtra apenas ativos
      },
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Total de produtos: ${response.data.paging?.total || 0}`);
    console.log(`📦 IDs: ${response.data.results?.slice(0, 5).join(', ') || 'Nenhum'}`);
    
    // Se tiver produtos, busca detalhes do primeiro
    if (response.data.results?.length > 0) {
      const primeiroId = response.data.results[0];
      console.log(`\n📌 Buscando detalhes do produto: ${primeiroId}`);
      
      const itemResponse = await axios.get(`https://api.mercadolibre.com/items/${primeiroId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   Título: ${itemResponse.data.title}`);
      console.log(`   Preço: R$ ${itemResponse.data.price}`);
      console.log(`   Link: ${itemResponse.data.permalink}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.response?.status}`);
    console.log(`📋 Detalhe: ${JSON.stringify(error.response?.data)}`);
    
    if (error.response?.status === 403) {
      console.log('\n⚠️ Verifique se sua aplicação tem as permissões:');
      console.log('1. Acesse: https://developers.mercadolivre.com.br/devcenter');
      console.log('2. Selecione sua aplicação');
      console.log('3. Em "Scopes", habilite: "read", "write"');
      console.log('4. Gere um novo token após alterar as permissões');
    }
  }
}

async function testar() {
  const token = await gerarToken();
  await buscarProdutosUsuario(token);
}

testar();