import type { CompassConfig } from "../types/compassConfig.ts";
import { withUserConfig } from "../utils/config-overlay.ts";

export const compassConfig: CompassConfig = withUserConfig("compass", {
	// 站点罗盘已关闭：导航入口会自动裁剪，页面重定向到 404。
	// 想恢复改成 true 即可（数据仍在 src/data/compass.ts）。
	enable: false,
	title: "$t:compass",
	description: "$t:compassBanner",
});
