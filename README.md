# WHMCS 助手

## VPS 补货监控

脚本最新动态: https://t.me/whmcs_helper

基于 Node.js 的 VPS 监控，可以自托管，自定义监控的链接、频率

推荐使用青龙面板运行（借助青龙脚本可以支持多种通知方式）

[使用文档](https://zhichao.org/posts/monitor)

### 支持商家

- 默认主题（如绿云 GreenCloud、斯巴达 Spartan Host 等）
- 搬瓦工
- 不完美支持其余 WHMCS 主题商家（可以通知补货，但不能获取商品信息）

> 暂不支持套了 CF 5 秒盾的商家（如 RackNerd 等）

### 效果展示

![监控日志](https://minio.zhichao.org/images/whmcs-helper1.webp)

![通知](https://minio.zhichao.org/images/whmcs-helper2.webp)

### 原理

- 获取页面是否包含 `Out of Stock` 或 `缺貨中` ，如有则认为缺货
- 当页面不含上述文字时，认为有货，获取商品信息并发送通知
- ~~**首次运行有货时并不会发送通知，检测到缺货状态后，才会开启通知，当下次补货时会发送通知**~~（首次运行也会发送，便于确认通知是否正常）

### 使用须知

- 脚本会收集运行次数、统计监控的链接（商家）
- 脚本补货通知时，部分商家下单链接会含 AFF
- 脚本目前为压缩后的代码，后续完善功能后再发未压缩代码
- **脚本处于开发阶段，可能存在大量 BUG，有问题请提 Issues（最近比较忙，尽量黑五前完善功能）**

## 极速下单助手

> 施工中……

基于油猴的极速下单脚本，自动填充 Hostname、Root Password、NS1、NS2 等信息，跳过购物车页面，在商品详情页直接完成一键直达订单页面并完成提交。

