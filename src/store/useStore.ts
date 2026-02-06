import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type Platform = 'claude' | 'antigravity' | 'gemini';

export const PLATFORMS: { value: Platform; label: string; globalPath: string }[] = [
  { value: 'claude', label: 'Claude Code', globalPath: '~/.claude/skills/' },
  { value: 'antigravity', label: 'Antigravity', globalPath: '~/.gemini/antigravity/skills/' },
  { value: 'gemini', label: 'Gemini CLI', globalPath: '~/.gemini/skills/' },
];

export interface InstalledSkillMeta {
  id: string;
  name?: string | null;
  description?: string | null;
  tags: string[];
  install_path: string;
  skill_md_path?: string | null;
}

interface AppStore {
  /** 当前平台（决定扫描哪个 skills 目录） */
  platform: Platform;
  setPlatform: (platform: Platform) => void;

  /** 本地已安装 skills（目录 + 解析后的元数据） */
  installedSkills: InstalledSkillMeta[];
  /** 便捷：在任意平台已安装的 skill id 集合（用于发现页「已安装」展示） */
  installedSkillIds: string[];
  /** skill_id -> 已安装的平台列表（用于 Tooltip 展示） */
  installedPlatformsBySkillId: Record<string, string[]>;
  refreshInstalledSkills: () => Promise<void>;
}

/**
 * 全局状态（MVP）
 */
export const useStore = create<AppStore>((set, get) => ({
  platform: 'claude',
  setPlatform: (platform) => set({ platform }),

  installedSkills: [],
  installedSkillIds: [],
  installedPlatformsBySkillId: {},
  refreshInstalledSkills: async () => {
    if (!('__TAURI__' in window)) {
      set({ installedSkills: [], installedSkillIds: [], installedPlatformsBySkillId: {} });
      return;
    }
    const platform = get().platform;
    const [skills, idsAnywhere] = await Promise.all([
      invoke<InstalledSkillMeta[]>('get_installed_skills', { platform }),
      invoke<string[]>('get_installed_skill_ids_anywhere'),
    ]);
    let platformsBySkillId: Record<string, string[]> = {};
    if (idsAnywhere.length > 0) {
      try {
        platformsBySkillId = await invoke<Record<string, string[]>>('get_installed_platforms_for_skills', {
          ids: idsAnywhere,
        });
      } catch {
        // 忽略批量接口失败
      }
    }
    set({
      installedSkills: skills,
      installedSkillIds: idsAnywhere,
      installedPlatformsBySkillId: platformsBySkillId,
    });
  },
}));
