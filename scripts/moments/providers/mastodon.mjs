/**
 * Mastodon provider：走公开 API（无需任何凭据），失败时回退到账号 RSS。
 *
 * 手机上用任意 Mastodon 客户端发嘟文，构建时抓回来当动态。
 * 只取原创（排除回复和转嘟），图片取 media_attachments 里的图片类型。
 */
import { getJson, getText, htmlToMarkdown } from "../utils.mjs";

function normalizeInstance(instance) {
	return String(instance ?? "")
		.replace(/^https?:\/\//, "")
		.replace(/\/+$/, "");
}

function parseRss(xml) {
	const items = [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
	return items.map((block) => {
		const pick = (tag) => {
			const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
			return match ? match[1].trim() : "";
		};
		const link = pick("link");
		const description = pick("description");
		const images = [
			...[...block.matchAll(/<media:content[^>]+url="([^"]+)"/gi)].map((m) => m[1]),
			...[...block.matchAll(/<enclosure[^>]+url="([^"]+)"/gi)].map((m) => m[1]),
		];
		return {
			id: link.split("/").pop() || link,
			published: pick("pubDate"),
			text: htmlToMarkdown(description),
			url: link,
			images: images.map((url) => ({ url, alt: "" })),
			hashtags: [],
		};
	});
}

export async function fetchMastodon(source) {
	const instance = normalizeInstance(source.instance);
	if (!instance) throw new Error("Mastodon 源缺少 instance");
	if (!source.username) throw new Error("Mastodon 源缺少 username");

	const acct = source.username.includes("@") ? source.username : `${source.username}@${instance}`;
	// baseUrl 仅在显式配置时生效（自建实例 / 反代 / 本地调试）
	const base = source.baseUrl ? String(source.baseUrl).replace(/\/+$/, "") : `https://${instance}`;

	try {
		const account = await getJson(`${base}/api/v1/accounts/lookup?acct=${encodeURIComponent(acct)}`);
		if (!account?.id) throw new Error(`查不到账号 ${acct}`);
		const statuses = await getJson(
			`${base}/api/v1/accounts/${account.id}/statuses?exclude_replies=true&exclude_reblogs=true&limit=40`,
		);
		return (statuses ?? []).map((status) => ({
			id: String(status.id),
			published: status.created_at,
			text: htmlToMarkdown(status.content),
			url: status.url ?? `${base}/@${source.username}/${status.id}`,
			images: (status.media_attachments ?? [])
				.filter((media) => media.type === "image")
				.map((media) => ({ url: media.url ?? media.preview_url, alt: media.description ?? "" })),
			hashtags: (status.tags ?? []).map((tag) => tag?.name).filter(Boolean),
		}));
	} catch (err) {
		// API 被限流或实例改版时，RSS 通常还能用
		const rssUrls = [`${base}/@${source.username.replace(/@.*$/, "")}.rss`, `${base}/users/${source.username.replace(/@.*$/, "")}.rss`];
		for (const rssUrl of rssUrls) {
			try {
				const items = parseRss(await getText(rssUrl));
				if (items.length) return items;
			} catch {
				/* 试下一个地址 */
			}
		}
		throw new Error(`Mastodon 抓取失败：${err.message}`);
	}
}
