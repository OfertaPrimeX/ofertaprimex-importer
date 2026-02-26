// Função para buscar no Mercado Livre
async function buscarProdutos(termo) {
  console.log(`🔍 Buscando: "${termo}"...`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=5`;
    
    // ADICIONAR HEADERS DE NAVEGADOR REAL
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
      // TENTAR CAPTURAR MAIS DETALHES DO ERRO
      const erroTexto = await resposta.text();
      console.error(`❌ HTTP ${resposta.status} - Detalhes:`, erroTexto.substring(0, 200));
      throw new Error(`HTTP ${resposta.status}`);
    }
    
    const dados = await resposta.json();
    
    // ... resto do código igual ...

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

module.exports = {
  buscarProdutos,
  buscarMultiplosTermos
};