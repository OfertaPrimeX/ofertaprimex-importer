const { chromium } = require('playwright');

async function testar() {
  console.log('🚀 Iniciando teste...');
  console.log('📅 Data:', new Date().toLocaleString());
  
  let browser = null;
  
  try {
    console.log('🔄 Lançando navegador...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    console.log('✅ Navegador iniciado');
    
    const page = await browser.newPage();
    console.log('✅ Página criada');
    
    console.log('🔄 Acessando Mercado Livre...');
    await page.goto('https://lista.mercadolivre.com.br/ps5', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✅ Página carregada');
    
    const titulo = await page.title();
    console.log(`📌 Título da página: ${titulo}`);
    
    // Aguarda um pouco para carregar os produtos
    await page.waitForTimeout(2000);
    
    // Tenta encontrar produtos
    const produtos = await page.$$eval('.ui-search-layout__item', items => {
      return items.map(item => {
        const titulo = item.querySelector('.ui-search-item__title')?.innerText;
        const preco = item.querySelector('.andes-money-amount__fraction')?.innerText;
        return { titulo, preco };
      });
    });
    
    console.log(`📊 Produtos encontrados: ${produtos.length}`);
    
    if (produtos.length > 0) {
      console.log('\n📌 Primeiros 3 produtos:');
      produtos.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i+1}. ${p.titulo || 'N/A'}`);
        console.log(`   💰 R$ ${p.preco || 'N/A'}`);
      });
    } else {
      // Verifica se está bloqueado
      const html = await page.content();
      if (html.includes('acesse sua conta') || html.includes('Mantén presionado')) {
        console.log('⚠️ Bloqueio detectado! Mercado Livre pedindo login/desafio');
      }
    }
    
    await browser.close();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
    if (browser) await browser.close();
  }
}

testar();