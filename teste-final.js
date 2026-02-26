const { chromium } = require('playwright');

async function testar() {
  console.log('🚀 Testando...');
  
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('✅ Navegador iniciado');
    
    await page.goto('https://lista.mercadolivre.com.br/ps5', {
      timeout: 30000
    });
    console.log('✅ Página carregada');
    
    const titulo = await page.title();
    console.log(`📌 Título: ${titulo}`);
    
    // Tenta encontrar produtos
    const produtos = await page.$$eval('.ui-search-layout__item', items => items.length);
    console.log(`📊 Produtos encontrados: ${produtos}`);
    
    await browser.close();
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  }
}
testar();