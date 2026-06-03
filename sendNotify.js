const querystring = require('node:querystring');
const { request: undiciRequest, ProxyAgent, FormData } = require('undici');
const timeout = 15000;

async function request(url, options = {}) {
  const { json, form, body, headers = {}, ...rest } = options;

  const finalHeaders = { ...headers };
  let finalBody = body;

  if (json) {
    finalHeaders['content-type'] = 'application/json';
    finalBody = JSON.stringify(json);
  } else if (form) {
    finalBody = form;
    delete finalHeaders['content-type'];
  }

  return undiciRequest(url, {
    headers: finalHeaders,
    body: finalBody,
    ...rest,
  });
}

function post(url, options = {}) {
  return request(url, { ...options, method: 'POST' });
}

function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

const httpClient = {
  request,
  post,
  get,
};

const push_config = {
  HITOKOTO: false, 

  BARK_PUSH: '', 
  BARK_ARCHIVE: '', 
  BARK_GROUP: '', 
  BARK_SOUND: '', 
  BARK_ICON: '', 
  BARK_LEVEL: '', 
  BARK_URL: '', 

  DD_BOT_SECRET: '', 
  DD_BOT_TOKEN: '', 

  FSKEY: '', 
  FSSECRET: '', 

  
  
  GOBOT_URL: '', 
  
  
  GOBOT_QQ: '', 
  GOBOT_TOKEN: '', 

  GOTIFY_URL: '', 
  GOTIFY_TOKEN: '', 
  GOTIFY_PRIORITY: 0, 

  IGOT_PUSH_KEY: '', 

  PUSH_KEY: '', 

  DEER_KEY: '', 
  DEER_URL: '', 

  CHAT_URL: '', 
  CHAT_TOKEN: '', 

  
  PUSH_PLUS_TOKEN: '', 
  PUSH_PLUS_USER: '', 
  PUSH_PLUS_TEMPLATE: 'html', 
  PUSH_PLUS_CHANNEL: 'wechat', 
  PUSH_PLUS_WEBHOOK: '', 
  PUSH_PLUS_CALLBACKURL: '', 
  PUSH_PLUS_TO: '', 

  
  WE_PLUS_BOT_TOKEN: '', 
  WE_PLUS_BOT_RECEIVER: '', 
  WE_PLUS_BOT_VERSION: 'pro', 

  QMSG_KEY: '', 
  QMSG_TYPE: '', 

  QYWX_ORIGIN: 'https://qyapi.weixin.qq.com', 

  
  QYWX_AM: '', 

  QYWX_KEY: '', 

  TG_BOT_TOKEN: '', 
  TG_USER_ID: '', 
  TG_API_HOST: 'https://api.telegram.org', 
  TG_PROXY_AUTH: '', 
  TG_PROXY_HOST: '', 
  TG_PROXY_PORT: '', 

  AIBOTK_KEY: '', 
  AIBOTK_TYPE: '', 
  AIBOTK_NAME: '', 

  SMTP_SERVICE: '', 
  SMTP_EMAIL: '', 
  SMTP_TO: '', 
  SMTP_EMAIL_TO: '', 
  SMTP_PASSWORD: '', 
  SMTP_NAME: '', 

  PUSHME_KEY: '', 

  
  CHRONOCAT_QQ: '', 
  CHRONOCAT_TOKEN: '', 
  CHRONOCAT_URL: '', 

  WEBHOOK_URL: '', 
  WEBHOOK_BODY: '', 
  WEBHOOK_HEADERS: '', 
  WEBHOOK_METHOD: '', 
  WEBHOOK_CONTENT_TYPE: '', 

  NTFY_URL: '', 
  NTFY_TOPIC: '', 
  NTFY_PRIORITY: '3', 
  NTFY_TOKEN: '', 
  NTFY_USERNAME: '', 
  NTFY_PASSWORD: '', 
  NTFY_ACTIONS: '', 

  
  
  WXPUSHER_APP_TOKEN: '', 
  WXPUSHER_TOPIC_IDS: '', 
  WXPUSHER_UIDS: '', 

  
  OPENILINK_APP_TOKEN: '', 
  OPENILINK_HUB_URL: '', 
  OPENILINK_CONTEXT_TOKEN: '', 
};

for (const key in push_config) {
  const v = process.env[key];
  if (v) {
    push_config[key] = v;
  }
}

const $ = {
  post: (params, callback) => {
    const { url, ...others } = params;
    httpClient.post(url, others).then(
      async (res) => {
        let body = await res.body.text();
        try {
          body = JSON.parse(body);
        } catch (error) {}
        callback(null, res, body);
      },
      (err) => {
        callback(err?.response?.body || err);
      },
    );
  },
  get: (params, callback) => {
    const { url, ...others } = params;
    httpClient.get(url, others).then(
      async (res) => {
        let body = await res.body.text();
        try {
          body = JSON.parse(body);
        } catch (error) {}
        callback(null, res, body);
      },
      (err) => {
        callback(err?.response?.body || err);
      },
    );
  },
  logErr: console.log,
};

