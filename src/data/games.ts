/**
 * 游戏展示页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/gamesConfig.ts 控制。
 *
 * 封面支持三种写法：
 * - src/assets 相对路径（走 Astro 图片管线自动优化为 webp/avif）；
 * - /public 绝对路径（如 "/assets/games/xxx.webp"，原样输出）；
 * - 远程 URL（https://…）。
 *
 * 演示数据已清空。添加条目时按 `GameItem`（src/types/gamesConfig.ts）的字段追加即可。
 */
import type { GameItem } from "@/types/gamesConfig";

export const gamesData: GameItem[] = [];
