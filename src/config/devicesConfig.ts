import type { DevicesConfig } from "@/types/devicesConfig";
import { withUserConfig } from "../utils/config-overlay.ts";

/**
 * 设备展示页行为与展示配置。
 *
 * 遵循「配置管行为，数据管内容」原则：
 * - enable：页面总开关；false 时导航入口同步隐藏，访问 /devices/ 跳转 404；
 * - categories：场景分类清单（数组顺序即页面顶部 Chips 顺序）；
 * - disabledIds：可选被禁用的设备 ID 列表；
 *
 * 注：设备的具体清单数据（设备名、品牌、规格、感受说明、图片等）请在 `src/data/devices.ts` 中维护。
 */
export const devicesConfig: DevicesConfig = withUserConfig("devices", {
	enable: true,
	title: "$t:devices",
	description: "$t:devicesBanner",
	categories: [
		{
			key: "desk",
			label: "桌面装备",
			icon: "material-symbols:desktop-windows-outline-rounded",
			description: "日常写代码、写字用的电脑与工位设备",
		},
		{
			key: "mobile",
			label: "随身携带",
			icon: "material-symbols:smartphone-outline",
			description: "每天带在身上的手机与穿戴设备",
		},
		{
			key: "audio",
			label: "耳机音频",
			icon: "material-symbols:headphones-rounded",
			description: "通勤与工作时听的耳机、前端",
		},
		{
			key: "camera",
			label: "影像器材",
			icon: "material-symbols:photo-camera-outline",
			description: "出门拍照用的相机与镜头",
		},
	],
	// disabledIds: [],
});
