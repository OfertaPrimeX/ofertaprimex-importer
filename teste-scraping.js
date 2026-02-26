// teste-scraping.js - Teste simples de scraping do Mercado Livre

async function testarBusca(termo) {
  console.log(`\n🔍 Testando busca para: "${termo}"`);
  
  try {
    // Monta a URL igual à do site
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    console.log(`📌 URL: ${url}`);
    
    // Faz a requisição simulando um navegador
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://www.mercadolivre.com.br/'
      }
    });
    
    if (!resposta.ok) {
      console.log(`❌ Erro HTTP: ${resposta.status}`);
      return;
    }
    
    const html = await resposta.text();
    console.log(`✅ Página carregada! Tamanho: ${html.length} caracteres`);
    
    // Método simples para contar produtos (procurando pelo padrão das olx)
    // Cada produto tem uma estrutura com "ui-search-layout__item"
    const regexProduto = /ui-search-layout__item/g;
    const matches = html.match(regexProduto);
    const quantidade = matches ? matches.length : 0;
    
    console.log(`📊 Quantidade de produtos encontrados: ${quantidade}`);
    
    // Mostra um pequeno trecho do HTML para debug
    console.log('\n📝 Primeiros 500 caracteres do HTML:');
    console.log(html.substring(0, 500));
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
  }
}

// Testar com o termo "ps5"
testarBusca('ps5');