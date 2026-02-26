// ============================================
// TESTE SIMPLES COM PLAYWRIGHT - MERCADO LIVRE
// ============================================

const { chromium } = require('playwright');

// Lista de proxies GRÁTIS (atualizada para 2026)
// Fonte: https://free-proxy-list.net/
const PROXY_LIST = [
  'http://189.90.60.214:8080',
  'http://177.124.160.122:8080', 
  'http://191.252.198.113:8080',
  'http://177.93.58.74:8080',
  'http://189.84.165.166:8080',
  'http://45.225.203.202:3128',
  'http://170.84.189.94:8080',
  'http://138.204.92.50:80',
  'http://187.86.124.50:3128',
  'http://143.255.140.186:8080'
];

// Função para pegar um proxy aleatório
function getRandomProxy() {
  const index = Math.floor(Math.random() * PROXY_LIST.length);
  return PROXY_LIST[index];
}

// Função principal de teste
async function testarBuscaML(termo) {
  console.log(`\n🔍 Buscando: "${termo}" no Mercado Livre...`);
  
  let browser = null;
  
  try {
    // Pega um proxy aleatório
    const proxyServer = getRandomProxy();
    console.log(`🔄 Usando proxy: ${proxyServer}`);
    
    // Extrai host e porta do proxy
    const proxyUrl = new URL(proxyServer);
    
    // Lança o navegador com o proxy
    browser = await chromium.launch({
      headless: true, // true = não mostra a janela (mais rápido)
      proxy: {
        server: `${proxyUrl.protocol}//${proxyUrl.hostname}:${proxyUrl.port}`
      }
    });
    
    // Cria uma nova página
    const page = await browser.newPage();
    
    // Configura um timeout maior
    page.setDefaultTimeout(30000);
    
    // Adiciona headers de navegador real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    console.log('⏳ Aguardando carregamento da página...');
    
    // Navega para a página de busca
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Aguarda um pouco para simular humano
    await page.waitForTimeout(Math.random() * 3000 + 2000);
    
    // Tenta encontrar os produtos
    const produtos = await page.$$eval('.ui-search-layout__item', elements => {
      return elements.map(el => {
        // Título
        const tituloEl = el.querySelector('.ui-search-item__title');
        // Preço
        const precoEl = el.querySelector('.andes-money-amount__fraction');
        // Link
        const linkEl = el.querySelector('a.ui-search-link');
        
        return {
          titulo: tituloEl ? tituloEl.innerText : 'N/A',
          preco: precoEl ? precoEl.innerText : 'N/A',
          link: linkEl ? linkEl.href : 'N/A'
        };
      });
    });
    
    console.log(`📊 Produtos encontrados: ${produtos.length}`);
    
    // Mostra os primeiros 3 produtos
    if (produtos.length > 0) {
      console.log('\n📌 Primeiros produtos:');
      produtos.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i+1}. ${p.titulo}`);
        console.log(`   💰 R$ ${p.preco}`);
        console.log(`   🔗 ${p.link.substring(0, 60)}...`);
      });
    }
    
    // Verifica se apareceu bloqueio
    const html = await page.content();
    if (html.includes('Mantén presionado') || html.includes('Segure pressionado')) {
      console.log('⚠️ Bloqueio detectado! Tentando próximo proxy...');
    }
    
  } catch (erro) {
    console.log(`❌ Erro: ${erro.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Função para testar vários proxies
async function testarComVariosProxies(termo) {
  console.log('🚀 INICIANDO TESTE COM VÁRIOS PROXIES');
  console.log('='.repeat(50));
  
  let tentativas = 0;
  let sucesso = false;
  
  // Tenta até 5 proxies diferentes
  while (tentativas < 5 && !sucesso) {
    console.log(`\n📡 Tentativa ${tentativas + 1} de 5`);
    await testarBuscaML(termo);
    tentativas++;
    
    // Aguarda entre tentativas
    if (tentativas < 5) {
      console.log('⏳ Aguardando 5 segundos antes da próxima tentativa...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ TESTE FINALIZADO');
}

// EXECUTAR O TESTE
testarComVariosProxies('ps5');