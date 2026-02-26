const { buscarComProxy } = require('./proxy');

// Função para processar resultados (igual antes)
function processarResultados(dados, termo) {
  if (!dados || !dados.results) return [];
  
  return dados.results.map(produto => {
    // Calcular pontuação do vendedor
    let pontuacao = 4.0; // padrão
    
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

// Função para buscar no Mercado Livre (com fallback para proxy)
async function buscarProdutos(termo) {
  console.log(`\n🔍 Buscando: "${termo}"...`);
  
  // Primeiro tenta sem proxy (mais rápido)
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    
    clearTimeout(timeout);
    
    if (resposta.ok) {
      const dados = await resposta.json();
      const produtos = processarResultados(dados, termo);
      console.log(`✅ ${produtos.length} produtos encontrados (direto)`);
      return produtos;
    } else {
      console.log(`⚠️ Falha direta (${resposta.status}), tentando proxy...`);
    }
  } catch (erro) {
    console.log(`⚠️ Erro direto: ${erro.message}, tentando proxy...`);
  }
  
  // Se falhou, tenta com proxy
  console.log(`🔄 Tentando com proxy para "${termo}"...`);
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
  const dadosProxy = await buscarComProxy(url, termo);
  
  if (dadosProxy) {
    const produtos = processarResultados(dadosProxy, termo);
    console.log(`✅ ${produtos.length} produtos encontrados (via proxy)`);
    return produtos;
  }
  
  console.log(`❌ Nenhum produto encontrado para "${termo}"`);
  return [];
}

// Função para buscar múltiplos termos
async function buscarMultiplosTermos(termos) {
  const resultados = [];
  
  for (const termo of termos) {
    const produtos = await buscarProdutos(termo);
    resultados.push(...produtos);
    // Pausa entre termos para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return resultados;
}

// Função para testar endpoint alternativo
async function testarEndpointAlternativo() {
  console.log('\n🧪 Testando conexão com Mercado Livre...');
  
  // Tenta direto primeiro
  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/categories';
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (resposta.ok) {
      console.log('✅ API do Mercado Livre está acessível (direto)');
      return true;
    }
  } catch (erro) {
    console.log('⚠️ API direta indisponível');
  }
  
  // Tenta com proxy
  console.log('🔄 Tentando API via proxy...');
  const url = 'https://api.mercadolibre.com/sites/MLB/categories';
  const dados = await buscarComProxy(url, 'categorias');
  
  if (dados) {
    console.log(`✅ API funcionou via proxy! (${dados.length} categorias)`);
    return true;
  }
  
  console.log('❌ API completamente indisponível');
  return false;
}

module.exports = {
  buscarProdutos,
  buscarMultiplosTermos,
  testarEndpointAlternativo
};