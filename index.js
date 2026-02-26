// IMPORTER PRINCIPAL COM LOOP INFINITO

const { testarConexao, salvarProdutos } = require('./modules/database');
const { buscarMultiplosTermos, testarEndpointAlternativo } = require('./modules/mercado-livre');
const { pegarTop3, timestamp } = require('./modules/utils');
const termos = require('./config/termos');

// Função principal do importer
async function executar() {
  console.log('\n' + '🟢'.repeat(50));
  console.log(`🚀 IMPORTER INICIADO: ${timestamp()}`);
  console.log('🟢'.repeat(50) + '\n');
  
  try {
    // 1. Testar banco
    const bancoOk = await testarConexao();
    
    // 2. TESTAR ENDPOINT ALTERNATIVO PRIMEIRO
    console.log('\n📡 TESTANDO CONEXÃO COM MERCADO LIVRE...\n');
    const endpointOk = await testarEndpointAlternativo();
    
    if (!endpointOk) {
      console.log('⚠️ Endpoints do Mercado Livre estão com problemas! Continuando mesmo assim...\n');
    }
    
    // 3. Buscar produtos no Mercado Livre
    console.log('\n📡 BUSCANDO PRODUTOS...\n');
    const todosProdutos = await buscarMultiplosTermos(termos);
    
    console.log('\n' + '⭐'.repeat(50));
    console.log('📊 RESUMO DOS PRODUTOS ENCONTRADOS:');
    console.log('⭐'.repeat(50));
    
    // 4. MOSTRAR TODOS OS PRODUTOS ENCONTRADOS
    console.log(`\n📦 TOTAL: ${todosProdutos.length} produtos encontrados\n`);
    
    // Agrupar por termo e mostrar
    for (const termo of termos) {
      const produtosDoTermo = todosProdutos.filter(p => p.termo_busca === termo);
      
      console.log(`\n📌 TERMO: "${termo.toUpperCase()}" (${produtosDoTermo.length} produtos)`);
      console.log('─'.repeat(60));
      
      produtosDoTermo.forEach((p, i) => {
        console.log(`\n${i+1}. ${p.titulo}`);
        console.log(`   💰 Preço: R$ ${p.preco}`);
        console.log(`   ⭐ Pontuação vendedor: ${p.pontuacao}/5`);
        console.log(`   🔗 Link: ${p.link ? p.link.substring(0, 80) : 'N/A'}...`);
        console.log(`   🖼️ Imagem: ${p.imagem || 'N/A'}`);
      });
    }
    
    // 5. MOSTRAR TOP 3
    console.log('\n' + '🏆'.repeat(50));
    console.log('🏆 TOP 3 PRODUTOS POR CATEGORIA:');
    console.log('🏆'.repeat(50));
    
    for (const termo of termos) {
      const produtosDoTermo = todosProdutos.filter(p => p.termo_busca === termo);
      const top3 = pegarTop3(produtosDoTermo);
      
      console.log(`\n📌 ${termo.toUpperCase()}:`);
      top3.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.titulo ? p.titulo.substring(0, 60) : 'N/A'}...`);
        console.log(`      💰 R$ ${p.preco || 'N/A'} | ⭐ ${p.pontuacao || 'N/A'}/5`);
      });
    }
    
    // 6. Salvar no banco (se estiver conectado)
    if (bancoOk && todosProdutos.length > 0) {
      console.log('\n💾 Salvando no banco de dados...');
      await salvarProdutos(todosProdutos);
    } else if (!bancoOk) {
      console.log('\n💾 Modo simulação: banco não conectado');
    } else if (todosProdutos.length === 0) {
      console.log('\n💾 Nenhum produto para salvar');
    }
    
    console.log('\n' + '🟢'.repeat(50));
    console.log(`✅ IMPORTER FINALIZADO: ${timestamp()}`);
    console.log('🟢'.repeat(50) + '\n');
    
  } catch (erro) {
    console.error('\n❌ ERRO NO IMPORTER:', erro.message);
  }
}

// ============================================
// MODO SERVIÇO - FICA VIVO EXECUTANDO A CADA X MINUTOS
// ============================================
if (require.main === module) {
  console.log('\n' + '='.repeat(60));
  console.log('🌟 IMPORTER INICIADO EM MODO SERVIÇO');
  console.log('='.repeat(60));
  
  // Intervalo entre execuções (30 minutos)
  const INTERVALO_MINUTOS = 30;
  const INTERVALO_MS = INTERVALO_MINUTOS * 60 * 1000;
  
  console.log(`⏰ Executando a cada ${INTERVALO_MINUTOS} minutos`);
  console.log(`📝 Logs detalhados serão mostrados a cada execução\n`);
  
  // Executa primeira vez agora
  executar();
  
  // Agenda próximas execuções
  setInterval(executar, INTERVALO_MS);
  
  // Mantém processo vivo
  console.log('✅ Serviço rodando. Aguardando próximas execuções...\n');
  
  // Previne que o Node morra
  process.on('SIGINT', () => {
    console.log('\n👋 Importer encerrado pelo usuário');
    process.exit(0);
  });
}