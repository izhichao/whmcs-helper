/**
 * VPS 库存监控
 * 定时规则
 * cron: @once
 * 环境变量
 * WHMCS_URLS 监控商品链接（包含 pid 的链接） 多个连接用英文分号（;）分割
 * WHMCS_INTERVAL 监控频率，单位秒，默认为一分钟一次（60）
 * WHMCS_LOGS 是否打印详细日志
 */

const { URL } = require('url');
const { Impit } = require('impit');
const cheerio = require('cheerio');
const version = '1.0.0';
const { sendNotify } = require('./sendNotify.js');

const WHMCS_URLS = process.env.WHMCS_URLS || '';
const WHMCS_INTERVAL = process.env.WHMCS_INTERVAL || 60;
const WHMCS_LOGS = process.env.WHMCS_LOGS || true;
const WHMCS_API = 'https://vps.tsx.dpdns.org';
const WHMCS_PROXY = process.env.WHMCS_PROXY || '';
const FLARESOLVERR_PROXY = process.env.FLARESOLVERR_PROXY || '';
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || '';
const urls = WHMCS_URLS.split(';');

let fsProxyUrl = FLARESOLVERR_PROXY || WHMCS_PROXY;
if (fsProxyUrl && !fsProxyUrl.includes('://')) {
  fsProxyUrl = `http://${fsProxyUrl}`;
}

let proxyUrl = WHMCS_PROXY;
if (proxyUrl && !proxyUrl.includes('://')) {
  proxyUrl = `http://${proxyUrl}`;
}

const notifyStatus = {};
const client = new Impit({
  browser: 'chrome',
  ignoreTlsErrors: false,
  ...(proxyUrl ? { proxyUrl } : {}),
});

const OUT_OF_STOCK_KEYWORDS = [
  'Out of Stock',
  '缺貨中',
  '缺货中',
  '在庫切れ',
  '품절',
  'Agotado',
  'Rupture de stock',
  'Ausverkauft',
  'Esgotado',
  'Нет в наличии',
  'نفذ من المخزون',
  'Stok Habis',
  'Hết hàng',
  'หมดสต็อก',
  'Tükendi',
  'Stokta Yok',
  'Brak w magazynie',
  'Uitverkocht',
  'Slut i lager',
  'Slutsåld',
  'Udsolgt',
  'Loppuunmyyty',
  'Išparduota',
  'Izpirkts',
  'Otsas',
];

console.log('当前版本: ' + version);
console.log('StockVPS 频道: https://t.me/stock_vps\n');

client
  .fetch(`${WHMCS_API}/api/script/version`)
  .then((res) => res.json())
  .then((data) => {
    if (data.version === version) {
      if (data.changelog !== '-') {
        console.log('更新日志: ' + data.changelog + '\n');
      }
      main();
    } else {
      console.log('最新版本: ' + data.version);
      console.log('脚本已更新，请重新拉取脚本！');
    }
  })
  .catch(() => {
    console.log('获取版本失败，将继续运行本地脚本...\n');
    main();
  });

