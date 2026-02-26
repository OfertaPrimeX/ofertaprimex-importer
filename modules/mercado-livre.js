const { buscarComProxy } = require('./proxy');

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
  
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
  
  // Tenta com proxy primeiro
  console.log(`🔄 Usando proxy para "${termo}"...`);
  const dados = await buscarComProxy(url, termo);
  
  if (dados) {
    const produtos = processarResultados(dados, termo);
    console.log(`✅ ${produtos.length} produtos encontrados via proxy`);
    return produtos;
  }
  
  console.log(`❌ Nenhum produto encontrado para "${termo}"`);
  return [];
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
  console.log('\n🧪 Testando conexão com Mercado Livre via proxy...');
  
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