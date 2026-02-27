// teste-mercado.js - Teste com busca nos produtos do seu usuário
const axios = require('axios');
require('dotenv').config();

// Credenciais
const CLIENT_ID = process.env.ML_CLIENT_ID || '773777819141...'; // Seu Client ID
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'SEU_CLIENT_SECRET';
const USER_ID = 'BRHE5975963'; // SEU ID de usuário (do /users/me)

// URL de redirecionamento (a mesma cadastrada no DevCenter)
const REDIRECT_URI = 'https://ofertaprimex.com.br';

console.log('\n' + '='.repeat(70));
console.log('🔧 CONFIGURAÇÃO - BUSCA NOS SEUS PRODUTOS');
console.log('='.repeat(70));
console.log(`📌 Redirect URI: ${REDIRECT_URI} ✅`);
console.log(`📌 Client ID: ${CLIENT_ID.substring(0, 10)}...`);
console.log(`📌 User ID: ${USER_ID} (seu ID do Mercado Livre)`);
console.log('='.repeat(70));

async function gerarToken() {
  console.log('\n🔄 Gerando token...');
  
  try {
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      console.log('✅ Token gerado com sucesso!');
      console.log(`📌 Token: ${response.data.access_token.substring(0, 20)}...`);
      console.log(`⏰ Expira em: ${response.data.expires_in} segundos`);
      return response.data.access_token;
    }
  } catch (error) {
    console.log('❌ Erro ao gerar token:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   ${error.message}`);
    }
    return null;
  }
}

async function buscarProdutosDoUsuario(token, termo) {
  console.log(`\n📌 BUSCANDO PRODUTOS DO SEU USUÁRIO (ID: ${USER_ID})`);
  console.log('-'.repeat(70));
  
  try {
    // ENDPOINT OFICIAL RECOMENDADO PELO MERCADO LIVRE
    // Fonte: https://global-selling.mercadolibre.com/devsite/category-dump-global-selling/items-and-searches-global-selling [citation:1]
    const url = `https://api.mercadolibre.com/users/${USER_ID}/items/search`;
    
    console.log(`🔗 URL: ${url}?q=${encodeURIComponent(termo)}`);
    
    const response = await axios.get(url, {
      params: { 
        q: termo,           // Termo de busca nos seus produtos
        limit: 20,          // Máximo de resultados
        status: 'active'    // Filtra por produtos ativos
      },
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Total de produtos: ${response.data.paging?.total || 0}`);
    console.log(`   📦 Produtos retornados: ${response.data.results?.length || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n   📌 IDs DOS SEUS PRODUTOS ENCONTRADOS:');
      response.data.results.slice(0, 10).forEach((itemId, i) => {
        console.log(`   ${i+1}. ID: ${itemId}`);
      });
      
      // Se quiser detalhes do primeiro produto
      if (response.data.results.length > 0) {
        console.log('\n   🔍 Buscando detalhes do primeiro produto...');
        await detalhesProduto(token, response.data.results[0]);
      }
    } else {
      console.log('\n   ⚠️ Nenhum produto encontrado com esse termo.');
      console.log('   💡 Dica: Você tem produtos publicados no Mercado Livre?');
      console.log('   💡 Teste sem termo de busca para ver todos os seus produtos:');
      console.log(`   curl -X GET -H 'Authorization: Bearer ${token}' ${url}`);
    }
    
    return response.data;
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
    if (error.response?.data) {
      console.log(`   📋 Detalhe: ${JSON.stringify(error.response.data)}`);
    }
    
    if (error.response?.status === 403) {
      console.log('\n   ⚠️ ERRO 403 NO NOVO ENDPOINT - POSSÍVEIS CAUSAS:');
      console.log('   1. Seu token pode não ter permissão para acessar produtos');
      console.log('   2. Você pode não ter produtos publicados');
      console.log('   3. A aplicação pode precisar de autorização adicional');
    }
    return null;
  }
}

async function detalhesProduto(token, itemId) {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`\n   📌 DETALHES DO PRODUTO:`);
    console.log(`      Título: ${response.data.title}`);
    console.log(`      Preço: R$ ${response.data.price}`);
    console.log(`      Status: ${response.data.status}`);
    console.log(`      Link: ${response.data.permalink}`);
  } catch (error) {
    console.log(`   ❌ Erro ao buscar detalhes: ${error.response?.status}`);
  }
}

async function testarTodosEndpoints(termo) {
  console.log('\n' + '='.repeat(70));
  console.log(`🔍 TESTANDO BUSCA NOS SEUS PRODUTOS: "${termo}"`);
  console.log('='.repeat(70));
  
  const token = await gerarToken();
  if (!token) return;
  
  // 1. Teste /users/me (confirmar usuário)
  console.log('\n📌 TESTE 1: /users/me (confirmando seus dados)');
  try {
    const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   ✅ Status: ${userResponse.status}`);
    console.log(`   👤 Usuário: ${userResponse.data.nickname}`);
    console.log(`   🆔 ID: ${userResponse.data.id}`);
    console.log(`   📧 Email: ${userResponse.data.email}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
  }
  
  // 2. ENDPOINT ANTIGO (deve dar 403 - confirmado)
  console.log('\n📌 TESTE 2: /sites/MLB/search (antigo - deve dar 403)');
  try {
    await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: termo, limit: 1 },
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (error) {
    console.log(`   ✅ Status: ${error.response?.status} (confirmado - endpoint deprecated) [citation:1]`);
  }
  
  // 3. NOVO ENDPOINT OFICIAL (busca nos seus produtos)
  console.log('\n📌 TESTE 3: /users/{user_id}/items/search (NOVO OFICIAL)');
  await buscarProdutosDoUsuario(token, termo);
  
  // 4. Testar busca sem termo (todos os produtos)
  console.log('\n📌 TESTE 4: Todos os seus produtos (sem filtro)');
  try {
    const todosResponse = await axios.get(`https://api.mercadolibre.com/users/${USER_ID}/items/search`, {
      params: { limit: 5 },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   ✅ Status: ${todosResponse.status}`);
    console.log(`   📊 Total de produtos: ${todosResponse.data.paging?.total || 0}`);
    console.log(`   📦 Primeiros: ${todosResponse.data.results?.slice(0, 3).join(', ') || 'Nenhum'}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ TESTE FINALIZADO');
  console.log('='.repeat(70));
  console.log('\n📌 DOCUMENTAÇÃO OFICIAL:');
  console.log('   https://global-selling.mercadolibre.com/devsite/category-dump-global-selling/items-and-searches-global-selling [citation:1]');
}

// Executar
const termo = process.argv[2] || 'ps5';
testarTodosEndpoints(termo);