// IMPORTER PRINCIPAL
// Ele importa tudo e executa sem quebrar

const { testarConexao, salvarProdutos } = require('./modules/database');
const { buscarMultiplosTermos } = require('./modules/mercado-livre');
const { pegarTop3, timestamp } = require('./modules/utils');
const termos = require('./config/termos');

// Função principal do importer
async function executar() {
  console.log('\n' + '🟢'.repeat(20));
  console.log(`🚀 IMPORTER INICIADO: ${timestamp()}`);
  console.log('🟢'.repeat(20) + '\n');
  
  try {
    // 1. Testar banco (mas não quebra se não conectar)
    const bancoOk = await testarConexao();
    
    if (!bancoOk) {
      console.log('⚠️ Continuando sem banco de dados (modo simulação)');
    }
    
    // 2. Buscar produtos no Mercado Livre
    console.log('\n📡 Buscando produtos...\n');
    const todosProdutos = await buscarMultiplosTermos(termos);
    
    // 3. Agrupar por termo e pegar top 3
    console.log('\n🏆 TOP 3 PRODUTOS POR CATEGORIA:\n');
    
    for (const termo of termos) {
      const produtosDoTermo = todosProdutos.filter(p => p.termo_busca === termo);
      const top3 = pegarTop3(produtosDoTermo);
      
      console.log(`📌 ${termo.toUpperCase()}:`);
      top3.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.titulo.substring(0, 50)}...`);
        console.log(`      R$ ${p.preco} | ⭐ ${p.pontuacao}/5`);
      });
      console.log('');
    }
    
    // 4. Salvar no banco (se estiver conectado)
    if (bancoOk) {
      console.log('💾 Salvando no banco de dados...');
      await salvarProdutos(todosProdutos);
    } else {
      console.log('💾 Modo simulação: dados NÃO salvos no banco');
    }
    
    console.log('\n' + '🟢'.repeat(20));
    console.log(`✅ IMPORTER FINALIZADO: ${timestamp()}`);
    console.log('🟢'.repeat(20) + '\n');
    
  } catch (erro) {
    // Captura QUALQUER erro e não quebra o servidor
    console.error('\n❌ ERRO NO IMPORTER (mas não quebrou):', erro.message);
    console.log('🔧 Continuando execução...\n');
  }
}

// EXECUTA UMA VEZ AGORA
executar();

// OPCIONAL: executar a cada 30 minutos
// setInterval(executar, 30 * 60 * 1000);

// Se quiser modo servidor (para manter rodando)
// Se quiser modo servidor (para manter rodando)
if (require.main === module) {
  console.log('📡 Importer em modo serviço - executando a cada 30 minutos...');
  
  // Executa imediatamente
  executar();
  
  // Depois executa a cada 30 minutos
  setInterval(executar, 30 * 60 * 1000);
  
  // Mantém o processo vivo
  console.log('⏰ Aguardando próximas execuções...');
}