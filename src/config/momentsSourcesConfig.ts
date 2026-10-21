/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  动态外部来源：把 Mastodon / Telegram 当"输入法"
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 思路：手机上发消息就是发动态，构建时再去把公开内容抓回来。
 * 站点因此完全不需要服务端、不需要登录、不需要数据库——静态站原样部署。
 *
 * 抓取只发生在显式同步阶段（`pnpm moments:sync`，构建时自动串联），
 * 页面运行时永远不请求外部 API。抓回来的 Markdown 与图片是构建产物，
 * 不进 Git（见 .gitignore 的 social-* 规则）。
 *
 * 用法：
 *   1. 把 enable 置为 true，在 sources 里填你的账号；
 *   2. 本地跑 `pnpm moments:sync` 看 src/content/moments/social-*.md 是否正常生成；
 *   3. 想定时刷新，用 .github/workflows/moments-sync.yml.example 触发 Vercel 重新构建。
 *
 * 注意：Telegram 走的是公开频道页 https://t.me/s/<channel> 的解析，
 * Mastodon 走公开 API（失败时回退 RSS），两者都不需要任何 token。
 */
import type { MomentsSourcesConfig } from "../types/momentsSourcesConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";

export const momentsSourcesConfig: MomentsSourcesConfig = withUserConfig(
	"momentsSources",
	{
		/** 总开关。false 时 sync 脚本直接退出，零网络请求、零副作用。 */
		enable: false,

		/** 网络失败时是否中断构建；false 只警告，保留上一次的文件 */
		strict: false,

		/** 每个源最多保留多少条 */
		limit: 20,

		/** 把图片下载到 public/images/moments/ 下；关掉则直接用远程外链 */
		downloadImages: true,

		/** 正文里的 #话题 是否写入 frontmatter 的 tags */
		importHashtags: true,

		sources: [
			// ── Mastodon ────────────────────────────────────────────────────────
			// 手机上用任意 Mastodon 客户端（Ivory、Mona、Tusky…）发，构建时抓回来。
			// {
			// 	kind: "mastodon",
			// 	enable: true,
			// 	instance: "mastodon.social",
			// 	username: "your_handle",
			// },
			// ── Telegram 频道 ───────────────────────────────────────────────────
			// 频道必须公开（能打开 https://t.me/s/<channel>）。
			// {
			// 	kind: "telegram",
			// 	enable: true,
			// 	channel: "your_channel",
			// },
		],
	},
);
