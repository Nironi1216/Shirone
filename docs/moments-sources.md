# 动态外部来源：把社交 App 当输入法

手机上发消息就是发动态，构建时再把公开内容抓回来。**不需要服务端、不需要登录、
不需要数据库**，站点仍是纯静态。

## 工作原理

```
手机发消息 → Mastodon / Telegram（公开）
                    ↓ 构建时抓取（pnpm moments:sync）
        src/content/moments/social-<kind>-<id>.md + public/images/moments/…
                    ↓ astro build
                  静态页面
```

- 抓取只发生在 `pnpm moments:sync`（`pnpm build` / `pnpm dev` 已自动串联）；
  页面运行时**从不**请求外部 API。
- 生成的文件是构建产物，不进 Git（`.gitignore` 里的 `social-*` 规则）。
- 幂等：文件名由「来源 + 平台条目 id」决定，重复跑只是覆盖；源上删掉的内容
  会在下次同步时按 `.cache/moments-sources.json` 清掉。

## 配置

编辑 `src/config/momentsSourcesConfig.ts`：

```ts
enable: true,
sources: [
  {
    kind: "mastodon",
    enable: true,
    instance: "mastodon.social", // 换成你的实例
    username: "your_handle",
  },
],
```

| 字段 | 说明 |
| --- | --- |
| `enable` | 总开关，false 时同步脚本零开销直接退出 |
| `strict` | 抓取失败是否中断构建（默认 false，只警告并保留上次结果） |
| `limit` | 每个源最多保留多少条 |
| `downloadImages` | 是否把图片下载到 `public/`；关掉则直接用远程外链 |
| `importHashtags` | 正文里的 `#话题` 是否写入 `tags` |
| `baseUrl` | 可选，覆盖实例地址或频道页前缀（自建实例 / 反代 / 本地调试） |

本地预览：`pnpm moments:sync && pnpm dev`（或加 `--dry-run` 只看不写）。

## 定时刷新

静态站只有构建时才会更新，所以配一个定时任务触发重建：
把 `.github/workflows/moments-sync.yml.example` 复制成 `.yml`，
在仓库 Secrets 里填 `VERCEL_DEPLOY_HOOK`（Vercel 项目 Settings > Git > Deploy Hooks）。
默认每小时一次；`workflow_dispatch` 可以手动点一下立即重建。

**延迟是这套方案固有的**：发完消息要等下一次构建（默认最长 1 小时）才出现在站上。
想做到"发了立刻看到"就必须引入运行时（服务端接口 + 数据库），那是另一套方案。

## 各平台情况

| 平台 | 支持 | 说明 |
| --- | --- | --- |
| Mastodon | ✅ | 公开 API（`/api/v1/accounts/lookup` + `statuses`），无需任何凭据；限流或改版时自动回退账号 RSS |
| Telegram | ✅ | 解析公开频道页 `https://t.me/s/<channel>`；频道必须公开。**不用 Bot API**，因为 Bot 拿不到历史消息 |
| 微博 | ❌ | 开放平台接口需企业审核且权限受限，`m.weibo.cn` 需 cookie 且反爬，不做 |

已知限制：

- Telegram 依赖对方页面结构，Telegram 改版时需要同步修
  `scripts/moments/providers/telegram.mjs` 里的正则。
- 只抓原创：Mastodon 排除回复与转嘟；Telegram 只取频道消息。
- 图片按 8MB 上限下载，超限的会跳过（只影响那一张图）。
- 抓来的动态写入了 `source` / `sourceUrl` 两个 frontmatter 字段，
  目前只是存着没在卡片上显示，想在页面上显示"来自 Mastodon"可再改
  `MomentSection.svelte` 与 `MomentItem` 类型。