function main() {
  console.log('-------开始执行-------');

  const validUrls = urls.filter((url) => url.includes('cart') || url.includes('aff') || url.includes('store'));

  if (validUrls.length === 0) {
    console.log('没有符合条件的地址！');
    return;
  }

  validUrls.forEach((url, index) => {
    notifyStatus[url] = true;
    console.log(`[获取到 ${validUrls.length} 个地址] 开始监控第 ${index + 1} 个地址`);
    checkStock(url, index + 1);
    setInterval(() => checkStock(url, index + 1), WHMCS_INTERVAL * 1000);
  });

  client.fetch(`${WHMCS_API}/api/script/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: validUrls }),
  }).catch(() => {});
}

const cfCache = {};

function formatCookieString(cookiesArray) {
  if (!cookiesArray || cookiesArray.length === 0) return '';
  return cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');
}

function mergeCookies(oldCookies, setCookieHeader) {
  if (!setCookieHeader) return oldCookies;
  const cookieMap = new Map(oldCookies.map(c => [c.name, c.value]));
  
  const cookiesList = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_\-]+[=])/);
  for (const cookieStr of cookiesList) {
    const parts = cookieStr.split(';');
    const mainPart = parts[0].trim();
    const eqIndex = mainPart.indexOf('=');
    if (eqIndex > 0) {
      const name = mainPart.slice(0, eqIndex).trim();
      const value = mainPart.slice(eqIndex + 1).trim();
      if (name && value) {
        cookieMap.set(name, value);
      }
    }
  }
  return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }));
}

async function fetchViaFlareSolverr(targetUrl, cookies = []) {
  const requestBody = {
    cmd: 'request.get',
    url: targetUrl,
    cookies: cookies,
    maxTimeout: 60000,
  };
  
  if (fsProxyUrl) {
    requestBody.proxy = { url: fsProxyUrl };
  }

  const response = await fetch(FLARESOLVERR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(90000),
  });
  const data = await response.json();
  if (data.status !== 'ok') {
    throw new Error(data.message || 'FlareSolverr failed');
  }
  return {
    html: data.solution.response,
    finalUrl: data.solution.url,
    statusCode: data.solution.status,
    cookies: data.solution.cookies,
    userAgent: data.solution.userAgent || '',
  };
}

async function checkStock(url, index) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.host;

    let html;
    let finalUrl = url;
    let statusCode;
    let cookies = [];
    let userAgent = '';

    const cache = cfCache[host];
    const hasCache = cache && cache.cookies && cache.cookies.length > 0 && cache.userAgent;

    let usedFlareSolverr = false;

    const reqHeaders = {};
    if (hasCache) {
      reqHeaders['Cookie'] = formatCookieString(cache.cookies);
      reqHeaders['User-Agent'] = cache.userAgent;
      cookies = cache.cookies;
      userAgent = cache.userAgent;
    }

    const response = await client.fetch(url, { 
      redirect: 'manual',
      headers: reqHeaders,
    });
    statusCode = response.status;
    
    if (statusCode === 403 && FLARESOLVERR_URL) {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} [${statusCode}] 通过 FlareSolverr 访问...`);
      const result = await fetchViaFlareSolverr(url);
      html = result.html;
      finalUrl = result.finalUrl;
      statusCode = result.statusCode;
      cookies = result.cookies;
      userAgent = result.userAgent;
      usedFlareSolverr = true;

      // 存入内存缓存
      cfCache[host] = { cookies, userAgent };
    } else {
      let setCookieHeader = response.headers.get('set-cookie') || '';
      cookies = mergeCookies(cookies, setCookieHeader);
      const location = response.headers.get('location');

      // 直连成功或正常进行 3xx 跳转
      if (statusCode >= 300 && statusCode < 400 && location) {
        const targetLocation = new URL(location, url).toString();
        const redirectResponse = await client.fetch(targetLocation, {
          headers: {
            'Cookie': formatCookieString(cookies),
            ...(userAgent ? { 'User-Agent': userAgent } : {}),
          },
        });
        statusCode = redirectResponse.status;
        const redirectSetCookie = redirectResponse.headers.get('set-cookie');
        cookies = mergeCookies(cookies, redirectSetCookie);
        html = await redirectResponse.text();
        finalUrl = redirectResponse.url || targetLocation;
      } else {
        html = await response.text();
        finalUrl = response.url || url;      
      }
    }

    if (finalUrl.includes('a=view') && statusCode < 400) {
      // 检测到 a=view，尝试重新请求配置页面
      const confUrlObj = new URL(url);
      confUrlObj.search = '?a=confproduct&i=0';
      const redirectUrl = confUrlObj.toString();

      if (usedFlareSolverr) {
        const result = await fetchViaFlareSolverr(redirectUrl, cookies);
        html = result.html;
        finalUrl = result.finalUrl;
        statusCode = result.statusCode;
        cookies = result.cookies;
        if (cfCache[host]) {
          cfCache[host].cookies = cookies;
        }
      } else {
        const confResponse = await client.fetch(redirectUrl, {
          headers: {
            'Cookie': formatCookieString(cookies),
            ...(userAgent ? { 'User-Agent': userAgent } : {}),
          },
        });
        statusCode = confResponse.status;
        const confSetCookie = confResponse.headers.get('set-cookie');
        cookies = mergeCookies(cookies, confSetCookie);
        if (cfCache[host]) {
          cfCache[host].cookies = cookies;
        }
        html = await confResponse.text();
        finalUrl = confResponse.url || redirectUrl;
      }
    }

    if (statusCode >= 400) {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} 请求失败，状态码: ${statusCode}`);
      return;
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const isOutOfStock = OUT_OF_STOCK_KEYWORDS.some((keyword) => bodyText.includes(keyword));
    const isConfPage = finalUrl.includes('a=confproduct') || finalUrl.includes('a=view');

    if (isConfPage) {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} 有货`);
      if (notifyStatus[url]) {
        if (url.includes('bwh') || url.includes('bandwagon')) {
          sendNotify(...(await bwhTemplate($, url)));
          console.log((await bwhTemplate($, url))[1]);
        } else if (url.includes('dmit')) {
          sendNotify(...(await dmitTemplate($, url)));
          console.log((await dmitTemplate($, url))[1]);
        } else {
          sendNotify(...(await standardTemplate($, url)));
          console.log((await standardTemplate($, url))[1]);
        }
        notifyStatus[url] = false;
      }
    } else if (isOutOfStock) {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} 无货`);
      notifyStatus[url] = true;
    } else {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} 未上架`);
    }
  } catch (error) {
    console.error('检查库存时出错:', error);
  }
}

