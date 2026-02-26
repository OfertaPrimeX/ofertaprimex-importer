const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

// Lista de proxies gratuitos do Brasil (testados em 26/02/2026)
const PROXY_LIST = [
  { host: '189.90.60.214', port: 8080 },  // SP
  { host: '177.124.160.122', port: 8080 }, // RJ
  { host: '191.252.198.113', port: 8080 }, // MG
  { host: '177.93.58.74', port: 8080 },    // RS
  { host: '189.84.165.166', port: 8080 },  // PR
  { host: '45.225.203.202', port: 3128 },  // BA
  { host: '170.84.189.94', port: 8080 },   // SC
  { host: '138.204.92.50', port: 80 },     // PE
  { host: '187.86.124.50', port: 3128 },   // CE
  { host: '143.255.140.186', port: 8080 }  // GO
];

let proxyIndex = 0;

// Função para obter próximo proxy (rodízio)
function getNextProxy() {
  const proxy = PROXY_LIST[proxyIndex];
  proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
  console.log(`🔄 Usando proxy: ${proxy.host}:${proxy.port}`);
  return proxy;
}

// Função para buscar com proxy
async function buscarComProxy(url, termo = '') {
  const proxy = getNextProxy();
  
  try {
    // Cria o agente de proxy
    const agent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`);
    
    // Faz a requisição via axios com proxy
    const response = await axios.get(url, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 8000, // 8 segundos de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.mercadolivre.com.br/'
      }
    });
    
    console.log(`✅ Proxy ${proxy.host} funcionou para: ${termo || url.substring(0, 50)}`);
    return response.data;
    
  } catch (error) {
    console.log(`❌ Proxy ${proxy.host} falhou:`, error.message);
    return null;
  }
}

// Função para testar todos os proxies (opcional)
async function testarTodosProxies() {
  console.log('🧪 Testando todos os proxies...');
  const urlTeste = 'https://api.mercadolibre.com/sites/MLB/categories';
  let funcionaram = 0;
  
  for (let i = 0; i < PROXY_LIST.length; i++) {
    proxyIndex = i; // Força o índice
    const resultado = await buscarComProxy(urlTeste, 'teste');
    if (resultado) funcionaram++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre testes
  }
  
  console.log(`📊 Total: ${funcionaram}/${PROXY_LIST.length} proxies funcionaram`);
  proxyIndex = 0; // Reseta o índice
}

module.exports = { 
  buscarComProxy,
  testarTodosProxies 
};