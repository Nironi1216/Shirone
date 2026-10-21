/**
 * 动态外部来源同步：把 Mastodon / Telegram 的公开内容抓成 Markdown，
 * 落到 src/content/moments/social-<kind>-<id>.md（与手写的动态同一目录、同一集合）。
 *
 * 设计要点：
 * - 幂等：文件名由「来源 + 平台条目 id」决定，重复跑只是覆盖，不会越攒越多；
 * - 不留垃圾：用 .cache/moments-sources.json 记住上次写了哪些文件，
 *   源上删掉的动态会在下次同步时一并清掉；
 * - 不炸构建：网络问题默认只警告（strict: true 时才让构建失败）；
 * - 零凭据：只抓公开内容，不需要任何 token。
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { momentsSourcesConfig } from "../../src/config/momentsSourcesConfig.ts";
import { fetchMastodon } from "./providers/mastodon.mjs";
import { fetchTelegram } from "./providers/telegram.mjs";
import { downloadImage, extractHashtags, safeId } from "./utils.mjs";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const momentsDir = join(projectRoot, "src/content/moments");
const imagesRoot = join(projectRoot, "public/images/moments");
const manifestPath = join(projectRoot, ".cache/moments-sources.json");

const dryRun = process.argv.includes("--dry-run");

function yamlString(value) {
	return `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function toIso(value) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function readManifest() {
	try {
		return JSON.parse(await readFile(manifestPath, "utf8"));
	} catch {
		return { files: [], dirs: [] };
	}
}

async function collectFromSource(source) {
	if (source.kind === "mastodon") return fetchMastodon(source);
	if (source.kind === "telegram") return fetchTelegram(source);
	throw new Error(`不支持的来源类型：${source.kind}`);
}

async function writeMoment(item, kind, { downloadImages, importHashtags, extraTag }) {
	const slug = `social-${kind}-${safeId(item.id)}`;
	const published = toIso(item.published);
	if (!published) {
		console.warn(`  · 跳过 ${slug}：时间无法解析（${item.published}）`);
		return null;
	}

	const tags = new Set();
	if (extraTag) tags.add(extraTag);
	if (importHashtags) for (const tag of item.hashtags ?? []) tags.add(String(tag).replace(/^#/, ""));

	const lines = ["---", `published: ${published}`, `source: ${kind}`, `sourceUrl: ${yamlString(item.url)}`];
	if (tags.size) {
		lines.push("tags:");
		for (const tag of tags) lines.push(`  - ${yamlString(tag)}`);
	}

	const imageDir = join(imagesRoot, slug);
	const writtenImages = [];
	if (item.images?.length) {
		const entries = [];
		let index = 0;
		for (const image of item.images) {
			if (!image?.url) continue;
			index += 1;
			if (!downloadImages) {
				entries.push({ src: image.url, alt: image.alt ?? "" });
				continue;
			}
			const downloaded = await downloadImage(image.url);
			if (!downloaded) {
				console.warn(`  · ${slug} 第 ${index} 张图下载失败，跳过`);
				continue;
			}
			const relative = `/images/moments/${slug}/${index}.${downloaded.ext}`;
			if (!dryRun) {
				await mkdir(imageDir, { recursive: true });
				await writeFile(join(imageDir, `${index}.${downloaded.ext}`), downloaded.buffer);
			}
			writtenImages.push(imageDir);
			entries.push({ src: relative, alt: image.alt ?? "" });
		}
		if (entries.length) {
			lines.push("images:");
			for (const entry of entries) lines.push(`  - src: ${entry.src}`, `    alt: ${yamlString(entry.alt)}`);
		}
	}

	lines.push("---", "", String(item.text ?? "").trim(), "");

	const file = join(momentsDir, `${slug}.md`);
	if (!dryRun) {
		await mkdir(momentsDir, { recursive: true });
		await writeFile(file, lines.join("\n"), "utf8");
	}
	return { file, dirs: writtenImages };
}

async function main() {
	const cfg = momentsSourcesConfig;
	if (!cfg?.enable) {
		console.log("[moments:sync] 未启用（momentsSourcesConfig.enable = false），跳过");
		return 0;
	}

	const sources = (cfg.sources ?? []).filter((source) => source?.enable !== false && source?.kind);
	if (!sources.length) {
		console.log("[moments:sync] 没有配置任何来源，跳过");
		return 0;
	}

	const limit = Number(cfg.limit ?? 20) || 20;
	const writtenFiles = new Set();
	const writtenDirs = new Set();
	let failures = 0;

	for (const source of sources) {
		console.log(`[moments:sync] 抓取 ${source.kind}${source.username ? ` @${source.username}` : source.channel ? ` /${source.channel}` : ""}`);
		let items = [];
		try {
			items = await collectFromSource(source);
		} catch (err) {
			failures += 1;
			console.warn(`[moments:sync] ${source.kind} 抓取失败：${err.message}`);
			continue;
		}

		const sorted = items
			.map((item) => ({ ...item, published: item.published, hashtags: item.hashtags ?? extractHashtags(item.text) }))
			.sort((a, b) => new Date(b.published) - new Date(a.published))
			.slice(0, limit);

		let ok = 0;
		for (const item of sorted) {
			const result = await writeMoment(item, source.kind, {
				downloadImages: cfg.downloadImages !== false,
				importHashtags: cfg.importHashtags !== false,
				extraTag: source.tag,
			});
			if (!result) continue;
			ok += 1;
			writtenFiles.add(result.file);
			for (const dir of result.dirs) writtenDirs.add(dir);
		}
		console.log(`  → 写入 ${ok} 条${dryRun ? "（dry-run，未落盘）" : ""}`);
	}

	if (dryRun) return failures && cfg.strict ? 1 : 0;

	// 清理：源上删掉的动态，对应的 md 与图片目录一并移除
	const previous = await readManifest();
	for (const file of previous.files ?? []) {
		if (writtenFiles.has(file)) continue;
		await rm(file, { force: true });
		console.log(`  · 移除已删除的动态：${file.replace(projectRoot, "")}`);
	}
	for (const dir of previous.dirs ?? []) {
		if (writtenDirs.has(dir)) continue;
		await rm(dir, { recursive: true, force: true });
	}

	await mkdir(join(projectRoot, ".cache"), { recursive: true });
	await writeFile(
		manifestPath,
		`${JSON.stringify({ files: [...writtenFiles], dirs: [...writtenDirs] }, null, 2)}\n`,
		"utf8",
	);

	if (failures && cfg.strict) {
		console.error(`[moments:sync] 有 ${failures} 个来源失败，且 strict = true`);
		return 1;
	}
	return 0;
}

main()
	.then((code) => process.exit(code))
	.catch((err) => {
		console.error("[moments:sync] 意外失败：", err);
		process.exit(momentsSourcesConfig?.strict ? 1 : 0);
	});