async function standardTemplate($, url) {
  const name = $('title').text().split('-')[1]?.trim() || '';
  const title = $('.product-info .product-title').text();
  const detail = $('.product-info p').eq(1).text();
  const billingArr = [];
  $('select[name=billingcycle] option').each((i, option) => {
    billingArr.push($(option).text().trim());
  });
  const billing = billingArr.join('\n');

  return [name + ' 补货通知', await notifyTemplate(title, url, billing, detail)];
}

async function bwhTemplate($, url) {
  const name = $('title').text().split('-')[0].trim();
  const title = $('.cartbox strong').text().trim();
  const detailArr = $('.cartbox strong')
    .parent('.cartbox')
    .html()
    .split('<br>')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  const startIndex = detailArr.findIndex((line) => line.startsWith('SSD:'));
  const detail = detailArr.slice(startIndex, startIndex + 5).join('\n');

  const billingArr = [];
  $('select[name=billingcycle] option').each((i, option) => {
    billingArr.push($(option).text().trim());
  });
  const billing = billingArr.join('\n');

  return [name + ' 补货通知', await notifyTemplate(title, url, billing, detail)];
}

async function dmitTemplate($, url) {
  const name = $('title').text().split('-')[1].trim();
  const title = $('.order-summary-box .product-title').text().trim();

  const detailArr = [];
  $('.order-summary-box .order-summary-desc-item').each((i, option) => {
    detailArr.push($(option).text().trim());
  });
  const detail = detailArr.join('\n');
  const billing = $('.summary-totals').text();

  return [name + ' 补货通知', await notifyTemplate(title, url, billing, detail)];
}

async function notifyTemplate(title, url, billing, detail) {
  let link = url;

  try {
    const response = await client.fetch(`${WHMCS_API}/api/script/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const res = await response.json();

    if (res.url && res.url.product) {
      link = res.url.product;
    }
  } catch {}

  return `
🎁 名称
${title}

🔗 下单链接
${link}

💰 价格
${billing}

📝 商品详情
${detail}
`;
}

function time() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `[${hours}:${minutes}:${seconds}]`;
}
