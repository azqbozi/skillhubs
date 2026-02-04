export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  repoUrl: string;
  installCommand: string;
  uninstallCommand: string;
  dependencies: string[];
  compatibleOs: string[];
  version: string;
  lastUpdated: string;
  downloads: number;
  rating: number;
}

export interface InstalledSkill extends Skill {
  installedAt: string;
  status: 'active' | 'inactive' | 'updating' | 'error';
  config?: Record<string, unknown>;
}

export interface Conflict {
  skillId: string;
  conflictingSkillId: string;
  type: 'dependency' | 'compatibility' | 'resource';
  description: string;
}
