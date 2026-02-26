// Funções úteis para o importer

// Formatar data/hora
function timestamp() {
  return new Date().toLocaleString('pt-BR');
}

// Calcular score do produto (combina preço + pontuação)
function calcularScore(produto) {
  const preco = produto.preco;
  const pontuacao = produto.pontuacao;
  
  // Quanto menor o preço, maior o score (inverso proporcional)
  const scorePreco = preco > 0 ? 100 / (preco / 100) : 0;
  
  // Pontuação máxima 5 vira 100
  const scoreVendedor = (pontuacao / 5) * 100;
  
  // Score final (70% preço + 30% pontuação vendedor)
  return (scorePreco * 0.7) + (scoreVendedor * 0.3);
}

// Pegar top 3 produtos
function pegarTop3(produtos) {
  return produtos
    .map(p => ({ ...p, score: calcularScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  timestamp,
  calcularScore,
  pegarTop3,
  delay
};