import type { ProfileConfig } from "@/types/config";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 博主资料：头像 / 名称 / 简介 / 社交链接（侧栏 Profile 卡片、页脚、RSS 作者等消费）。
 * 类型见 src/types/config.ts。
 */
export const profileConfig: ProfileConfig = withUserConfig("profile", {
	avatar: "assets/images/demo-avatar.webp", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Neyuu",
	bio: "梦安魂于九霄。",
	links: [
		// 需要新增社交入口时，按下面格式追加即可：
		// { name: "显示名", icon: "fa7-brands:图标名", url: "https://..." }
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/Nironi1216",
		},
	],
});
