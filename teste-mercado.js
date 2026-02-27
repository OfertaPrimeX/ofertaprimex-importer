// teste-mercado.js - Teste independente do Mercado Livre
// Uso: node teste-mercado.js "termo de busca"

const axios = require('axios');

// Carrega variáveis de ambiente do arquivo .env (se existir)
require('dotenv').config();

// Configurações via variáveis de ambiente
const CLIENT_ID = process.env.ML_CLIENT_ID || '77377...'; // Substitua ou use .env
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'SEU_CLIENT_SECRET'; // Substitua ou use .env

// Pega o termo da linha de comando
const termoBusca = process.argv[2] || 'ps5';

let accessToken = null;

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
      accessToken = response.data.access_token;
      console.log('✅ Token gerado com sucesso!');
      console.log(`📌 Token: ${accessToken.substring(0, 20)}...`);
      console.log(`⏰ Expira em: ${response.data.expires_in} segundos`);
      return true;
    } else {
      console.log('❌ Resposta inesperada:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao gerar token:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   ${error.message}`);
    }
    return false;
  }
}

async function testarBusca(termo) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 TESTANDO BUSCA PARA: "${termo}"`);
  console.log('='.repeat(60));
  
  // 1. Gerar token
  const tokenOk = await gerarToken();
  if (!tokenOk || !accessToken) {
    console.log('❌ Não foi possível prosseguir sem token');
    return;
  }
  
  // 2. Testar /users/me (básico)
  console.log('\n📌 TESTE 1: /users/me');
  try {
    const response = await axios.get('https://api.mercadolibre.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   👤 Usuário: ${response.data.nickname || response.data.id}`);
    console.log(`   📧 Email: ${response.data.email || 'N/A'}`);
    console.log(`   🌐 Site: ${response.data.site_id || 'N/A'}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   📋 Detalhe: ${JSON.stringify(error.response.data)}`);
    }
  }
  
  // 3. Testar /sites/MLB/search (busca de produtos)
  console.log(`\n📌 TESTE 2: /sites/MLB/search?q=${termo}`);
  try {
    const response = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: termo, limit: 5 },
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Total de resultados: ${response.data.paging?.total || 0}`);
    console.log(`   📦 Produtos retornados: ${response.data.results?.length || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n   📌 PRIMEIROS PRODUTOS:');
      response.data.results.slice(0, 3).forEach((p, i) => {
        console.log(`\n   ${i+1}. ${p.title.substring(0, 60)}...`);
        console.log(`      💰 R$ ${p.price}`);
        console.log(`      🏷️  Vendedor: ${p.seller?.nickname || 'N/A'}`);
        console.log(`      🔗 ${p.permalink.substring(0, 50)}...`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   📋 Detalhe: ${JSON.stringify(error.response.data)}`);
    }
    if (error.response?.status === 403) {
      console.log('\n   ⚠️  ERRO 403 DETECTADO!');
      console.log('   Possíveis causas:');
      console.log('   • Token sem permissão (scope) para busca');
      console.log('   • Aplicação bloqueada');
      console.log('   • IP restrito');
      console.log('   • Endpoint desativado para este tipo de token');
    }
  }
  
  // 4. Testar endpoint alternativo (domain_discovery)
  console.log('\n📌 TESTE 3: /sites/MLB/domain_discovery/search (alternativa)');
  try {
    const response = await axios.get('https://api.mercadolibre.com/sites/MLB/domain_discovery/search', {
      params: { q: termo, limit: 1 },
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Resultados: ${response.data.length || 0}`);
    if (response.data.length > 0) {
      console.log(`   📌 Domínio: ${response.data[0].domain_name || 'N/A'}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.response?.status || error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE FINALIZADO');
  console.log('='.repeat(60));
}

// Executar com o termo da linha de comando
testarBusca(termoBusca);