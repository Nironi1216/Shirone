/**
 * Telegram provider：解析公开频道的网页版 https://t.me/s/<channel>。
 *
 * 为什么不用 Bot API：Bot 拿不到"已经发过的历史消息"（getUpdates 只推送新消息，
 * 且需要常驻进程接收 webhook）。而公开频道的网页版本身就是一份静态 HTML，
 * 构建时抓一次刚好，也不需要任何 token。
 *
 * 代价：依赖 Telegram 的页面结构，哪天他们改版需要同步修这里的正则。
 */
import { decodeEntities, getText, htmlToMarkdown } from "../utils.mjs";

function pickFirst(html, patterns) {
	for (const pattern of patterns) {
		const match = html.match(pattern);
		if (match) return match[1];
	}
	return "";
}

export async function fetchTelegram(source) {
	const channel = String(source.channel ?? "").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
	if (!channel) throw new Error("Telegram 源缺少 channel");

	const pageUrl = source.baseUrl
		? `${String(source.baseUrl).replace(/\/+$/, "")}/s/${channel}`
		: `https://t.me/s/${channel}`;
	const html = await getText(pageUrl);
	// 每条消息以 <div class="tgme_widget_message ..." 开头；用 data-post 切更稳
	const blocks = html.split(/data-post="/).slice(1);
	if (!blocks.length) throw new Error(`在 ${pageUrl} 里没解析到消息（频道可能不存在或不公开）`);

	const items = [];
	for (const block of blocks) {
		const idMatch = block.match(/^([^"/]+)\/(\d+)/);
		if (!idMatch) continue;
		const id = idMatch[2];
		const datetime = pickFirst(block, [/datetime="([^"]+)"/i]);
		if (!datetime) continue;

		const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
		const photos = [
			...[...block.matchAll(/background-image:url\('([^']+)'\)/gi)].map((m) => m[1]),
			...[...block.matchAll(/<img[^>]+class="[^"]*tgme_widget_message_photo[^"]*"[^>]+src="([^"]+)"/gi)].map(
				(m) => m[1],
			),
		];

		const text = htmlToMarkdown(textMatch ? textMatch[1] : "");
		if (!text && !photos.length) continue;

		items.push({
			id,
			published: datetime,
			text,
			url: `https://t.me/${idMatch[1]}/${id}`,
			images: [...new Set(photos)].map((url) => ({ url: decodeEntities(url), alt: "" })),
			hashtags: [],
		});
	}

	if (!items.length) throw new Error("解析到了消息块，但没有任何可用内容");
	return items;
}
