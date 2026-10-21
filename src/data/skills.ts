/**
 * 技能页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/skillsConfig.ts 控制。
 *
 * 演示数据已清空。添加技能时，按 `SkillItem`（src/types/skillsConfig.ts）的字段追加对象即可，
 * 分类筛选项与雷达图会随数据自动生成。
 */
import type { SkillItem } from "@/types/skillsConfig";

export const skillsData: SkillItem[] = [];
