cat > /app/importacao/importar_ml_para_banco.js << 'EOF'
// /app/importacao/importar_ml_para_banco.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
const config = require('./config');
const { log, formatarPreco, formatarInteiro, formatarBooleano } = require('./utils');

// Configuração do banco
const pool = new Pool(config.banco);

async function importarArquivoCSV(caminhoArquivo) {
    return new Promise((resolve, reject) => {
        const produtos = [];
        const nomeArquivo = path.basename(caminhoArquivo);
        
        log(`📄 Processando: ${nomeArquivo}`);
        
        fs.createReadStream(caminhoArquivo, { encoding: 'utf-8' })
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => {
                try {
                    // Converte os dados do CSV para o formato da tabela
                    const produto = {
                        titulo: row.titulo || '',
                        preco: formatarPreco(row.preco),
                        avaliacao: row.avaliacao ? parseFloat(row.avaliacao.replace(',', '.')) : null,
                        reviews: formatarInteiro(row.reviews),
                        vendedor: row.vendedor || '',
                        loja_oficial: formatarBooleano(row.loja_oficial),
                        frete_gratis: formatarBooleano(row.frete_gratis),
                        link_original: row.link_original || '',
                        link_afiliado: row.link_afiliado || '',
                        sub_categoria: row.sub_categoria || '',
                        categoria_principal: row.categoria_principal || '',
                        cliques: formatarInteiro(row.cliques),
                        score: parseFloat(row.score) || 0
                    };
                    
                    // Só adiciona se tiver título e link
                    if (produto.titulo && produto.link_original) {
                        produtos.push(produto);
                    }
                } catch (err) {
                    log(`⚠️ Erro ao processar linha: ${err.message}`, 'AVISO');
                }
            })
            .on('end', async () => {
                try {
                    log(`📊 Lidos ${produtos.length} produtos válidos de ${nomeArquivo}`);
                    
                    if (produtos.length === 0) {
                        resolve({ inseridos: 0, arquivo: nomeArquivo });
                        return;
                    }

                    // Inserir em lotes
                    const batchSize = config.importacao.lote_tamanho;
                    let inseridos = 0;

                    for (let i = 0; i < produtos.length; i += batchSize) {
                        const batch = produtos.slice(i, i + batchSize);
                        
                        const values = [];
                        const placeholders = batch.map((_, idx) => {
                            const base = idx * 15;
                            return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7}, $${base+8}, $${base+9}, $${base+10}, $${base+11}, $${base+12}, $${base+13}, $${base+14}, $${base+15})`;
                        }).join(',');

                        batch.forEach(p => {
                            values.push(
                                p.titulo, p.preco, p.avaliacao, p.reviews, p.vendedor,
                                p.loja_oficial, p.frete_gratis, p.link_original, p.link_afiliado,
                                p.sub_categoria, p.categoria_principal, p.cliques, p.score,
                                new Date(), // data_coleta
                                new Date()  // data_atualizacao
                            );
                        });

                        const query = `
                            INSERT INTO ml_produtos (
                                titulo, preco, avaliacao, reviews, vendedor,
                                loja_oficial, frete_gratis, link_original, link_afiliado,
                                sub_categoria, categoria_principal, cliques, score,
                                data_coleta, data_atualizacao
                            ) VALUES ${placeholders}
                            ON CONFLICT (link_original) DO UPDATE SET
                                preco = EXCLUDED.preco,
                                avaliacao = EXCLUDED.avaliacao,
                                reviews = EXCLUDED.reviews,
                                frete_gratis = EXCLUDED.frete_gratis,
                                data_atualizacao = EXCLUDED.data_atualizacao,
                                ativo = true
                        `;

                        await pool.query(query, values);
                        inseridos += batch.length;
                        log(`   ✅ Lote ${Math.floor(i/batchSize)+1}: ${batch.length} produtos`);
                    }

                    resolve({ inseridos, arquivo: nomeArquivo });
                    
                } catch (error) {
                    log(`❌ Erro na importação: ${error.message}`, 'ERRO');
                    reject(error);
                }
            })
            .on('error', (error) => {
                log(`❌ Erro ao ler CSV: ${error.message}`, 'ERRO');
                reject(error);
            });
    });
}

async function importarTodosCSVs() {
    log('🚀 Iniciando importação de CSVs para o banco...');
    
    try {
        // Verifica se a pasta existe
        if (!fs.existsSync(config.pasta_csv)) {
            log(`❌ Pasta ${config.pasta_csv} não encontrada!`, 'ERRO');
            return;
        }

        // Lista todos os CSVs
        const arquivos = fs.readdirSync(config.pasta_csv)
            .filter(f => f.endsWith('.csv'))
            .map(f => path.join(config.pasta_csv, f));

        log(`📁 Encontrados ${arquivos.length} arquivos CSV`);

        if (arquivos.length === 0) {
            log('⚠️ Nenhum arquivo CSV encontrado');
            return;
        }

        let totalInseridos = 0;

        for (const arquivo of arquivos) {
            try {
                const resultado = await importarArquivoCSV(arquivo);
                totalInseridos += resultado.inseridos;
            } catch (error) {
                log(`❌ Falha ao processar ${arquivo}: ${error.message}`, 'ERRO');
            }
        }

        log(`\n✅ Importação concluída! Total de produtos: ${totalInseridos}`);
        
        // Testar conexão com o banco
        const result = await pool.query('SELECT COUNT(*) FROM ml_produtos');
        log(`📊 Total no banco: ${result.rows[0].count} produtos`);

    } catch (error) {
        log(`❌ Erro na importação geral: ${error.message}`, 'ERRO');
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    importarTodosCSVs();
}

module.exports = { importarTodosCSVs };
EOF