const { chromium } = require('playwright');
const fs = require('fs');

async function diagnosticarMercadoLivre(termo) {
  console.log(`\n🔍 Diagnosticando "${termo}"...`);
  
  let browser = null;
  const resultado = {
    termo: termo,
    timestamp: new Date().toISOString(),
    produtosEncontrados: 0,
    bloqueio: null,
    screenshot: 'screenshot.png',
    html: 'pagina.html',
    detalhes: {}
  };
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitorar requisições
    page.on('request', request => {
      if (request.url().includes('blocked') || request.url().includes('captcha')) {
        resultado.detalhes.requisicaoBloqueio = request.url();
      }
    });
    
    // Monitorar respostas
    page.on('response', response => {
      if (response.status() === 403 || response.status() === 429) {
        resultado.detalhes.statusBloqueio = response.status();
      }
    });
    
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    console.log(`🔄 Acessando: ${url}`);
    
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 1. SALVAR PRINT
    console.log('📸 Salvando screenshot...');
    await page.screenshot({ 
      path: resultado.screenshot, 
      fullPage: true,
      quality: 80 
    });
    
    // 2. SALVAR HTML
    console.log('📄 Salvando HTML...');
    const html = await page.content();
    fs.writeFileSync(resultado.html, html);
    
    // 3. ANALISAR CONTEÚDO
    const titulo = await page.title();
    resultado.tituloPagina = titulo;
    
    // Verificar bloqueios
    if (html.includes('acesse sua conta') || html.includes('faça login')) {
      resultado.bloqueio = 'login_required';
      resultado.mensagem = 'Página pedindo login';
    } else if (html.includes('Mantén presionado') || html.includes('Segure pressionado')) {
      resultado.bloqueio = 'challenge';
      resultado.mensagem = 'Desafio de segurança';
    } else if (response.status() === 403) {
      resultado.bloqueio = 'forbidden';
      resultado.mensagem = 'Acesso proibido (403)';
    }
    
    // Tentar contar produtos
    const produtos = await page.$$eval('.ui-search-layout__item', items => items.length);
    resultado.produtosEncontrados = produtos;
    
    // 4. CAPTURAR MENSAGENS DO CONSOLE
    const mensagensConsole = [];
    page.on('console', msg => mensagensConsole.push(`${msg.type()}: ${msg.text()}`));
    resultado.detalhes.console = mensagensConsole;
    
    await browser.close();
    
    // 5. GERAR RELATÓRIO HTML
    const relatorioHtml = gerarRelatorioHTML(resultado);
    fs.writeFileSync('diagnostico.html', relatorioHtml);
    console.log('✅ Relatório salvo: diagnostico.html');
    
    // Mostrar resumo
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log(`📌 Título: ${resultado.tituloPagina}`);
    console.log(`📦 Produtos: ${resultado.produtosEncontrados}`);
    console.log(`🚫 Bloqueio: ${resultado.bloqueio || 'Nenhum'}`);
    console.log(`💬 Mensagem: ${resultado.mensagem || 'OK'}`);
    console.log(`\n📁 Arquivos gerados:`);
    console.log(`   - Screenshot: ${resultado.screenshot}`);
    console.log(`   - HTML: ${resultado.html}`);
    console.log(`   - Relatório: diagnostico.html`);
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
    resultado.erro = erro.message;
  } finally {
    if (browser) await browser.close();
  }
}

function gerarRelatorioHTML(dados) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Diagnóstico Mercado Livre</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .bloqueio { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
    .sucesso { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; }
    img { max-width: 100%; border: 1px solid #ddd; margin: 20px 0; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Diagnóstico Mercado Livre</h1>
    <p>Termo: <strong>${dados.termo}</strong></p>
    <p>Data: ${new Date(dados.timestamp).toLocaleString()}</p>
    
    <div class="${dados.bloqueio ? 'bloqueio' : 'sucesso'}">
      <h3>Status: ${dados.bloqueio || 'OK'}</h3>
      <p>${dados.mensagem || 'Acesso normal'}</p>
      <p>Produtos encontrados: ${dados.produtosEncontrados}</p>
    </div>
    
    <h3>📸 Screenshot:</h3>
    <img src="${dados.screenshot}" alt="Screenshot">
    
    <h3>📄 Detalhes Técnicos:</h3>
    <pre>${JSON.stringify(dados.detalhes, null, 2)}</pre>
    
    <h3>📋 Ações Recomendadas:</h3>
    <ul>
      ${dados.bloqueio === 'login_required' ? 
        '<li>O Mercado Livre está pedindo login. Precisamos de uma conta real.</li>' : ''}
      ${dados.bloqueio === 'challenge' ? 
        '<li>Desafio de segurança detectado. Precisamos simular comportamento humano.</li>' : ''}
      ${dados.bloqueio === 'forbidden' ? 
        '<li>Acesso proibido. IP pode estar bloqueado.</li>' : ''}
      ${!dados.bloqueio && dados.produtosEncontrados === 0 ?
        '<li>Página carregou mas sem produtos. Verificar seletor CSS.</li>' : ''}
    </ul>
  </div>
</body>
</html>
  `;
}

// Executar
diagnosticarMercadoLivre('ps5');