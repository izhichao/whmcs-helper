<div align="center">

# 🚀 StockVPS Monitor

**⚡ 基于 Node.js 的轻量级自托管 VPS 补货监控系统**

[🌐 StockVPS](https://stockvps.org) | [✨ TG 频道](https://t.me/stock_vps) | [📖 使用文档（WIP）](https://zhichao.org/posts/monitor)

</div>

---

> [!WARNING]
>
> 本项目仅供学习、技术研究及个人使用，请勿用于任何违反法律法规或目标网站服务条款的行为。
>
> 使用本项目所产生的一切风险及法律责任均由使用者自行承担，项目作者及贡献者不承担任何责任。

## 📖 介绍

**StockVPS Monitor** （原 WHMCS 助手）允许用户自定义监控的**商品链接**、**检查频率**，支持使用青龙面板运行或 Node.js 直接运行，实现多渠道实时补货通知。

**StockVPS** 一共由三个部分组成：

1. [🌐 **网站**](https://stockvps.org)：监控了**热门商家**的大部分套餐，支持按规格筛选，快速找出符合需求的套餐。
2. 🔔 **补货监控（本仓库）**：网站上收录的商家有限，监控频率也较低，对于**冷门商家**以及**闪购套餐**可以自行部署监控。
3. 🛒 **下单助手（WIP）**：油猴脚本，支持一键填充注册表单、购物车表单以及**一键下单**，抢购快人一步。

### 🛠️ 原理

- ❌ **缺货**：页面中包含 `Out of Stock` 或 `缺貨中` 等无货关键字，判定为**缺货**。
- ✅ **有货**：页面不包含无货关键字，且重定向到购物车中，判定为有货，根据匹配的商家模板获取商品配置信息发送补货通知。

### 🔌 特性

- 🏢 **支持商家**：默认主题、Lagom 主题、搬瓦工等使用 **WHMCS** 的商家（部分商家只支持通知，无法正确识别名称、规格、价格等）
- 💬 **通知方式**：支持绝大多数通知方式（**参考青龙面板**）
- 🌐 **代理**：支持配置 HTTPS 或 SOCKS5 代理
- 🛡️ **过盾**：支持配置 [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr)

## 🎯 安装

### 🤖 青龙面板（推荐）

推荐直接用[青龙面板](https://github.com/whyour/qinglong)运行，无需配置 Node.js 运行环境，对于小白更加友好~

1. **拉库**：青龙面板 -> 订阅管理 -> 创建订阅

```sh
ql repo https://github.com/izhichao/stockvps-monitor.git "monitor.js"
```

2. **安装依赖**：青龙面板 -> 依赖管理 -> 创建依赖

```txt
cheerio
impit
```

3. **环境变量**：青龙面板 -> 依赖管理 -> 创建变量（环境变量见下文，其中 `STOCKVPS_URLS` 为必填项）
4. **运行**：青龙面板 -> 定时任务 -> 运行

### 💻 直接运行

通过 Node.js 直接运行：

1. 克隆仓库
2. 安装依赖
```sh
pnpm i
```
3. 在根目录创建 `.env` 文件，参照下方环境变量配置填写（通知相关配置参照青龙面板）
4. 启动

```sh
# pnpm add pm2 -g
pnpm start
```

### ⚙️ 环境变量配置

| 环境变量 | 示例 | 说明 |
| --- | :-: | :-: |
| `STOCKVPS_URLS` | https://bwh81.net/aff.php?aff=46644&pid=44;https://bwh81.net/aff.php?aff=46644&pid=87 | 监控商品链接，多个链接用英文分号 `;` 分割 |
| `STOCKVPS_INTERVAL` | `60` (默认 1 分钟) | 监控频率，单位为**秒** |
| `STOCKVPS_LOGS` | `true` (默认开启) | 是否打印详细日志 |
| `STOCKVPS_PROXY` | `http://127.0.0.1:7890` (默认无) | 代理 |
| `STOCKVPS_FS_URL` | `http://127.0.0.1:8191/v1` (默认无) | FlareSolverr 地址 |
| `STOCKVPS_FS_PROXY` | `http://127.0.0.1:7890` (默认无) | FlareSolverr 代理 |

## 📸 效果展示

### 📝 日志

![日志](https://s3.zhichao.org/shared/stockvps-monitor-logs.webp)

### 🔔 通知

![通知](https://s3.zhichao.org/shared/stockvps-monitor-gotify.webp)

## ⚠️ 使用须知

为了保证脚本的正常运行及持续维护，脚本运行时会请求 API 以实现以下功能，感谢您的理解与支持：

- 🔄 **版本检测**：检测**版本号**，获取更新日志，保障脚本的稳定运行与新功能体验。
- 📊 **监控统计**：**匿名**收集监控商品链接，用于分析哪些商家和套餐最受关注。整个过程完全脱敏，不涉及任何个人隐私数据。
- 💖 **推广链接**：发送补货通知时，部分下单链接会附带 AFF 链接。如果您对此介意，可在收到通知后自行将其删除或直接前往商家官网购买。

> [!NOTE]
>
> 如果您非常注重隐私，可以将 `STOCKVPS_API` 变量修改为**空字符串**来完全禁用以上功能！脚本对请求 API 做了回退机制，请求失败时，脚本仍可正常运行！