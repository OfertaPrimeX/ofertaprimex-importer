const { chromium } = require('playwright');

async function buscarMercadoLivre(termo) {
  console.log(`\n🔍 Buscando "${termo}" no Mercado Livre...`);
  console.log('='.repeat(50));
  
  let browser = null;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar timeout maior
    page.setDefaultTimeout(30000);
    
    // Headers de navegador real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    console.log('🔄 Acessando página de busca...');
    
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Aguarda carregar
    await page.waitForTimeout(3000);
    
    console.log('✅ Página carregada!');
    
    // Tenta encontrar os produtos
    const produtos = await page.$$eval('.ui-search-layout__item', items => {
      return items.slice(0, 5).map(item => {
        const titulo = item.querySelector('.ui-search-item__title')?.innerText;
        const preco = item.querySelector('.andes-money-amount__fraction')?.innerText;
        const link = item.querySelector('a.ui-search-link')?.href;
        const avaliacao = item.querySelector('.ui-search-reviews__rating-number')?.innerText;
        
        return {
          titulo: titulo || 'N/A',
          preco: preco || 'N/A',
          link: link || 'N/A',
          avaliacao: avaliacao || 'Sem avaliação'
        };
      });
    });
    
    console.log(`\n📊 Total de produtos encontrados: ${produtos.length}`);
    
    if (produtos.length > 0) {
      console.log('\n📌 TOP 5 PRODUTOS:');
      produtos.forEach((p, i) => {
        console.log(`\n${i+1}. ${p.titulo}`);
        console.log(`   💰 Preço: R$ ${p.preco}`);
        console.log(`   ⭐ Avaliação: ${p.avaliacao}`);
        console.log(`   🔗 Link: ${p.link.substring(0, 60)}...`);
      });
    } else {
      console.log('⚠️ Nenhum produto encontrado. Verificando bloqueio...');
      
      const html = await page.content();
      if (html.includes('acesse sua conta')) {
        console.log('🔒 Mercado Livre está pedindo login!');
      } else if (html.includes('Mantén presionado')) {
        console.log('🛡️ Desafio de segurança detectado!');
      }
    }
    
    await browser.close();
    console.log('\n✅ Busca finalizada!');
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
    if (browser) await browser.close();
  }
}

// Executar a busca
buscarMercadoLivre('ps5');