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
const WHMCS_API = process.env.WHMCS_API || 'https://vps.tsx.dpdns.org';
const urls = WHMCS_URLS.split(';');

const notifyStatus = {};
const client = new Impit({
  browser: 'chrome',
  ignoreTlsErrors: false,
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
console.log('VPS 补货通知: https://t.me/vps_restock');
console.log('脚本最新动态: https://t.me/whmcs_helper\n');

client
  .fetch(`${WHMCS_API}/version`)
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
    console.log('获取版本失败，请重新拉取脚本！');
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

  client.fetch(`${WHMCS_API}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: validUrls }),
  });
}

async function checkStock(url, index) {
  try {
    const response = await client.fetch(url, { redirect: 'manual' });
    const statusCode = response.status;
    const cookies = response.headers.get('set-cookie') || '';
    const location = response.headers.get('location');

    let html;

    if (statusCode >= 300 && statusCode < 400 && location) {
      const redirectUrl = new URL(location, url).toString();
      const redirectResponse = await client.fetch(redirectUrl, {
        headers: { Cookie: cookies },
      });
      html = await redirectResponse.text();
    } else {
      html = await response.text();
    }

    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const isOutOfStock = OUT_OF_STOCK_KEYWORDS.some((keyword) => bodyText.includes(keyword));

    if (isOutOfStock) {
      if (WHMCS_LOGS) console.log(`${time()} 监控 ${index} 无货`);
      notifyStatus[url] = true;
    } else {
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
  const pid = new URLSearchParams(url).get('pid');
  let link = url;

  try {
    const apiUrl = new URL('/id', WHMCS_API);
    apiUrl.searchParams.set('url', url);
    const response = await client.fetch(apiUrl.toString());
    const res = await response.json();
    const { protocol, host } = new URL(url);

    if (res.id && pid) {
      link = `${protocol}//${host}/aff.php?aff=${res.id}&pid=${pid}`;
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
