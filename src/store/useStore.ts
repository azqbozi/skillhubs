import { create } from 'zustand';
import { Skill, InstalledSkill, Conflict } from '../types/skill';

interface SkillStore {
  // Available skills from registry
  availableSkills: Skill[];
  setAvailableSkills: (skills: Skill[]) => void;

  // Installed skills
  installedSkills: InstalledSkill[];
  addInstalledSkill: (skill: InstalledSkill) => void;
  removeInstalledSkill: (skillId: string) => void;
  updateInstalledSkill: (skillId: string, updates: Partial<InstalledSkill>) => void;

  // Conflicts
  conflicts: Conflict[];
  setConflicts: (conflicts: Conflict[]) => void;

  // UI State
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  installSkill: (skill: Skill) => Promise<void>;
  uninstallSkill: (skillId: string) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  resolveConflict: (conflictId: string) => Promise<void>;
}

export const useStore = create<SkillStore>((set, _get) => ({
  availableSkills: [],
  setAvailableSkills: (skills) => set({ availableSkills: skills }),

  installedSkills: [],
  addInstalledSkill: (skill) =>
    set((state) => ({ installedSkills: [...state.installedSkills, skill] })),
  removeInstalledSkill: (skillId) =>
    set((state) => ({
      installedSkills: state.installedSkills.filter((s) => s.id !== skillId),
    })),
  updateInstalledSkill: (skillId, updates) =>
    set((state) => ({
      installedSkills: state.installedSkills.map((s) =>
        s.id === skillId ? { ...s, ...updates } : s
      ),
    })),

  conflicts: [],
  setConflicts: (conflicts) => set({ conflicts }),

  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  installSkill: async (skill) => {
    console.log('Installing skill:', skill.name);
  },

  uninstallSkill: async (skillId) => {
    console.log('Uninstalling skill:', skillId);
  },

  checkForUpdates: async () => {
    console.log('Checking for updates');
  },

  resolveConflict: async (conflictId) => {
    console.log('Resolving conflict:', conflictId);
  },
}));
