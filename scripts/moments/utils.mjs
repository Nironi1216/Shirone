/**
 * 抓取层共用的小工具：HTML → Markdown、实体解码、远程图片下载。
 * 不引第三方依赖，保证 Node 原生可跑（构建机上也一样）。
 */

const ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
};

export function decodeEntities(input) {
	return String(input ?? "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
		const lower = String(code).toLowerCase();
		if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
		if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
		return ENTITIES[lower] ?? match;
	});
}

/** 把社交平台的 HTML 正文转成够用的 Markdown */
export function htmlToMarkdown(html) {
	let text = String(html ?? "");
	text = text.replace(/<br\s*\/?>/gi, "\n");
	text = text.replace(/<\/(p|div|blockquote)>/gi, "\n\n");
	text = text.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
		const label = inner.replace(/<[^>]+>/g, "").trim();
		return label ? `[${label}](${decodeEntities(href)})` : decodeEntities(href);
	});
	text = text.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**");
	text = text.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*");
	text = text.replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`");
	text = text.replace(/<[^>]+>/g, "");
	text = decodeEntities(text);
	return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** 正文里出现的 #话题（中英文都可），用于生成 tags */
export function extractHashtags(text) {
	return [...String(text ?? "").matchAll(/(?:^|\s)#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);
}

export function safeId(value) {
	return String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60) || "unknown";
}

const EXT_BY_TYPE = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
};

function extFromUrl(url) {
	const clean = String(url).split("?")[0];
	const match = clean.match(/\.([a-z0-9]{2,5})$/i);
	return match ? match[1].toLowerCase() : null;
}

/**
 * 下载远程图片，返回 { ext, buffer }；失败返回 null（不中断整条动态的生成）。
 */
export async function downloadImage(url, { timeoutMs = 15000, maxBytes = 8 * 1024 * 1024 } = {}) {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { Accept: "image/*" },
			redirect: "follow",
		});
		clearTimeout(timer);
		if (!res.ok) return null;
		const type = (res.headers.get("content-type") || "").split(";")[0].trim();
		const buffer = Buffer.from(await res.arrayBuffer());
		if (!buffer.length || buffer.length > maxBytes) return null;
		const ext = EXT_BY_TYPE[type] || extFromUrl(url) || "jpg";
		return { ext, buffer };
	} catch {
		return null;
	}
}

export async function getJson(url, { timeoutMs = 15000 } = {}) {
	const text = await getText(url, { timeoutMs });
	return JSON.parse(text);
}

export async function getText(url, { timeoutMs = 15000 } = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				Accept: "*/*",
				// 部分实例/站点会拒绝空 UA 的请求
				"User-Agent": "Mozilla/5.0 (compatible; ShironeMomentsSync/1.0)",
			},
			redirect: "follow",
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}（${url}）`);
		return await res.text();
	} finally {
		clearTimeout(timer);
	}
}
