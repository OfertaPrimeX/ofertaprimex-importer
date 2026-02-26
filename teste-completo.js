// ============================================
// TESTE COMPLETO - GERA TOKEN E TESTA TUDO
// ============================================

// COLE SEU CLIENT ID E SECRET AQUI
const CLIENT_ID = '7737778191417887'; // Substitua pelo seu Client ID
const CLIENT_SECRET = 'ILIE3mywj9F1uT4hwb4As1pbczMtCbID'; // Substitua pelo seu Client Secret

let accessToken = null;

// Função para gerar token
async function gerarToken() {
  console.log('\n🔄 Gerando token com Client ID...');
  
  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      accessToken = data.access_token;
      console.log('✅ Token gerado com sucesso!');
      console.log(`   Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   Expira em: ${data.expires_in} segundos`);
      return true;
    } else {
      console.log('❌ Erro ao gerar token:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

// Teste 1: API de busca com token
async function testarBuscaComToken(termo) {
  console.log(`\n🔍 Testando busca com token para: "${termo}"`);
  
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=3`;
    
    const resposta = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log(`   Status: ${resposta.status} ${resposta.statusText}`);
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`   ✅ Produtos encontrados: ${dados.results?.length || 0}`);
      if (dados.results?.length > 0) {
        console.log(`   🏷️ Primeiro: ${dados.results[0].title.substring(0, 50)}`);
        console.log(`   💰 Preço: R$ ${dados.results[0].price}`);
      }
    } else {
      const erro = await resposta.text();
      console.log(`   ❌ Erro: ${erro.substring(0, 150)}`);
    }
  } catch (erro) {
    console.log(`   ❌ Erro: ${erro.message}`);
  }
}

// Teste 2: API de categorias (pública)
async function testarCategorias() {
  console.log('\n🔍 Testando API de categorias (pública)...');
  
  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/categories';
    
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    console.log(`   Status: ${resposta.status} ${resposta.statusText}`);
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`   ✅ Categorias encontradas: ${dados.length}`);
      console.log(`   📌 Primeira: ${dados[0]?.name}`);
    }
  } catch (erro) {
    console.log(`   ❌ Erro: ${erro.message}`);
  }
}

// Teste 3: Scraping da página de lista
async function testarScraping(termo) {
  console.log(`\n🔍 Testando scraping da lista para: "${termo}"`);
  
  try {
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    
    console.log(`   Status: ${resposta.status} ${resposta.statusText}`);
    
    if (resposta.ok) {
      const html = await resposta.text();
      
      // Procura por padrões de produto no HTML
      const regexProduto = /ui-search-layout__item/g;
      const matches = html.match(regexProduto);
      const quantidade = matches ? matches.length : 0;
      
      console.log(`   📊 Produtos encontrados no HTML: ${quantidade}`);
      console.log(`   📏 Tamanho do HTML: ${html.length} caracteres`);
      
      // Verifica se pede login
      if (html.includes('acesse sua conta') || html.includes('Olá! Para continuar')) {
        console.log('   ⚠️ Página pedindo login detectado!');
      }
    }
  } catch (erro) {
    console.log(`   ❌ Erro: ${erro.message}`);
  }
}

// Função principal
async function executarTestes() {
  console.log('='.repeat(60));
  console.log('🚀 INICIANDO TESTE COMPLETO DO MERCADO LIVRE');
  console.log('='.repeat(60));
  
  // 1. Gerar token
  const tokenOk = await gerarToken();
  
  if (tokenOk) {
    // 2. Testar busca com token
    await testarBuscaComToken('ps5');
    
    // 3. Testar outro termo
    await testarBuscaComToken('iphone');
  } else {
    console.log('\n❌ Não foi possível gerar token. Verifique Client ID e Secret.');
  }
  
  // 4. Testar API pública de categorias
  await testarCategorias();
  
  // 5. Testar scraping
  await testarScraping('ps5');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTES FINALIZADOS');
  console.log('='.repeat(60));
}

// EXECUTAR TUDO
executarTestes();