import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type Platform = 'claude' | 'cursor';

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
  /** 便捷：已安装 id 集合 */
  installedSkillIds: string[];
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
  refreshInstalledSkills: async () => {
    if (!('__TAURI__' in window)) {
      // 浏览器模式无法调用后端，返回空
      set({ installedSkills: [], installedSkillIds: [] });
      return;
    }
    const platform = get().platform;
    const skills = await invoke<InstalledSkillMeta[]>('get_installed_skills', { platform });
    set({ installedSkills: skills, installedSkillIds: skills.map((s) => s.id) });
  },
}));
