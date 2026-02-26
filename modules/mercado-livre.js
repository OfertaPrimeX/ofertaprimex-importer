// COLE SEU CLIENT ID E SECRET AQUI
const CLIENT_ID = '7737778191417887';
const CLIENT_SECRET = 'ILIE3mywj9F1uT4hwb4As1pbczMtCbID';

// Cache do token
let accessToken = null;
let tokenExpiraEm = null;

// Função para gerar token com Client ID e Secret
async function gerarAccessToken() {
  // Se já tem token válido, usa ele
  if (accessToken && tokenExpiraEm && Date.now() < tokenExpiraEm) {
    console.log('🔄 Usando token em cache');
    return accessToken;
  }
  
  console.log('🔄 Gerando novo access token com Client ID...');
  console.log(`   Client ID: ${CLIENT_ID.substring(0, 5)}...`); // Mostra só início por segurança
  
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
      tokenExpiraEm = Date.now() + (data.expires_in * 1000);
      console.log('✅ Token gerado com sucesso!');
      console.log(`   Expira em: ${new Date(tokenExpiraEm).toLocaleTimeString()}`);
      return accessToken;
    } else {
      console.error('❌ Erro ao gerar token:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição do token:', error.message);
    return null;
  }
}

function processarResultados(dados, termo) {
  if (!dados || !dados.results) return [];
  
  return dados.results.map(produto => {
    let pontuacao = 4.0;
    
    if (produto.seller?.seller_reputation?.power_seller_status) {
      pontuacao = 5.0;
    } else if (produto.seller?.seller_reputation?.level_id) {
      pontuacao = 4.5;
    }
    
    return {
      id_externo: produto.id,
      titulo: produto.title,
      preco: produto.price,
      preco_original: produto.original_price,
      link: produto.permalink,
      pontuacao: pontuacao,
      imagem: produto.thumbnail,
      plataforma: 'mercadolivre',
      termo_busca: termo,
      condicao: produto.condition,
      moeda: produto.currency_id
    };
  });
}

async function buscarProdutos(termo) {
  console.log(`\n🔍 Buscando: "${termo}"...`);
  
  // 1. Gera/obtém o token (AGORA VAI APARECER NO LOG)
  const token = await gerarAccessToken();
  
  if (!token) {
    console.log('❌ Não foi possível obter token');
    return [];
  }
  
  // 2. Faz a busca com o token
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
  
  try {
    const resposta = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (resposta.ok) {
      const dados = await resposta.json();
      const produtos = processarResultados(dados, termo);
      console.log(`✅ ${produtos.length} produtos encontrados`);
      return produtos;
    } else {
      const erroTexto = await resposta.text();
      console.log(`❌ Falha: ${resposta.status} - ${resposta.statusText}`);
      console.log(`   Detalhe: ${erroTexto.substring(0, 100)}`);
      
      // Se o token expirou (401), limpa o cache e tenta de novo
      if (resposta.status === 401) {
        console.log('🔄 Token expirado, tentando novamente...');
        accessToken = null;
        return await buscarProdutos(termo); // Tenta uma vez com token novo
      }
      
      return [];
    }
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
    return [];
  }
}

async function buscarMultiplosTermos(termos) {
  const resultados = [];
  
  for (const termo of termos) {
    const produtos = await buscarProdutos(termo);
    resultados.push(...produtos);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return resultados;
}

async function testarEndpointAlternativo() {
  console.log('\n🧪 Testando conexão com Mercado Livre...');
  
  const token = await gerarAccessToken();
  
  if (!token) {
    console.log('❌ Não foi possível obter token para teste');
    return false;
  }
  
  try {
    // Testa com o endpoint /users/me (que sempre funciona com token válido)
    const url = 'https://api.mercadolibre.com/users/me';
    const resposta = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`✅ Conectado como: ${dados.nickname || dados.id}`);
      console.log(`   Site: ${dados.site_id}`);
      console.log(`   Status: ${dados.status?.site_status || 'ativo'}`);
      return true;
    } else {
      console.log(`❌ API falhou: ${resposta.status}`);
      return false;
    }
    
  } catch (erro) {
    console.log(`❌ Erro na API: ${erro.message}`);
    return false;
  }
}

module.exports = {
  buscarProdutos,
  buscarMultiplosTermos,
  testarEndpointAlternativo
};