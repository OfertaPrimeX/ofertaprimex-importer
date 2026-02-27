// teste-mercado.js - Versão com domínio oficial aprovado
const axios = require('axios');
require('dotenv').config();

// Credenciais
const CLIENT_ID = process.env.ML_CLIENT_ID || '77377...'; // Seu Client ID
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'SEU_CLIENT_SECRET';

// URL OFICIAL que foi ACEITA pelo Mercado Livre
const REDIRECT_URI = 'https://ofertaprimex.com.br';

console.log('\n' + '='.repeat(60));
console.log('🔧 CONFIGURAÇÃO ATUALIZADA');
console.log('='.repeat(60));
console.log(`📌 Redirect URI: ${REDIRECT_URI} ✅ (aceita pelo ML)`);
console.log(`📌 Client ID: ${CLIENT_ID.substring(0, 10)}...`);
console.log('='.repeat(60));

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
      console.log(`🔗 Redirect URI usada: ${REDIRECT_URI}`);
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

async function testarBusca(termo) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 TESTANDO BUSCA PARA: "${termo}"`);
  console.log('='.repeat(60));
  
  const token = await gerarToken();
  if (!token) return;
  
  // 1. Teste /users/me
  console.log('\n📌 TESTE 1: /users/me');
  try {
    const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   ✅ Status: ${userResponse.status}`);
    console.log(`   👤 Usuário: ${userResponse.data.nickname}`);
    console.log(`   📧 Email: ${userResponse.data.email}`);
    console.log(`   🔗 Redirect URI configurada: ${REDIRECT_URI}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
  }
  
  // 2. Teste de busca (agora com a URI correta)
  console.log(`\n📌 TESTE 2: /sites/MLB/search?q=${termo}`);
  try {
    const searchResponse = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: termo, limit: 5 },
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ Status: ${searchResponse.status}`);
    console.log(`   📊 Total de resultados: ${searchResponse.data.paging?.total || 0}`);
    console.log(`   📦 Produtos retornados: ${searchResponse.data.results?.length || 0}`);
    
    if (searchResponse.data.results?.length > 0) {
      console.log('\n   📌 PRIMEIROS PRODUTOS:');
      searchResponse.data.results.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.title.substring(0, 60)}...`);
        console.log(`      💰 R$ ${p.price}`);
        console.log(`      🏷️  Vendedor: ${p.seller?.nickname || 'N/A'}`);
        console.log(`      🔗 ${p.permalink.substring(0, 50)}...`);
      });
    } else {
      console.log('\n   ⚠️ Nenhum produto encontrado, mas o STATUS 200 seria uma vitória!');
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
    if (error.response?.data) {
      console.log(`   📋 Detalhe: ${JSON.stringify(error.response.data)}`);
    }
    if (error.response?.status === 403) {
      console.log('\n   ⚠️  AINDA COM ERRO 403 - POSSÍVEIS CAUSAS:');
      console.log('   1. A redirect URI no DevCenter está EXATAMENTE como:', REDIRECT_URI);
      console.log('   2. Pode levar alguns minutos para propagar');
      console.log('   3. O token gerado ANTES da mudança pode estar em cache');
    }
  }
  
  // 3. Teste domain_discovery
  console.log('\n📌 TESTE 3: /domain_discovery/search');
  try {
    const domainResponse = await axios.get('https://api.mercadolibre.com/sites/MLB/domain_discovery/search', {
      params: { q: termo, limit: 1 },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   ✅ Status: ${domainResponse.status}`);
    console.log(`   📊 Domínios: ${domainResponse.data.length || 0}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE FINALIZADO');
  console.log('='.repeat(60));
}

// Executar
const termo = process.argv[2] || 'ps5';
testarBusca(termo);