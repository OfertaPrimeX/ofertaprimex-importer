const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// CONFIGURAÇÕES
const FRONTEND_PATHS = [
  '/app/public',              // Se for Node/React
  '/usr/share/nginx/html',    // Se for Nginx
  '/var/www/html'             // Se for Apache
];

async function diagnosticarMercadoLivre(termo) {
  console.log(`\n🔍 Diagnosticando "${termo}"...`);
  
  let browser = null;
  const timestamp = Date.now();
  const nomePasta = `diagnostico-${termo}-${timestamp}`;
  
  // Descobrir qual pasta do frontend existe
  let pastaFrontend = null;
  for (const pasta of FRONTEND_PATHS) {
    if (fs.existsSync(pasta)) {
      pastaFrontend = path.join(pasta, nomePasta);
      console.log(`✅ Pasta frontend encontrada: ${pasta}`);
      break;
    }
  }
  
  if (!pastaFrontend) {
    console.log('❌ Pasta do frontend não encontrada!');
    return;
  }
  
  try {
    // Criar pasta no frontend
    fs.mkdirSync(pastaFrontend, { recursive: true });
    console.log(`📁 Pasta criada no frontend: ${nomePasta}`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Monitorar requisições
    const requisicoes = [];
    page.on('request', request => {
      requisicoes.push({
        url: request.url(),
        metodo: request.method(),
        tipo: request.resourceType()
      });
    });
    
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(termo)}`;
    console.log(`🔄 Acessando: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 1. SALVAR PRINT
    console.log('📸 Salvando screenshot...');
    const screenshotPath = path.join(pastaFrontend, 'screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✅ Screenshot salvo`);
    
    // 2. SALVAR HTML
    console.log('📄 Salvando HTML...');
    const htmlPath = path.join(pastaFrontend, 'pagina.html');
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML salvo`);
    
    // 3. CAPTURAR INFORMAÇÕES
    const titulo = await page.title();
    const urlAtual = page.url();
    
    // Verificar bloqueios
    let bloqueio = null;
    let mensagem = null;
    
    if (html.includes('acesse sua conta') || html.includes('faça login')) {
      bloqueio = 'login_required';
      mensagem = 'Página pedindo login';
    } else if (html.includes('Mantén presionado') || html.includes('Segure pressionado')) {
      bloqueio = 'challenge';
      mensagem = 'Desafio de segurança';
    } else if (html.includes('403') || html.includes('Forbidden')) {
      bloqueio = 'forbidden';
      mensagem = 'Acesso proibido';
    }
    
    // Contar produtos
    const seletores = [
      '.ui-search-layout__item',
      '.ui-search-result',
      '.andes-card',
      '.shops__items-group'
    ];
    
    let produtosEncontrados = 0;
    let seletorFuncional = null;
    
    for (const seletor of seletores) {
      const count = await page.$$eval(seletor, items => items.length);
      if (count > 0) {
        produtosEncontrados = count;
        seletorFuncional = seletor;
        break;
      }
    }
    
    // 4. GERAR VISUALIZAÇÃO HTML PRINCIPAL
    const visualizacaoPath = path.join(pastaFrontend, 'index.html');
    const visualizacaoHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Diagnóstico Mercado Livre - ${termo}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      font-size: 1.3em; 
      padding: 20px; 
      border-radius: 10px; 
      margin-bottom: 20px;
      text-align: center;
    }
    .status.sucesso { background: #d4edda; color: #155724; border-left: 5px solid #28a745; }
    .status.erro { background: #f8d7da; color: #721c24; border-left: 5px solid #dc3545; }
    .status.atencao { background: #fff3cd; color: #856404; border-left: 5px solid #ffc107; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin: 25px 0;
    }
    .preview-card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .preview-card:hover { transform: translateY(-5px); }
    .preview-card img { width: 100%; height: 200px; object-fit: cover; }
    .preview-card .info { padding: 15px; }
    .preview-card h3 { margin-bottom: 10px; color: #333; }
    .preview-card a { 
      display: inline-block; 
      padding: 8px 15px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 10px;
    }
    .detalhes {
      background: #2d2d2d;
      color: #fff;
      padding: 20px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      overflow-x: auto;
    }
    .acoes {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin: 25px 0;
    }
    .btn {
      padding: 15px 30px;
      border: none;
      border-radius: 10px;
      font-size: 1.1em;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: transform 0.3s;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn:hover { transform: scale(1.05); }
    .btn.secondary { background: #6c757d; }
    .timestamp { color: #666; margin: 20px 0; text-align: right; }
    .url { word-break: break-all; background: #eee; padding: 10px; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ Diagnóstico Mercado Livre</h1>
      <p>Busca: "${termo}"</p>
    </div>
    
    <div class="content">
      <div class="card">
        <div class="status ${bloqueio ? 'erro' : produtosEncontrados > 0 ? 'sucesso' : 'atencao'}">
          <strong>Status:</strong> ${bloqueio ? mensagem : (produtosEncontrados > 0 ? '✅ SUCESSO' : '⚠️ Sem produtos')}
        </div>
        
        <p><strong>Título da página:</strong> ${titulo}</p>
        <p><strong>URL final:</strong></p>
        <div class="url">${urlAtual}</div>
        <p><strong>Produtos encontrados:</strong> ${produtosEncontrados}</p>
        ${seletorFuncional ? `<p><strong>Seletor que funcionou:</strong> ${seletorFuncional}</p>` : ''}
        <p class="timestamp">Diagnóstico gerado em: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="acoes">
        <a href="screenshot.png" target="_blank" class="btn">📸 Ver Screenshot</a>
        <a href="pagina.html" target="_blank" class="btn">📄 Ver HTML</a>
        <a href="#" onclick="window.location.reload()" class="btn secondary">🔄 Atualizar</a>
      </div>
      
      <h2>📸 Preview do Screenshot</h2>
      <div class="preview-card">
        <img src="screenshot.png" alt="Screenshot">
        <div class="info">
          <h3>Screenshot da página</h3>
          <a href="screenshot.png" target="_blank">Ver em tela cheia</a>
        </div>
      </div>
      
      <h2>📋 Diagnóstico Detalhado</h2>
      <div class="grid">
        <div class="preview-card">
          <div class="info">
            <h3>${html.length} caracteres</h3>
            <p>HTML completo da página</p>
            <a href="pagina.html" target="_blank">Abrir HTML</a>
          </div>
        </div>
        
        <div class="preview-card">
          <div class="info">
            <h3>${requisicoes.length} requisições</h3>
            <p>Monitoradas durante o carregamento</p>
            <a href="#" onclick="alert(JSON.stringify(${JSON.stringify(requisicoes.slice(0, 10))}, null, 2))">Ver primeiras 10</a>
          </div>
        </div>
      </div>
      
      <h2>📌 Como acessar estes arquivos</h2>
      <div class="detalhes">
        <p>URLs diretas:</p>
        <ul style="margin-top: 10px; list-style: none;">
          <li>• <strong>Screenshot:</strong> <a href="screenshot.png" target="_blank" style="color: #ffd700;">/diagnostico/screenshot.png</a></li>
          <li>• <strong>HTML:</strong> <a href="pagina.html" target="_blank" style="color: #ffd700;">/diagnostico/pagina.html</a></li>
          <li>• <strong>Esta página:</strong> /diagnostico/</li>
        </ul>
        <p style="margin-top: 15px;">📎 Caminho completo: https://ofertaprimex.com.br/diagnostico/</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(visualizacaoPath, visualizacaoHtml);
    
    // 5. CRIAR ARQUIVO .htaccess OU Nginx config (opcional)
    const htaccessPath = path.join(pastaFrontend, '.htaccess');
    const htaccessContent = `
Options +Indexes
DirectoryIndex index.html
    `;
    fs.writeFileSync(htaccessPath, htaccessContent);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ DIAGNÓSTICO CONCLUÍDO!');
    console.log('='.repeat(50));
    console.log(`📁 Pasta no frontend: /${nomePasta}`);
    console.log(`🌐 Acesse: https://ofertaprimex.com.br/${nomePasta}/`);
    console.log(`📸 Screenshot: https://ofertaprimex.com.br/${nomePasta}/screenshot.png`);
    console.log(`📄 HTML: https://ofertaprimex.com.br/${nomePasta}/pagina.html`);
    console.log('='.repeat(50));
    
    await browser.close();
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  } finally {
    if (browser) await browser.close();
  }
}

// Executar
diagnosticarMercadoLivre('ps5');