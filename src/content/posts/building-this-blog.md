---
title: 把博客搭起来这件事
published: 2026-10-22
description: 从 fork 主题到绑上域名，中间踩的坑，以及为了能随手发条动态绕的那三圈。
tags: [折腾, 博客, Astro]
category: 技术
image: /images/posts/building-this-blog/wallpaper-mobile.webp
draft: false
---

# 把博客搭起来这件事

![手机端首页](/images/posts/building-this-blog/home-mobile.webp)

从 fork 主题到绑上域名拢共没几天，坑不少。记一下，省得过两个月忘了当初为什么这么配。

主题是 [Shirone](https://github.com/LyraVoid/Shirone)，Astro 7 + Svelte 5 + Tailwind 4，白净克制。

## 环境

这台机器没 Homebrew，`/usr/local` 不可写，`brew install node` 走不通。最后是下官方 tarball 解压到 `~/.local/nodejs`，路径写进 `.zshrc`；pnpm 用 npm 全局装，Git 推送配成免密的。

## 壁纸

挑了堆糖上焦茶的一组图，桌面 1920×1080、手机 1080×2340 各裁一套：

![四张手机端壁纸的裁切结果](/images/posts/building-this-blog/wallpaper-mobile.webp)

按 `attention` 策略自动取景，插画类还行，有人物的会把脸切掉一半，最后几张手动指定焦点才救回来。

## 字体

横幅标题先换成霞鹜文楷，后来全站中文都换成了它，原来的悠哉圆体删了。

![同一段标题，换字体前后](/images/posts/building-this-blog/font-compare.webp)

三个坑：

1. 装了 npm 包字却没变：那个包的 `unicode-range` 只覆盖汉字，拉丁字母和假名不在里面，浏览器不命中。改成自托管子集。
2. 改了 CSS 页面没反应：Vite 的缓存。改 `siteConfig` 或者被 `@import` 引用的子 CSS，都得重启 dev server。
3. 子集字表生成不了：Node 不支持 gb2312 解码，最后用 Python 生成字表，7541 个字，压完 3.5MB。

## 清演示数据

主题自带 55 篇示例文章、系列、技能、游戏、项目、时间线，全清了。关于页重写，设备页填了五台真正在用的设备。

![设备页填好之后的样子](/images/posts/building-this-blog/devices.webp)

描述尽量说人话，手机那条写的是"225g，放裤兜里会往下坠"，而不是"轻薄便携"。

番剧页接了 B 站追番列表，77 部：

![番剧页，数据来自 B 站](/images/posts/building-this-blog/anime.webp)

这里有个坑：抓下来的快照和封面被 `.gitignore` 挡在仓库外面，本地看着好好的，一上线就退回演示数据。放开规则重新提交才修好。

关于页：

![关于页](/images/posts/building-this-blog/about.webp)

## 部署

Vercel 导入仓库，绑 `neyuu.fun`。两个点：

- `siteConfig.site` 要写成自己的域名。写错了 og 链接、RSS、sitemap 全指向别处，而且本地完全看不出来。
- 推送之后大约 5 分钟才生效。第一次我以为部署失败了，反复刷，其实在排队。

验证移动端布局时也误判过一次：用 `--window-size=390,844` 截图，看着卡片右边缘被切了，以为横向溢出，实际用 CDP 设备仿真实测 `scrollWidth` 是 390，正常。

## 为了能随手发条动态，绕了三圈

第一圈做了个网页，登录授权一次就能直接发动态。做完自己就觉得鸡肋，每次发还得先去翻一遍授权，不如开电脑写。

![第一版的发动态页面，后来整个回退了](/images/posts/building-this-blog/publish-draft.webp)

第二圈改成账号登录，由服务端代写仓库。写到一半放弃了，因为那意味着要引入运行时，静态博客为了发条动态去养个后端，本末倒置。

第三圈是现在定的：把社交 App 当输入法。手机上在 Mastodon 或者 Telegram 发消息，构建时抓回来变成动态。站点还是纯静态，没有服务端、没有登录、没有数据库，代价是发完要等下一次构建。

想给静态站加一个"动态"的功能时，先问问是不是非得把它变成动态站，大部分时候不用。

（这个方案现在默认关着，等真用上再开。）

## 最后

内容还空着大半，设备页和番剧页填好了，剩下的慢慢填。至少现在打开 neyuu.fun 能看到自己的名字了。

*写于 2026 年 10 月 22 日凌晨*
