/**
 * 项目页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/projectsConfig.ts 控制。
 *
 * 演示数据已清空。添加项目时按 `ProjectItem`（src/types/projectsConfig.ts）的字段追加即可，
 * 技术栈标签与分类筛选项会随数据自动生成。
 */
import type { ProjectItem } from "@/types/projectsConfig";

export const projectsData: ProjectItem[] = [];
