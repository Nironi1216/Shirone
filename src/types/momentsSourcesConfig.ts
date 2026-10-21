/**
 * 动态外部来源（social sources）配置类型。
 *
 * 设计前提：站点是纯静态的，"手机上发动态"这件事交给现成的 App
 * （Mastodon 客户端 / Telegram），构建时再把公开内容抓进来生成 Markdown。
 * 因此这里只描述"从哪抓、抓多少"，不涉及任何凭据写入仓库。
 */

export type MomentsSourceKind = "mastodon" | "telegram";

export interface MastodonSource {
	kind: "mastodon";
	enable: boolean;
	/** 实例域名，不含协议，如 `mastodon.social` */
	instance: string;
	/** 账号名，不含 @，如 `neeuu`；带实例时写 `neeuu@mastodon.social` */
	username: string;
	/** 标签，用于给抓来的动态打 tag（可选） */
	tag?: string;
	/** 覆盖实例地址（自建实例、反代、本地调试用），如 `https://social.example.com` */
	baseUrl?: string;
}

export interface TelegramSource {
	kind: "telegram";
	enable: boolean;
	/** 频道用户名，不含 @ 与 https://t.me/ */
	channel: string;
	tag?: string;
	/** 覆盖频道页地址前缀（镜像站 / 本地调试用），脚本会请求 `${baseUrl}/s/${channel}` */
	baseUrl?: string;
}

export type MomentsSource = MastodonSource | TelegramSource;

export interface MomentsSourcesConfig {
	/** 总开关；false 时 sync 脚本直接退出，零网络请求 */
	enable: boolean;
	/** 抓取失败是否让构建失败；false 时只打印警告，保留上次残留 */
	strict: boolean;
	/** 每个源最多保留多少条 */
	limit: number;
	/** 是否把图片下载到 public/；false 时直接引用远程地址（省构建时间，但依赖外链存活） */
	downloadImages: boolean;
	/** 抓来的动态自带的话题标签是否写入 tags */
	importHashtags: boolean;
	sources: MomentsSource[];
}
