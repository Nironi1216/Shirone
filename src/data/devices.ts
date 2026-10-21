/**
 * 设备展示页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/devicesConfig.ts 控制。
 *
 * 演示数据已清空。添加设备时，按 `DeviceItem`（src/types/devicesConfig.ts）的字段追加对象即可，
 * 分类 / 状态的筛选项会随数据自动生成。
 */
import type { DeviceItem } from "@/types/devicesConfig";

export const devicesData: DeviceItem[] = [];
