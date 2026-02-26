// COLE SEU ACCESS TOKEN AQUI (depois de criar a app no Mercado Livre)
const ACCESS_TOKEN = ''; // Deixe vazio por enquanto, vamos testar sem token primeiro

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

// Função para buscar produtos com token (se tiver)
async function buscarProdutosComToken(termo) {
  console.log(`\n🔍 Buscando: "${termo}" (com token)...`);
  
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    };
    
    // Só adiciona o token se ele existir
    if (ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
    }
    
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: headers
    });
    
    clearTimeout(timeout);
    
    if (resposta.ok) {
      const dados = await resposta.json();
      const produtos = processarResultados(dados, termo);
      console.log(`✅ ${produtos.length} produtos encontrados`);
      return produtos;
    } else {
      console.log(`❌ Falha: ${resposta.status} - ${resposta.statusText}`);
      return [];
    }
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
    return [];
  }
}

// Função principal de busca (usada pelo index.js)
async function buscarProdutos(termo) {
  return await buscarProdutosComToken(termo);
}

// Função para buscar múltiplos termos
async function buscarMultiplosTermos(termos) {
  const resultados = [];
  
  for (const termo of termos) {
    const produtos = await buscarProdutos(termo);
    resultados.push(...produtos);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return resultados;
}

// FUNÇÃO CORRIGIDA: testar conexão com Mercado Livre
async function testarEndpointAlternativo() {
  console.log('\n🧪 Testando conexão com Mercado Livre...');
  
  try {
    const url = 'https://api.mercadolibre.com/sites/MLB/categories';
    
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`✅ API funcionou! ${dados.length} categorias encontradas`);
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

// EXPORTANDO TUDO CORRETAMENTE
module.exports = {
  buscarProdutos,
  buscarMultiplosTermos,
  testarEndpointAlternativo  // AGORA ESTÁ EXPORTADA!
};