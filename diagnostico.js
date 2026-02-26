const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnosticarMercadoLivre(termo) {
  console.log(`\n🔍 Diagnosticando "${termo}"...`);
  
  let browser = null;
  const pastaResultados = `diagnostico-${termo}-${Date.now()}`;
  
  try {
    // Criar pasta para os resultados
    fs.mkdirSync(pastaResultados, { recursive: true });
    console.log(`📁 Pasta criada: ${pastaResultados}`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
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
    
    // 1. SALVAR PRINT (CORRIGIDO - sem quality)
    console.log('📸 Salvando screenshot...');
    const screenshotPath = path.join(pastaResultados, 'screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✅ Screenshot salvo: ${screenshotPath}`);
    
    // 2. SALVAR HTML
    console.log('📄 Salvando HTML...');
    const htmlPath = path.join(pastaResultados, 'pagina.html');
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML salvo: ${htmlPath}`);
    
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
    
    // Tentar contar produtos (vários seletores possíveis)
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
    
    // 4. GERAR RELATÓRIO HTML
    const relatorioPath = path.join(pastaResultados, 'relatorio.html');
    const relatorioHtml = gerarRelatorioHTML({
      termo,
      titulo,
      url: urlAtual,
      bloqueio,
      mensagem,
      produtosEncontrados,
      seletorFuncional,
      requisicoes: requisicoes.slice(0, 20), // Primeiras 20 requisições
      pasta: pastaResultados
    });
    
    fs.writeFileSync(relatorioPath, relatorioHtml);
    console.log(`✅ Relatório salvo: ${relatorioPath}`);
    
    // 5. CRIAR ARQUIVO DE VISUALIZAÇÃO RÁPIDA
    const visualizacaoPath = path.join(pastaResultados, 'VER_RESULTADO.html');
    const visualizacaoHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Resultado da Busca - ${termo}</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #1e1e1e; color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: #2d2d2d; border-radius: 10px; padding: 20px; margin: 20px 0; }
    h1 { color: #ffd700; }
    .status { font-size: 1.2em; padding: 10px; border-radius: 5px; }
    .erro { background: #662222; }
    .sucesso { background: #226622; }
    .atencao { background: #666622; }
    .arquivos { list-style: none; padding: 0; }
    .arquivos li { margin: 10px 0; }
    .arquivos a { 
      color: #ffd700; 
      text-decoration: none;
      display: block;
      padding: 15px;
      background: #3d3d3d;
      border-radius: 5px;
    }
    .arquivos a:hover { background: #4d4d4d; }
    .screenshot-preview { 
      max-width: 100%; 
      border: 3px solid #ffd700;
      border-radius: 10px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Resultado da Busca: ${termo}</h1>
    
    <div class="card">
      <div class="status ${bloqueio ? 'erro' : produtosEncontrados > 0 ? 'sucesso' : 'atencao'}">
        <strong>Status:</strong> ${bloqueio || (produtosEncontrados > 0 ? 'SUCESSO' : 'Sem produtos')}
      </div>
      <p><strong>Título da página:</strong> ${titulo}</p>
      <p><strong>URL final:</strong> ${urlAtual}</p>
      <p><strong>Produtos encontrados:</strong> ${produtosEncontrados}</p>
      ${bloqueio ? `<p><strong>Motivo:</strong> ${mensagem}</p>` : ''}
    </div>
    
    <div class="card">
      <h2>📸 Preview do Screenshot</h2>
      <img src="screenshot.png" class="screenshot-preview" alt="Screenshot">
    </div>
    
    <div class="card">
      <h2>📁 Arquivos Gerados</h2>
      <ul class="arquivos">
        <li><a href="screenshot.png" target="_blank">📸 Ver screenshot completo</a></li>
        <li><a href="pagina.html" target="_blank">📄 Ver HTML da página</a></li>
        <li><a href="relatorio.html" target="_blank">📊 Ver relatório detalhado</a></li>
      </ul>
    </div>
    
    <div class="card">
      <h2>📋 Instruções</h2>
      <ol>
        <li>Clique em "Ver screenshot completo" para ver o print da página</li>
        <li>Clique em "Ver HTML da página" para ver o código fonte</li>
        <li>Clique em "Ver relatório detalhado" para análise técnica</li>
        <li>Se aparecer pedindo login ou desafio, é bloqueio do Mercado Livre</li>
        <li>Se aparecer produtos, o script funcionou! 🎉</li>
      </ol>
    </div>
  </div>
</body>
</html>
    `;
    
    fs.writeFileSync(visualizacaoPath, visualizacaoHtml);
    console.log(`✅ Visualização criada: ${visualizacaoPath}`);
    
    // Mostrar resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO DIAGNÓSTICO:');
    console.log('='.repeat(50));
    console.log(`📁 Pasta: ${pastaResultados}`);
    console.log(`📌 Título: ${titulo}`);
    console.log(`📦 Produtos: ${produtosEncontrados}`);
    if (bloqueio) console.log(`🚫 Bloqueio: ${mensagem}`);
    console.log('\n📂 Arquivos gerados:');
    console.log(`   - ${pastaResultados}/screenshot.png`);
    console.log(`   - ${pastaResultados}/pagina.html`);
    console.log(`   - ${pastaResultados}/relatorio.html`);
    console.log(`   - ${pastaResultados}/VER_RESULTADO.html`);
    console.log('\n👉 Abra o arquivo VER_RESULTADO.html no seu navegador!');
    
    await browser.close();
    
  } catch (erro) {
    console.log('❌ Erro:', erro.message);
  } finally {
    if (browser) await browser.close();
  }
}

function gerarRelatorioHTML(dados) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Relatório Diagnóstico - ${dados.termo}</title>
  <style>
    body { font-family: Arial; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
    .bloqueio { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
    .sucesso { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; }
    .atencao { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; max-height: 300px; }
    .arquivos { background: #e3f2fd; padding: 15px; border-radius: 5px; }
    .arquivos a { color: #1976d2; text-decoration: none; }
    .arquivos a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Relatório de Diagnóstico</h1>
    <p><strong>Termo:</strong> ${dados.termo}</p>
    <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
    
    <div class="${dados.bloqueio ? 'bloqueio' : dados.produtosEncontrados > 0 ? 'sucesso' : 'atencao'}">
      <h3>Status: ${dados.bloqueio || (dados.produtosEncontrados > 0 ? 'SUCESSO' : 'Sem produtos')}</h3>
      <p><strong>Título da página:</strong> ${dados.titulo}</p>
      <p><strong>URL final:</strong> ${dados.url}</p>
      <p><strong>Produtos encontrados:</strong> ${dados.produtosEncontrados}</p>
      ${dados.seletorFuncional ? `<p><strong>Seletor que funcionou:</strong> ${dados.seletorFuncional}</p>` : ''}
      ${dados.mensagem ? `<p><strong>Mensagem:</strong> ${dados.mensagem}</p>` : ''}
    </div>
    
    <h3>📁 Arquivos Gerados</h3>
    <div class="arquivos">
      <ul>
        <li><a href="screenshot.png" target="_blank">📸 screenshot.png</a> - Print da tela</li>
        <li><a href="pagina.html" target="_blank">📄 pagina.html</a> - HTML completo</li>
        <li><a href="VER_RESULTADO.html" target="_blank">👁️ VER_RESULTADO.html</a> - Visualização amigável</li>
      </ul>
    </div>
    
    <h3>📋 Ações Recomendadas</h3>
    <ul>
      ${dados.bloqueio === 'login_required' ? 
        '<li>O Mercado Livre está pedindo login. Precisamos de uma conta real para testar.</li>' : ''}
      ${dados.bloqueio === 'challenge' ? 
        '<li>Desafio de segurança detectado. Precisamos implementar resolução automática ou usar proxy.</li>' : ''}
      ${dados.bloqueio === 'forbidden' ? 
        '<li>Acesso proibido. O IP da VPS pode estar bloqueado. Testar com proxy.</li>' : ''}
      ${!dados.bloqueio && dados.produtosEncontrados === 0 ?
        '<li>Página carregou mas sem produtos. Pode ser que o Mercado Livre esteja retornando conteúdo diferente.</li>' : ''}
      ${dados.produtosEncontrados > 0 ?
        '<li>✅ SUCESSO! O script conseguiu encontrar produtos! Agora podemos evoluir para extrair os dados completos.</li>' : ''}
    </ul>
    
    <h3>📡 Primeiras 20 Requisições</h3>
    <pre>${JSON.stringify(dados.requisicoes, null, 2)}</pre>
  </div>
</body>
</html>
  `;
}

// Executar
diagnosticarMercadoLivre('ps5');