import type { RegistrySkill } from '@/data/registry';

/**
 * 排序类型（与 useSkillsFromAPI 的 SortType 一致）
 */
export type SortType = '' | 'trending' | 'hot';

/**
 * 技能列表快照结构
 */
export interface SkillsSnapshot {
  skills: RegistrySkill[];
  sort: SortType;
  fetchedAt: number;
  hasMore: boolean;
}

/** 缓存 TTL：24 小时 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

const STORAGE_KEY_PREFIX = 'skillhub-skills-snapshot-';

/**
 * 获取 storage key
 * @param sort - 排序类型，空字符串用 'all'
 */
function getStorageKey(sort: SortType): string {
  return `${STORAGE_KEY_PREFIX}${sort || 'all'}`;
}

/**
 * 从 localStorage 读取快照，校验未过期则返回
 * @param sort - 排序类型
 * @returns 有效快照或 null
 */
export function getSnapshot(sort: SortType): SkillsSnapshot | null {
  try {
    const key = getStorageKey(sort);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as SkillsSnapshot;
    if (!snapshot?.skills?.length || typeof snapshot.fetchedAt !== 'number') {
      return null;
    }

    if (Date.now() - snapshot.fetchedAt > CACHE_TTL) {
      return null;
    }

    return {
      ...snapshot,
      hasMore: snapshot.hasMore ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * 将技能列表快照写入 localStorage
 * @param sort - 排序类型
 * @param skills - 技能列表
 * @param hasMore - 是否有更多数据
 */
export function setSnapshot(
  sort: SortType,
  skills: RegistrySkill[],
  hasMore: boolean
): void {
  try {
    const key = getStorageKey(sort);
    const snapshot: SkillsSnapshot = {
      skills,
      sort,
      fetchedAt: Date.now(),
      hasMore,
    };
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // localStorage 不可用时静默忽略
  }
}
