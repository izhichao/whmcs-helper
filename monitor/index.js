/**
 * VPS 库存监控
 * 定时规则
 * cron: @once
 * 环境变量
 * WHMCS_URLS 监控商品链接（包含 pid 的链接） 多个连接用英文分号（;）分割
 * WHMCS_INTERVAL 监控频率，单位毫秒，默认为一分钟一次（60000）
 * WHMCS_LOGS 是否打印详细日志
 */

const { URL } = require('url');
const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cheerio = require('cheerio');
const version = '1.0.0';
const { sendNotify } = require('./sendNotify.js');

// WHMCS 商品页面 URL
const WHMCS_URLS = process.env.WHMCS_URLS || '';
const WHMCS_INTERVAL = process.env.WHMCS_INTERVAL || 60000;
const WHMCS_LOGS = process.env.WHMCS_LOGS || true;
const WHMCS_API = process.env.WHMCS_API || 'https://vps.tsx.dpdns.org';
const urls = WHMCS_URLS.split(';');

const notifyStatus = {};
// 创建一个 CookieJar 来存储 Cookie
const jar = new tough.CookieJar();
const client = wrapper(
  axios.create({
    jar
  })
);

const instance = axios.create({ baseURL: WHMCS_API });

console.log('当前版本: ' + version);
console.log('VPS 补货通知: https://t.me/vps_restock');
console.log('脚本最新动态: https://t.me/whmcs_helper\n');

// 执行
instance
  .get('/version')
  .then((res) => {
    if (res.data.version === version) {
      if (res.data.changelog !== '-') {
        console.log('更新日志: ' + res.data.changelog + '\n');
      }
      main();
    } else {
      console.log('最新版本: ' + res.data.version);
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
    setInterval(() => checkStock(url, index + 1), WHMCS_INTERVAL);
  });

  instance.post('/log', { urls: validUrls });
}

// 检查库存状态的函数
async function checkStock(url, index) {
  try {
    const urlObj = new URL(url);
    const cookies = await jar.getCookies(`${urlObj.protocol}//${urlObj.host}`);

    // 没有存储的 Cookie，发送初始请求以获取 Set-Cookie 响应头
    if (cookies.length === 0) {
      await client.get(url);
    }

    // 发送后续请求，自动包含会话 Cookie
    const { data: res } = await client.get(url);
    const $ = cheerio.load(res);

    const stockStatus = $('body').text().trim();
    if (stockStatus.includes('缺貨中') || stockStatus.includes('Out of Stock')) {
      if (WHMCS_LOGS) {
        console.log(`${time()} 监控 ${index} 无货`);
      }
      notifyStatus[url] = true;
    } else {
      if (WHMCS_LOGS) {
        console.log(`${time()} 监控 ${index} 有货`);
      }
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
  const name = $('title').text().split('-')[1].trim();
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

// 通知模板
async function notifyTemplate(title, url, billing, detail) {
  const pid = new URLSearchParams(url).get('pid');
  let link = url;

  try {
    const { data: res } = await instance.get('/id', { params: { url } });
    const { protocol, host } = new URL(url);
    let path = '';

    if (res.id && pid) {
      link = `${protocol}//${host}${path}/aff.php?aff=${res.id}&pid=${pid}`;
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
