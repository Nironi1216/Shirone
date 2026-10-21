/**
 * 时间线页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/timelineConfig.ts 控制。
 *
 * 演示数据已清空。添加节点时按 `TimelineItem`（src/types/timelineConfig.ts）的字段追加即可，
 * 年份分组与分类筛选项会随数据自动生成。
 */
import type { TimelineItem } from "@/types/timelineConfig";

export const timelineData: TimelineItem[] = [];
