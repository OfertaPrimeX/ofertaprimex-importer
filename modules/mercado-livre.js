// CONFIGURAÇÕES DA API
const CLIENT_ID = '7737778191417887';
const CLIENT_SECRET = 'ILIE3mywj9F1uT4hwb4As1pbczMtCbID';

// Cache do token (para não gerar toda hora)
let accessToken = null;
let tokenExpiraEm = null;

// Função para gerar token automaticamente
async function gerarAccessToken() {
  // Se já tem token válido, usa ele
  if (accessToken && tokenExpiraEm && Date.now() < tokenExpiraEm) {
    console.log('🔄 Usando token em cache');
    return accessToken;
  }
  
  console.log('🔄 Gerando novo access token...');
  
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
      return accessToken;
    } else {
      console.error('❌ Erro ao gerar token:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição do token:', error);
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
  
  try {
    // 1. Gera/obtém o token
    const token = await gerarAccessToken();
    
    if (!token) {
      console.log('❌ Não foi possível obter token');
      return [];
    }
    
    // 2. Faz a busca com o token
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
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
      const erro = await resposta.text();
      console.log(`❌ Falha: ${resposta.status} - ${resposta.statusText}`);
      
      // Se o token expirou (401), limpa o cache e tenta de novo
      if (resposta.status === 401) {
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
  
  try {
    const token = await gerarAccessToken();
    
    if (!token) {
      console.log('❌ Não foi possível obter token para teste');
      return false;
    }
    
    const url = 'https://api.mercadolibre.com/users/me';
    const resposta = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`✅ Conectado como: ${dados.nickname || dados.id}`);
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