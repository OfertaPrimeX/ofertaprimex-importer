// Função para buscar no Mercado Livre
async function buscarProdutos(termo) {
  console.log(`🔍 Buscando: "${termo}"...`);
  
  try {
    // Timeout para não travar se API demorar
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
    // Headers de navegador real para evitar bloqueio
    const resposta = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://www.mercadolivre.com.br/'
      }
    });
    
    clearTimeout(timeout);
    
    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }
    
    const dados = await resposta.json();
    
    // Processar produtos
    const produtos = dados.results?.map(produto => {
      // Calcular pontuação do vendedor (simplificado)
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
    }) || [];
    
    console.log(`📊 Encontrados ${produtos.length} produtos para "${termo}"`);
    return produtos;
    
  } catch (erro) {
    if (erro.name === 'AbortError') {
      console.error(`⏰ Timeout ao buscar "${termo}"`);
    } else {
      console.error(`❌ Erro ao buscar "${termo}":`, erro.message);
    }
    return []; // Retorna vazio em vez de quebrar
  }
}

// Função para buscar múltiplos termos
async function buscarMultiplosTermos(termos) {
  const resultados = [];
  
  for (const termo of termos) {
    const produtos = await buscarProdutos(termo);
    resultados.push(...produtos);
    
    // Pausa entre requisições (evita bloqueio)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return resultados;
}

// Função para testar endpoint alternativo
async function testarEndpointAlternativo() {
  console.log('🧪 Testando endpoint alternativo...');
  
  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/categories';
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`✅ Endpoint de categorias funcionou! ${dados.length} categorias encontradas`);
      return true;
    } else {
      console.log(`❌ Endpoint de categorias falhou: ${resposta.status}`);
      return false;
    }
  } catch (erro) {
    console.log('❌ Erro no endpoint alternativo:', erro.message);
    return false;
  }
}

module.exports = {
  buscarProdutos,
  buscarMultiplosTermos,
  testarEndpointAlternativo
};