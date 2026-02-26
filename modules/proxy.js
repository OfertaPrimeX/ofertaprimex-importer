// CORREÇÃO: importação correta do HttpsProxyAgent
const { HttpsProxyAgent } = require('https-proxy-agent');

// Lista de proxies gratuitos do Brasil
const PROXY_LIST = [
  { host: '189.90.60.214', port: 8080 },
  { host: '177.124.160.122', port: 8080 },
  { host: '191.252.198.113', port: 8080 },
  { host: '177.93.58.74', port: 8080 },
  { host: '189.84.165.166', port: 8080 },
  { host: '45.225.203.202', port: 3128 },
  { host: '170.84.189.94', port: 8080 },
  { host: '138.204.92.50', port: 80 },
  { host: '187.86.124.50', port: 3128 },
  { host: '143.255.140.186', port: 8080 }
];

let proxyIndex = 0;

function getNextProxy() {
  const proxy = PROXY_LIST[proxyIndex];
  proxyIndex = (proxyIndex + 1) % PROXY_LIST.length;
  return proxy;
}

// Função para buscar com proxy usando HttpsProxyAgent (CORRIGIDO)
async function buscarComProxy(url, termo = '') {
  const proxy = getNextProxy();
  const proxyUrl = `http://${proxy.host}:${proxy.port}`;
  
  console.log(`🔄 Tentando proxy: ${proxyUrl}`);
  
  try {
    // Cria o agente de proxy (agora funciona porque importamos { HttpsProxyAgent })
    const agent = new HttpsProxyAgent(proxyUrl);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const resposta = await fetch(url, {
      signal: controller.signal,
      agent: agent, // Passa o agente configurado
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.mercadolivre.com.br/'
      }
    });
    
    clearTimeout(timeout);
    
    if (resposta.ok) {
      console.log(`✅ Proxy ${proxy.host} funcionou!`);
      return await resposta.json();
    } else {
      console.log(`❌ Proxy falhou: ${resposta.status}`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Erro no proxy ${proxy.host}:`, error.message);
    return null;
  }
}

module.exports = { 
  buscarComProxy
};