async function one() {
  const url = 'https://v1.hitokoto.cn/';
  const res = await httpClient.request(url);
  const body = await res.body.json();
  return `${body.hitokoto}    ----${body.from}`;
}

function gotifyNotify(text, desp) {
  return new Promise((resolve) => {
    const { GOTIFY_URL, GOTIFY_TOKEN, GOTIFY_PRIORITY } = push_config;
    if (GOTIFY_URL && GOTIFY_TOKEN) {
      const options = {
        url: `${GOTIFY_URL}/message?token=${GOTIFY_TOKEN}`,
        body: `title=${encodeURIComponent(text)}&message=${encodeURIComponent(
          desp,
        )}&priority=${GOTIFY_PRIORITY}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Gotify 发送通知调用API失败😞\n', err);
          } else {
            if (data.id) {
              console.log('Gotify 发送通知消息成功🎉\n');
            } else {
              console.log(`Gotify 发送通知调用API失败😞 ${data.message}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

function gobotNotify(text, desp) {
  return new Promise((resolve) => {
    const { GOBOT_URL, GOBOT_TOKEN, GOBOT_QQ } = push_config;
    if (GOBOT_URL) {
      const options = {
        url: `${GOBOT_URL}?access_token=${GOBOT_TOKEN}&${GOBOT_QQ}`,
        json: { message: `${text}\n${desp}` },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Go-cqhttp 通知调用API失败😞\n', err);
          } else {
            if (data.retcode === 0) {
              console.log('Go-cqhttp 发送通知消息成功🎉\n');
            } else if (data.retcode === 100) {
              console.log(`Go-cqhttp 发送通知消息异常 ${data.errmsg}\n`);
            } else {
              console.log(`Go-cqhttp 发送通知消息异常 ${JSON.stringify(data)}`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function serverNotify(text, desp) {
  return new Promise((resolve) => {
    const { PUSH_KEY } = push_config;
    if (PUSH_KEY) {
      
      desp = desp.replace(/[\n\r]/g, '\n\n');

      const matchResult = PUSH_KEY.match(/^sctp(\d+)t/i);
      const options = {
        url:
          matchResult && matchResult[1]
            ? `https://${matchResult[1]}.push.ft07.com/send/${PUSH_KEY}.send`
            : `https://sctapi.ftqq.com/${PUSH_KEY}.send`,
        body: `text=${encodeURIComponent(text)}&desp=${encodeURIComponent(
          desp,
        )}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Server 酱发送通知调用API失败😞\n', err);
          } else {
            
            if (data.errno === 0 || data.code === 0) {
              console.log('Server 酱发送通知消息成功🎉\n');
            } else if (data.errno === 1024) {
              
              console.log(`Server 酱发送通知消息异常 ${data.errmsg}\n`);
            } else {
              console.log(`Server 酱发送通知消息异常 ${JSON.stringify(data)}`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function pushDeerNotify(text, desp) {
  return new Promise((resolve) => {
    const { DEER_KEY, DEER_URL } = push_config;
    if (DEER_KEY) {
      
      desp = encodeURI(desp);
      const options = {
        url: DEER_URL || `https://api2.pushdeer.com/message/push`,
        body: `pushkey=${DEER_KEY}&text=${text}&desp=${desp}&type=markdown`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('PushDeer 通知调用API失败😞\n', err);
          } else {
            
            if (
              data.content.result.length !== undefined &&
              data.content.result.length > 0
            ) {
              console.log('PushDeer 发送通知消息成功🎉\n');
            } else {
              console.log(
                `PushDeer 发送通知消息异常😞 ${JSON.stringify(data)}`,
              );
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function chatNotify(text, desp) {
  return new Promise((resolve) => {
    const { CHAT_URL, CHAT_TOKEN } = push_config;
    if (CHAT_URL && CHAT_TOKEN) {
      
      desp = encodeURI(desp);
      const options = {
        url: `${CHAT_URL}${CHAT_TOKEN}`,
        body: `payload={"text":"${text}\n${desp}"}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Chat 发送通知调用API失败😞\n', err);
          } else {
            if (data.success) {
              console.log('Chat 发送通知消息成功🎉\n');
            } else {
              console.log(`Chat 发送通知消息异常 ${JSON.stringify(data)}`);
            }
          }
        } catch (e) {
          $.logErr(e);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function barkNotify(text, desp, params = {}) {
  return new Promise((resolve) => {
    let {
      BARK_PUSH,
      BARK_ICON,
      BARK_SOUND,
      BARK_GROUP,
      BARK_LEVEL,
      BARK_ARCHIVE,
      BARK_URL,
    } = push_config;
    if (BARK_PUSH) {
      
      if (!BARK_PUSH.startsWith('http')) {
        BARK_PUSH = `https://api.day.app/${BARK_PUSH}`;
      }
      const options = {
        url: `${BARK_PUSH}`,
        json: {
          title: text,
          body: desp,
          icon: BARK_ICON,
          sound: BARK_SOUND,
          group: BARK_GROUP,
          isArchive: BARK_ARCHIVE,
          level: BARK_LEVEL,
          url: BARK_URL,
          ...params,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Bark APP 发送通知调用API失败😞\n', err);
          } else {
            if (data.code === 200) {
              console.log('Bark APP 发送通知消息成功🎉\n');
            } else {
              console.log(`Bark APP 发送通知消息异常 ${data.message}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

function tgBotNotify(text, desp) {
  return new Promise((resolve) => {
    const {
      TG_BOT_TOKEN,
      TG_USER_ID,
      TG_PROXY_HOST,
      TG_PROXY_PORT,
      TG_API_HOST,
      TG_PROXY_AUTH,
    } = push_config;
    if (TG_BOT_TOKEN && TG_USER_ID) {
      let options = {
        url: `${TG_API_HOST}/bot${TG_BOT_TOKEN}/sendMessage`,
        json: {
          chat_id: `${TG_USER_ID}`,
          text: `${text}\n\n${desp}`,
          disable_web_page_preview: true,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      if (TG_PROXY_HOST && TG_PROXY_PORT) {
        let proxyHost = TG_PROXY_HOST;
        if (TG_PROXY_AUTH && !TG_PROXY_HOST.includes('@')) {
          proxyHost = `${TG_PROXY_AUTH}@${TG_PROXY_HOST}`;
        }
        let agent;
        agent = new ProxyAgent({
          uri: `http://${proxyHost}:${TG_PROXY_PORT}`,
        });
        options.dispatcher = agent;
      }
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Telegram 发送通知消息失败😞\n', err);
          } else {
            if (data.ok) {
              console.log('Telegram 发送通知消息成功🎉。\n');
            } else if (data.error_code === 400) {
              console.log(
                '请主动给bot发送一条消息并检查接收用户ID是否正确。\n',
              );
            } else if (data.error_code === 401) {
              console.log('Telegram bot token 填写错误。\n');
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}
function ddBotNotify(text, desp) {
  return new Promise((resolve) => {
    const { DD_BOT_TOKEN, DD_BOT_SECRET } = push_config;
    const options = {
      url: `https://oapi.dingtalk.com/robot/send?access_token=${DD_BOT_TOKEN}`,
      json: {
        msgtype: 'text',
        text: {
          content: `${text}\n\n${desp}`,
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    };
    if (DD_BOT_TOKEN && DD_BOT_SECRET) {
      const crypto = require('crypto');
      const dateNow = Date.now();
      const hmac = crypto.createHmac('sha256', DD_BOT_SECRET);
      hmac.update(`${dateNow}\n${DD_BOT_SECRET}`);
      const result = encodeURIComponent(hmac.digest('base64'));
      options.url = `${options.url}&timestamp=${dateNow}&sign=${result}`;
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('钉钉发送通知消息失败😞\n', err);
          } else {
            if (data.errcode === 0) {
              console.log('钉钉发送通知消息成功🎉\n');
            } else {
              console.log(`钉钉发送通知消息异常 ${data.errmsg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else if (DD_BOT_TOKEN) {
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('钉钉发送通知消息失败😞\n', err);
          } else {
            if (data.errcode === 0) {
              console.log('钉钉发送通知消息成功🎉\n');
            } else {
              console.log(`钉钉发送通知消息异常 ${data.errmsg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function qywxBotNotify(text, desp) {
  return new Promise((resolve) => {
    const { QYWX_ORIGIN, QYWX_KEY } = push_config;
    const options = {
      url: `${QYWX_ORIGIN}/cgi-bin/webhook/send?key=${QYWX_KEY}`,
      json: {
        msgtype: 'text',
        text: {
          content: `${text}\n\n${desp}`,
        },
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    };
    if (QYWX_KEY) {
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('企业微信发送通知消息失败😞\n', err);
          } else {
            if (data.errcode === 0) {
              console.log('企业微信发送通知消息成功🎉。\n');
            } else {
              console.log(`企业微信发送通知消息异常 ${data.errmsg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function ChangeUserId(desp) {
  const { QYWX_AM } = push_config;
  const QYWX_AM_AY = QYWX_AM.split(',');
  if (QYWX_AM_AY[2]) {
    const userIdTmp = QYWX_AM_AY[2].split('|');
    let userId = '';
    for (let i = 0; i < userIdTmp.length; i++) {
      const count = '账号' + (i + 1);
      const count2 = '签到号 ' + (i + 1);
      if (desp.match(count2)) {
        userId = userIdTmp[i];
      }
    }
    if (!userId) userId = QYWX_AM_AY[2];
    return userId;
  } else {
    return '@all';
  }
}

async function qywxamNotify(text, desp) {
  const MAX_LENGTH = 900;
  if (desp.length > MAX_LENGTH) {
    let d = desp.substr(0, MAX_LENGTH) + '\n==More==';
    await do_qywxamNotify(text, d);
    await qywxamNotify(text, desp.substr(MAX_LENGTH));
  } else {
    return await do_qywxamNotify(text, desp);
  }
}

function do_qywxamNotify(text, desp) {
  return new Promise((resolve) => {
    const { QYWX_AM, QYWX_ORIGIN } = push_config;
    if (QYWX_AM) {
      const QYWX_AM_AY = QYWX_AM.split(',');
      const options_accesstoken = {
        url: `${QYWX_ORIGIN}/cgi-bin/gettoken`,
        json: {
          corpid: `${QYWX_AM_AY[0]}`,
          corpsecret: `${QYWX_AM_AY[1]}`,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options_accesstoken, (err, resp, json) => {
        let html = desp.replace(/\n/g, '<br/>');
        let accesstoken = json.access_token;
        let options;

        switch (QYWX_AM_AY[4]) {
          case '0':
            options = {
              msgtype: 'textcard',
              textcard: {
                title: `${text}`,
                description: `${desp}`,
                url: 'https://github.com/whyour/qinglong',
                btntxt: '更多',
              },
            };
            break;

          case '1':
            options = {
              msgtype: 'text',
              text: {
                content: `${text}\n\n${desp}`,
              },
            };
            break;

          default:
            options = {
              msgtype: 'mpnews',
              mpnews: {
                articles: [
                  {
                    title: `${text}`,
                    thumb_media_id: `${QYWX_AM_AY[4]}`,
                    author: `智能助手`,
                    content_source_url: ``,
                    content: `${html}`,
                    digest: `${desp}`,
                  },
                ],
              },
            };
        }
        if (!QYWX_AM_AY[4]) {
          
          options = {
            msgtype: 'text',
            text: {
              content: `${text}\n\n${desp}`,
            },
          };
        }
        options = {
          url: `${QYWX_ORIGIN}/cgi-bin/message/send?access_token=${accesstoken}`,
          json: {
            touser: `${ChangeUserId(desp)}`,
            agentid: `${QYWX_AM_AY[3]}`,
            safe: '0',
            ...options,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        };

        $.post(options, (err, resp, data) => {
          try {
            if (err) {
              console.log(
                '成员ID:' +
                  ChangeUserId(desp) +
                  '企业微信应用消息发送通知消息失败😞\n',
                err,
              );
            } else {
              if (data.errcode === 0) {
                console.log(
                  '成员ID:' +
                    ChangeUserId(desp) +
                    '企业微信应用消息发送通知消息成功🎉。\n',
                );
              } else {
                console.log(
                  `企业微信应用消息发送通知消息异常 ${data.errmsg}\n`,
                );
              }
            }
          } catch (e) {
            $.logErr(e, resp);
          } finally {
            resolve(data);
          }
        });
      });
    } else {
      resolve();
    }
  });
}

function iGotNotify(text, desp, params = {}) {
  return new Promise((resolve) => {
    const { IGOT_PUSH_KEY } = push_config;
    if (IGOT_PUSH_KEY) {
      
      const IGOT_PUSH_KEY_REGX = new RegExp('^[a-zA-Z0-9]{24}$');
      if (!IGOT_PUSH_KEY_REGX.test(IGOT_PUSH_KEY)) {
        console.log('您所提供的 IGOT_PUSH_KEY 无效\n');
        resolve();
        return;
      }
      const options = {
        url: `https://push.hellyw.com/${IGOT_PUSH_KEY.toLowerCase()}`,
        body: `title=${text}&content=${desp}&${querystring.stringify(params)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('IGot 发送通知调用API失败😞\n', err);
          } else {
            if (data.ret === 0) {
              console.log('IGot 发送通知消息成功🎉\n');
            } else {
              console.log(`IGot 发送通知消息异常 ${data.errMsg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function pushPlusNotify(text, desp) {
  return new Promise((resolve) => {
    const {
      PUSH_PLUS_TOKEN,
      PUSH_PLUS_USER,
      PUSH_PLUS_TEMPLATE,
      PUSH_PLUS_CHANNEL,
      PUSH_PLUS_WEBHOOK,
      PUSH_PLUS_CALLBACKURL,
      PUSH_PLUS_TO,
    } = push_config;
    if (PUSH_PLUS_TOKEN) {
      desp = desp.replace(/[\n\r]/g, '<br>'); 
      const body = {
        token: `${PUSH_PLUS_TOKEN}`,
        title: `${text}`,
        content: `${desp}`,
        topic: `${PUSH_PLUS_USER}`,
        template: `${PUSH_PLUS_TEMPLATE}`,
        channel: `${PUSH_PLUS_CHANNEL}`,
        webhook: `${PUSH_PLUS_WEBHOOK}`,
        callbackUrl: `${PUSH_PLUS_CALLBACKURL}`,
        to: `${PUSH_PLUS_TO}`,
      };
      const options = {
        url: `https://www.pushplus.plus/send`,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': ' application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log(
              `pushplus 发送${
                PUSH_PLUS_USER ? '一对多' : '一对一'
              }通知消息失败😞\n`,
              err,
            );
          } else {
            if (data.code === 200) {
              console.log(
                `pushplus 发送${
                  PUSH_PLUS_USER ? '一对多' : '一对一'
                }通知请求成功🎉，可根据流水号查询推送结果：${
                  data.data
                }\n注意：请求成功并不代表推送成功，如未收到消息，请到pushplus官网使用流水号查询推送最终结果`,
              );
            } else {
              console.log(
                `pushplus 发送${
                  PUSH_PLUS_USER ? '一对多' : '一对一'
                }通知消息异常 ${data.msg}\n`,
              );
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function wePlusBotNotify(text, desp) {
  return new Promise((resolve) => {
    const { WE_PLUS_BOT_TOKEN, WE_PLUS_BOT_RECEIVER, WE_PLUS_BOT_VERSION } =
      push_config;
    if (WE_PLUS_BOT_TOKEN) {
      let template = 'txt';
      if (desp.length > 800) {
        desp = desp.replace(/[\n\r]/g, '<br>');
        template = 'html';
      }
      const body = {
        token: `${WE_PLUS_BOT_TOKEN}`,
        title: `${text}`,
        content: `${desp}`,
        template: `${template}`,
        receiver: `${WE_PLUS_BOT_RECEIVER}`,
        version: `${WE_PLUS_BOT_VERSION}`,
      };
      const options = {
        url: `https://www.weplusbot.com/send`,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': ' application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log(`微加机器人发送通知消息失败😞\n`, err);
          } else {
            if (data.code === 200) {
              console.log(`微加机器人发送通知消息完成🎉\n`);
            } else {
              console.log(`微加机器人发送通知消息异常 ${data.msg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function aibotkNotify(text, desp) {
  return new Promise((resolve) => {
    const { AIBOTK_KEY, AIBOTK_TYPE, AIBOTK_NAME } = push_config;
    if (AIBOTK_KEY && AIBOTK_TYPE && AIBOTK_NAME) {
      let json = {};
      let url = '';
      switch (AIBOTK_TYPE) {
        case 'room':
          url = 'https://api-bot.aibotk.com/openapi/v1/chat/room';
          json = {
            apiKey: `${AIBOTK_KEY}`,
            roomName: `${AIBOTK_NAME}`,
            message: {
              type: 1,
              content: `【青龙快讯】\n\n${text}\n${desp}`,
            },
          };
          break;
        case 'contact':
          url = 'https://api-bot.aibotk.com/openapi/v1/chat/contact';
          json = {
            apiKey: `${AIBOTK_KEY}`,
            name: `${AIBOTK_NAME}`,
            message: {
              type: 1,
              content: `【青龙快讯】\n\n${text}\n${desp}`,
            },
          };
          break;
      }
      const options = {
        url: url,
        json,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('智能微秘书发送通知消息失败😞\n', err);
          } else {
            if (data.code === 0) {
              console.log('智能微秘书发送通知消息成功🎉。\n');
            } else {
              console.log(`智能微秘书发送通知消息异常 ${data.error}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function fsBotNotify(text, desp) {
  return new Promise((resolve) => {
    const { FSKEY, FSSECRET } = push_config;
    if (FSKEY) {
      const body = {
        msg_type: 'text',
        content: { text: `${text}\n\n${desp}` },
      };

      
      
      
      if (FSSECRET) {
        const crypto = require('crypto');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const stringToSign = `${timestamp}\n${FSSECRET}`;
        const hmac = crypto.createHmac('sha256', stringToSign);
        const sign = hmac.digest('base64');
        body.timestamp = timestamp;
        body.sign = sign;
      }

      const options = {
        url: `https://open.feishu.cn/open-apis/bot/v2/hook/${FSKEY}`,
        json: body,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('飞书发送通知调用API失败😞\n', err);
          } else {
            if (data.StatusCode === 0 || data.code === 0) {
              console.log('飞书发送通知消息成功🎉\n');
            } else {
              console.log(`飞书发送通知消息异常 ${data.msg}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

async function smtpNotify(text, desp) {
  const {
    SMTP_EMAIL,
    SMTP_TO,
    SMTP_EMAIL_TO,
    SMTP_PASSWORD,
    SMTP_SERVICE,
    SMTP_NAME,
  } = push_config;
  if (![SMTP_EMAIL, SMTP_PASSWORD].every(Boolean) || !SMTP_SERVICE) {
    return;
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    const addr = SMTP_NAME ? `"${SMTP_NAME}" <${SMTP_EMAIL}>` : SMTP_EMAIL;
    const recipients = [SMTP_EMAIL_TO, SMTP_TO].reduce((list, value) => {
      if (!value) {
        return list;
      }
      return list.concat(
        value
          .split(/[;；]/)
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }, []);
    const info = await transporter.sendMail({
      from: addr,
      to: recipients.length ? recipients : SMTP_EMAIL,
      subject: text,
      html: `${desp.replace(/\n/g, '<br/>')}`,
    });

    transporter.close();

    if (info.messageId) {
      console.log('SMTP 发送通知消息成功🎉\n');
      return true;
    }
    console.log('SMTP 发送通知消息失败😞\n');
  } catch (e) {
    console.log('SMTP 发送通知消息出现异常😞\n', e);
  }
}

function pushMeNotify(text, desp, params = {}) {
  return new Promise((resolve) => {
    const { PUSHME_KEY, PUSHME_URL } = push_config;
    if (PUSHME_KEY) {
      const options = {
        url: PUSHME_URL || 'https://push.i-i.me',
        json: { push_key: PUSHME_KEY, title: text, content: desp, ...params },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('PushMe 发送通知调用API失败😞\n', err);
          } else {
            if (data === 'success') {
              console.log('PushMe 发送通知消息成功🎉\n');
            } else {
              console.log(`PushMe 发送通知消息异常 ${data}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function chronocatNotify(title, desp) {
  return new Promise((resolve) => {
    const { CHRONOCAT_TOKEN, CHRONOCAT_QQ, CHRONOCAT_URL } = push_config;
    if (!CHRONOCAT_TOKEN || !CHRONOCAT_QQ || !CHRONOCAT_URL) {
      resolve();
      return;
    }

    const user_ids = CHRONOCAT_QQ.match(/user_id=(\d+)/g)?.map(
      (match) => match.split('=')[1],
    );
    const group_ids = CHRONOCAT_QQ.match(/group_id=(\d+)/g)?.map(
      (match) => match.split('=')[1],
    );

    const url = `${CHRONOCAT_URL}/api/message/send`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHRONOCAT_TOKEN}`,
    };

    for (const [chat_type, ids] of [
      [1, user_ids],
      [2, group_ids],
    ]) {
      if (!ids) {
        continue;
      }
      for (const chat_id of ids) {
        const data = {
          peer: {
            chatType: chat_type,
            peerUin: chat_id,
          },
          elements: [
            {
              elementType: 1,
              textElement: {
                content: `${title}\n\n${desp}`,
              },
            },
          ],
        };
        const options = {
          url: url,
          json: data,
          headers,
          timeout,
        };
        $.post(options, (err, resp, data) => {
          try {
            if (err) {
              console.log('Chronocat 发送QQ通知消息失败😞\n', err);
            } else {
              if (chat_type === 1) {
                console.log(`Chronocat 个人消息 ${ids}推送成功🎉`);
              } else {
                console.log(`Chronocat 群消息 ${ids}推送成功🎉`);
              }
            }
          } catch (e) {
            $.logErr(e, resp);
          } finally {
            resolve(data);
          }
        });
      }
    }
  });
}

function qmsgNotify(text, desp) {
  return new Promise((resolve) => {
    const { QMSG_KEY, QMSG_TYPE } = push_config;
    if (QMSG_KEY && QMSG_TYPE) {
      const options = {
        url: `https://qmsg.zendee.cn/${QMSG_TYPE}/${QMSG_KEY}`,
        body: `msg=${text}\n\n${desp.replace('----', '-')}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout,
      };
      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Qmsg 发送通知调用API失败😞\n', err);
          } else {
            if (data.code === 0) {
              console.log('Qmsg 发送通知消息成功🎉\n');
            } else {
              console.log(`Qmsg 发送通知消息异常 ${data}\n`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function webhookNotify(text, desp) {
  return new Promise((resolve) => {
    const {
      WEBHOOK_URL,
      WEBHOOK_BODY,
      WEBHOOK_HEADERS,
      WEBHOOK_CONTENT_TYPE,
      WEBHOOK_METHOD,
    } = push_config;
    if (
      !WEBHOOK_METHOD ||
      !WEBHOOK_URL ||
      (!WEBHOOK_URL.includes('$title') && !WEBHOOK_BODY.includes('$title'))
    ) {
      resolve();
      return;
    }

    const headers = parseHeaders(WEBHOOK_HEADERS);
    const body = parseBody(WEBHOOK_BODY, WEBHOOK_CONTENT_TYPE, (v) =>
      v
        ?.replaceAll('$title', text?.replaceAll('\n', '\\n'))
        ?.replaceAll('$content', desp?.replaceAll('\n', '\\n')),
    );
    const bodyParam = formatBodyFun(WEBHOOK_CONTENT_TYPE, body);
    const options = {
      method: WEBHOOK_METHOD,
      headers,
      allowGetBody: true,
      ...bodyParam,
      timeout,
      retry: 1,
    };

    const formatUrl = WEBHOOK_URL.replaceAll(
      '$title',
      encodeURIComponent(text),
    ).replaceAll('$content', encodeURIComponent(desp));
    httpClient.request(formatUrl, options).then(async (resp) => {
      const body = await resp.body.text();
      try {
        if (resp.statusCode !== 200) {
          console.log(`自定义发送通知消息失败😞 ${body}\n`);
        } else {
          console.log(`自定义发送通知消息成功🎉 ${body}\n`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(body);
      }
    });
  });
}

function ntfyNotify(text, desp) {
  function encodeRFC2047(text) {
    const encodedBase64 = Buffer.from(text).toString('base64');
    return `=?utf-8?B?${encodedBase64}?=`;
  }

  return new Promise((resolve) => {
    const {
      NTFY_URL,
      NTFY_TOPIC,
      NTFY_PRIORITY,
      NTFY_TOKEN,
      NTFY_USERNAME,
      NTFY_PASSWORD,
      NTFY_ACTIONS,
    } = push_config;
    if (NTFY_TOPIC) {
      const options = {
        url: `${NTFY_URL || 'https://ntfy.sh'}/${NTFY_TOPIC}`,
        body: `${desp}`,
        headers: {
          Title: `${encodeRFC2047(text)}`,
          Priority: NTFY_PRIORITY || '3',
          Icon: 'https://qn.whyour.cn/logo.png',
        },
        timeout,
      };
      if (NTFY_TOKEN) {
        options.headers['Authorization'] = `Bearer ${NTFY_TOKEN}`;
      } else if (NTFY_USERNAME && NTFY_PASSWORD) {
        options.headers['Authorization'] =
          `Basic ${Buffer.from(`${NTFY_USERNAME}:${NTFY_PASSWORD}`).toString('base64')}`;
      }
      if (NTFY_ACTIONS) {
        options.headers['Actions'] = encodeRFC2047(NTFY_ACTIONS);
      }

      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('Ntfy 通知调用API失败😞\n', err);
          } else {
            if (data.id) {
              console.log('Ntfy 发送通知消息成功🎉\n');
            } else {
              console.log(`Ntfy 发送通知消息异常 ${JSON.stringify(data)}`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function wxPusherNotify(text, desp) {
  return new Promise((resolve) => {
    const { WXPUSHER_APP_TOKEN, WXPUSHER_TOPIC_IDS, WXPUSHER_UIDS } =
      push_config;
    if (WXPUSHER_APP_TOKEN) {
      
      const topicIds = WXPUSHER_TOPIC_IDS
        ? WXPUSHER_TOPIC_IDS.split(';')
            .map((id) => id.trim())
            .filter((id) => id)
            .map((id) => parseInt(id))
        : [];

      
      const uids = WXPUSHER_UIDS
        ? WXPUSHER_UIDS.split(';')
            .map((uid) => uid.trim())
            .filter((uid) => uid)
        : [];

      
      if (!topicIds.length && !uids.length) {
        console.log(
          'wxpusher 服务的 WXPUSHER_TOPIC_IDS 和 WXPUSHER_UIDS 至少设置一个!!',
        );
        return resolve();
      }

      const body = {
        appToken: WXPUSHER_APP_TOKEN,
        content: `<h1>${text}</h1><br/><div style='white-space: pre-wrap;'>${desp}</div>`,
        summary: text,
        contentType: 2,
        topicIds: topicIds,
        uids: uids,
        verifyPayType: 0,
      };

      const options = {
        url: 'https://wxpusher.zjiecode.com/api/send/message',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout,
      };

      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('wxpusher发送通知消息失败！\n', err);
          } else {
            if (data.code === 1000) {
              console.log('wxpusher发送通知消息完成！');
            } else {
              console.log(`wxpusher发送通知消息异常：${data.msg}`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function openiLinkNotify(text, desp) {
  return new Promise((resolve) => {
    const { OPENILINK_APP_TOKEN, OPENILINK_HUB_URL, OPENILINK_CONTEXT_TOKEN } =
      push_config;
    if (OPENILINK_APP_TOKEN) {
      const baseUrl = OPENILINK_HUB_URL
        ? OPENILINK_HUB_URL.replace(/\/$/, '')
        : 'https://hub.openilink.com';
      const body = {
        type: 'text',
        content: `${text}\n\n${desp}`,
      };
      if (OPENILINK_CONTEXT_TOKEN) {
        body.context_token = OPENILINK_CONTEXT_TOKEN;
      }
      const options = {
        url: `${baseUrl}/bot/v1/message/send`,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENILINK_APP_TOKEN}`,
        },
        timeout,
      };

      $.post(options, (err, resp, data) => {
        try {
          if (err) {
            console.log('OpeniLink 发送通知消息失败！\n', err);
          } else {
            if (data.ok) {
              console.log('OpeniLink 发送通知消息成功！');
            } else {
              console.log(`OpeniLink 发送通知消息异常：${data.error}`);
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve(data);
        }
      });
    } else {
      resolve();
    }
  });
}

function parseString(input, valueFormatFn) {
  const regex = /(\w+):\s*((?:(?!\n\w+:).)*)/g;
  const matches = {};

  let match;
  while ((match = regex.exec(input)) !== null) {
    const [, key, value] = match;
    const _key = key.trim();
    if (!_key || matches[_key]) {
      continue;
    }

    let _value = value.trim();

    try {
      _value = valueFormatFn ? valueFormatFn(_value) : _value;
      const jsonValue = JSON.parse(_value);
      matches[_key] = jsonValue;
    } catch (error) {
      matches[_key] = _value;
    }
  }

  return matches;
}

function parseHeaders(headers) {
  if (!headers) return {};

  const parsed = {};
  let key;
  let val;
  let i;

  headers &&
    headers.split('\n').forEach(function parser(line) {
      i = line.indexOf(':');
      key = line.substring(0, i).trim().toLowerCase();
      val = line.substring(i + 1).trim();

      if (!key) {
        return;
      }

      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    });

  return parsed;
}

function parseBody(body, contentType, valueFormatFn) {
  if (contentType === 'text/plain' || !body) {
    return valueFormatFn && body ? valueFormatFn(body) : body;
  }

  const parsed = parseString(body, valueFormatFn);

  switch (contentType) {
    case 'multipart/form-data':
      return Object.keys(parsed).reduce((p, c) => {
        p.append(c, parsed[c]);
        return p;
      }, new FormData());
    case 'application/x-www-form-urlencoded':
      return Object.keys(parsed).reduce((p, c) => {
        return p ? `${p}&${c}=${parsed[c]}` : `${c}=${parsed[c]}`;
      });
  }

  return parsed;
}

function formatBodyFun(contentType, body) {
  if (!body) return {};
  switch (contentType) {
    case 'application/json':
      return { json: body };
    case 'multipart/form-data':
      return { form: body };
    case 'application/x-www-form-urlencoded':
    case 'text/plain':
      return { body };
  }
  return {};
}


async function sendNotify(text, desp, params = {}) {
  
  let skipTitle = process.env.SKIP_PUSH_TITLE;
  if (skipTitle) {
    if (skipTitle.split('\n').includes(text)) {
      console.info(text + '在 SKIP_PUSH_TITLE 环境变量内，跳过推送');
      return;
    }
  }

  if (![false, 'false'].includes(push_config.HITOKOTO)) {
    desp += '\n\n' + (await one());
  }

  await Promise.all([
    serverNotify(text, desp), 
    pushPlusNotify(text, desp), 
    wePlusBotNotify(text, desp), 
    barkNotify(text, desp, params), 
    tgBotNotify(text, desp), 
    ddBotNotify(text, desp), 
    qywxBotNotify(text, desp), 
    qywxamNotify(text, desp), 
    iGotNotify(text, desp, params), 
    gobotNotify(text, desp), 
    gotifyNotify(text, desp), 
    chatNotify(text, desp), 
    pushDeerNotify(text, desp), 
    aibotkNotify(text, desp), 
    fsBotNotify(text, desp), 
    smtpNotify(text, desp), 
    pushMeNotify(text, desp, params), 
    chronocatNotify(text, desp), 
    webhookNotify(text, desp), 
    qmsgNotify(text, desp), 
    ntfyNotify(text, desp), 
    wxPusherNotify(text, desp), 
    openiLinkNotify(text, desp), 
  ]);
}

module.exports = {
  sendNotify,
};