// COLE SEU ACCESS TOKEN AQUI (depois de criar a app)
const ACCESS_TOKEN = '7737778191417887'; // Preencha com seu token

async function buscarProdutosComToken(termo) {
  console.log(`\n🔍 Buscando: "${termo}" com token...`);
  
  if (!ACCESS_TOKEN) {
    console.log('❌ Access token não configurado!');
    return [];
  }
  
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`, // Token aqui!
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeout);
    
    if (resposta.ok) {
      const dados = await resposta.json();
      console.log(`✅ Sucesso! ${dados.results?.length || 0} produtos encontrados`);
      return processarResultados(dados, termo);
    } else {
      const erro = await resposta.text();
      console.log(`❌ Falha: ${resposta.status} - ${erro.substring(0, 100)}`);
      return [];
    }
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
    return [];
  }
}

// Substitua a função buscarProdutos para usar o token
async function buscarProdutos(termo) {
  return await buscarProdutosComToken(termo);
}

// Resto do código igual (processarResultados, buscarMultiplosTermos, etc)