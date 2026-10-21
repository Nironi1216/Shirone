---
title: 给博客加上评论
published: 2026-10-22
description: 用 Giscus 给静态站加评论，以及把两个 ID 都填错、导致一条评论也发不出来这件事。
tags: [折腾, 博客, Giscus]
category: 技术
draft: false
---

# 给博客加上评论

之前站点没有评论区，今天装上了。

## 为什么是 Giscus

主题自带评论模块，支持 Giscus 和 Twikoo 两种，改 `src/config/commentConfig.ts` 就行，不用写代码。

Giscus 把评论存在仓库的 Discussions 里，站点不需要后端也不需要数据库，对我来说这点最重要。Twikoo 国内访问更快、还能匿名评论，但要额外部署一个云函数和数据库，为一个评论区养一套后端不划算。

## 开启要做的四步

1. 仓库 Settings 里勾选 Discussions
2. 安装 giscus App 并授权到这个仓库
3. 打开 giscus.app 填仓库名、选一个分类，它会生成一段 script
4. 把里面的 `data-repo-id` 和 `data-category-id` 填进配置，`enable` 打开

前三步都在 GitHub 上点，第四步才是改代码。

## 坑：两个 ID 都不是我以为的那个

第一次配完打开文章页，点发送报 `Unable to create discussion.`。

原因是我把两个 ID 全填错了：

- **repo-id**：GitHub REST 接口给的是纯数字 id，giscus 走 GraphQL，不认这个，要的是 node ID，`R_` 开头
- **category-id**：和仓库 ID 完全是两回事，`DIC_` 开头。我一开始把仓库的 node ID 当成分类 ID 填进去了

两个值的格式：

```
repo-id     R_kgDO...    ← 仓库的 node ID
category-id DIC_kwDO...  ← 分类的 node ID
```

填错的时候页面看起来一切正常，评论区该有的样式都在，只有真正点发送才会报错。

分类 ID 目前只能从 giscus.app 拿。GitHub 的分类接口对匿名请求返回 404，本机没装 gh CLI，giscus 自己的后端接口也已经迁走了。

## 几个不用管的默认值

- 语言跟着站点走，站点是 `zh_CN`，评论框自动变中文
- 懒加载默认开着，滚到评论区才加载脚本
- 明暗主题跟着站点切换
- 「正在加载评论...」这类文案主题自带中文

## 还没验证的部分

评论的人要有 GitHub 账号，匿名发不了。国内访问 github.com 有时不稳，评论区可能加载慢或者刷不出来，得用一阵才知道。真到那时候切 Twikoo，配置里改 `provider` 一行就行。
