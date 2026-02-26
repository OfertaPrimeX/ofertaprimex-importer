const { chromium } = require('playwright');

async function testar() {
  console.log('🚀 INICIANDO TESTE FINAL');
  console.log('='.repeat(40));
  
  try {
    console.log('🔄 Lançando Chromium...');
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    console.log('✅ Chromium iniciado com sucesso!');
    
    const page = await browser.newPage();
    console.log('✅ Página criada');
    
    console.log('🔄 Acessando site de teste...');
    await page.goto('https://example.com', { 
      timeout: 15000,
      waitUntil: 'domcontentloaded'
    });
    console.log('✅ Site acessado!');
    
    const titulo = await page.title();
    console.log(`📌 Título da página: ${titulo}`);
    
    const url = page.url();
    console.log(`📌 URL atual: ${url}`);
    
    console.log('🔄 Fechando navegador...');
    await browser.close();
    console.log('✅ Navegador fechado');
    
    console.log('='.repeat(40));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (erro) {
    console.log('❌ ERRO:', erro.message);
    console.log('📋 Detalhes:', erro);
  }
}
testar();