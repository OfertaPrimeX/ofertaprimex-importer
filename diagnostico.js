const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// CONFIGURAÇÃO FIXA - você já criou a pasta
const PASTA_DIAGNOSTICO = '/app/public/diagnostico'; // Ajuste se o caminho for diferente

async function diagnosticarMercadoLivre(termo) {
  console.log(`\n🔍 Diagnosticando "${termo}"...`);
  console.log('='.repeat(50));
  
  let browser = null;
  const timestamp = Date.now();
  const nomeArquivo = `diagnostico-${termo}-${timestamp}`;
  
  try {
    // Verificar se a pasta existe
    if (!fs.existsSync(PASTA_DIAGNOSTICO)) {
      console.log(`❌ Pasta ${PASTA_DIAGNOSTICO} não encontrada!`);
      console.log('📌 Verifique se o caminho está correto:');
      console.log('   - /app/public/diagnostico');
      console.log('   - /usr/share/nginx/html/diagnostico');
      console.log('   - /var/www/html/diagnostico');
      return;
    }
    
    console.log(`✅ Pasta encontrada: ${PASTA_DIAGNOSTICO}`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Headers de navegador real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    console.log(`🔄 Acessando: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 1. SALVAR SCREENSHOT (sobrescreve o último)
    console.log('📸 Salvando screenshot...');
    const screenshotPath = path.join(PASTA_DIAGNOSTICO, 'screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✅ Screenshot atualizado`);
    
    // 2. SALVAR HTML (sobrescreve o último)
    console.log('📄 Salvando HTML...');
    const htmlPath = path.join(PASTA_DIAGNOSTICO, 'pagina.html');
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML atualizado`);
    
    // 3. CAPTURAR INFORMAÇÕES
    const titulo = await page.title();
    const urlAtual = page.url();
    
    // Verificar bloqueios
    let bloqueio = null;
    let mensagem = null;
    
    if (html.includes('acesse sua conta') || html.includes('faça login')) {
      bloqueio = 'login_required';
      mensagem = '🔒 Página pedindo login';
    } else if (html.includes('Mantén presionado') || html.includes('Segure pressionado')) {
      bloqueio = 'challenge';
      mensagem = '🛡️ Desafio de segurança';
    } else if (html.includes('403') || html.includes('Forbidden')) {
      bloqueio = 'forbidden';
      mensagem = '🚫 Acesso proibido (403)';
    }
    
    // Contar produtos
    let produtosEncontrados = 0;
    try {
      produtosEncontrados = await page.$$eval('.ui-search-layout__item', items => items.length);
    } catch (e) {
      console.log('⚠️ Erro ao contar produtos:', e.message);
    }
    
    // 4. GERAR INDEX.HTML (sobrescreve o último)
    console.log('📝 Gerando página de visualização...');
    const indexPath = path.join(PASTA_DIAGNOSTICO, 'index.html');
    
    const dataAtual = new Date().toLocaleString('pt-BR');
    const statusClass = bloqueio ? 'erro' : (produtosEncontrados > 0 ? 'sucesso' : 'atencao');
    const statusTexto = bloqueio ? mensagem : (produtosEncontrados > 0 ? '✅ FUNCIONANDO' : '⚠️ SEM PRODUTOS');
    
    const indexHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <title>Diagnóstico Mercado Livre</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.2em; }
    .content { padding: 30px; }
    .card { 
      background: #f8f9fa; 
      border-radius: 15px; 
      padding: 25px; 
      margin-bottom: 25px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .status { 
      font-size: 1.5em; 
      padding: 20px; 
      border-radius: 10px; 
      margin-bottom: 20px;
      text-align: center;
      font-weight: bold;
    }
    .status.sucesso { background: #d4edda; color: #155724; border: 2px solid #28a745; }
    .status.erro { background: #f8d7da; color: #721c24; border: 2px solid #dc3545; }
    .status.atencao { background: #fff3cd; color: #856404; border: 2px solid #ffc107; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 25px 0;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .info-box h3 { color: #667eea; margin-bottom: 15px; }
    .preview {
      margin: 25px 0;
      border: 2px solid #ddd;
      border-radius: 10px;
      overflow: hidden;
    }
    .preview img { width: 100%; height: auto; display: block; }
    .acoes {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin: 25px 0;
      justify-content: center;
    }
    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 10px;
      font-size: 1.1em;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: bold;
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    .btn:hover { 
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
    }
    .btn.secondary { 
      background: #6c757d;
      box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
    }
    .btn.secondary:hover { box-shadow: 0 8px 20px rgba(108, 117, 125, 0.6); }
    .url-box {
      background: #2d2d2d;
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      word-break: break-all;
      margin: 15px 0;
    }
    .timestamp {
      text-align: right;
      color: #666;
      margin-top: 20px;
      font-style: italic;
    }
    .detalhe {
      background: #e3f2fd;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Diagnóstico Mercado Livre</h1>
      <p>Resultado da busca por: <strong>${termo}</strong></p>
    </div>
    
    <div class="content">
      <div class="status ${statusClass}">
        ${statusTexto}
      </div>
      
      <div class="grid">
        <div class="info-box">
          <h3>📊 Informações</h3>
          <p><strong>Título da página:</strong> ${titulo}</p>
          <p><strong>Produtos encontrados:</strong> ${produtosEncontrados}</p>
          <p><strong>Data:</strong> ${dataAtual}</p>
        </div>
        
        <div class="info-box">
          <h3>🔗 URL Acessada</h3>
          <div class="url-box">${urlAtual}</div>
        </div>
      </div>
      
      ${bloqueio ? `
      <div class="detalhe">
        <strong>🚫 Bloqueio detectado:</strong> ${mensagem}
        <p style="margin-top: 10px; color: #666;">O Mercado Livre identificou acesso automatizado e está bloqueando.</p>
      </div>
      ` : ''}
      
      <div class="acoes">
        <a href="screenshot.png" target="_blank" class="btn">📸 Ver Screenshot</a>
        <a href="pagina.html" target="_blank" class="btn">📄 Ver HTML</a>
        <a href="/" class="btn secondary">🏠 Voltar ao início</a>
      </div>
      
      <h2 style="margin: 30px 0 15px;">📸 Screenshot da Página</h2>
      <div class="preview">
        <img src="screenshot.png" alt="Screenshot da busca no Mercado Livre" onclick="window.open('screenshot.png')">
      </div>
      
      <div class="timestamp">
        ⏰ Última atualização: ${dataAtual}<br>
        <small>Os arquivos screenshot.png e pagina.html são sobrescritos a cada novo diagnóstico</small>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(indexPath, indexHtml);
    
    console.log('\n' + '⭐'.repeat(40));
    console.log('✅ DIAGNÓSTICO FINALIZADO COM SUCESSO!');
    console.log('⭐'.repeat(40));
    console.log(`📁 Arquivos salvos em: ${PASTA_DIAGNOSTICO}`);
    console.log(`🌐 Acesse: https://ofertaprimex.com.br/diagnostico/`);
    console.log(`📸 Screenshot: https://ofertaprimex.com.br/diagnostico/screenshot.png`);
    console.log(`📄 HTML: https://ofertaprimex.com.br/diagnostico/pagina.html`);
    console.log('⭐'.repeat(40));
    
    await browser.close();
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  } finally {
    if (browser) await browser.close();
  }
}

// Executar a busca
diagnosticarMercadoLivre('ps5');