import { useState, useEffect, useCallback } from 'react';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { RegistrySkill } from '@/data/registry';
import { getSnapshot, setSnapshot } from '@/lib/skillsCache';

/** Tauri 环境用插件 fetch 绕过 CORS，浏览器用原生 fetch */
const getFetch = () => ('__TAURI__' in window ? tauriFetch : fetch);

/**
 * 排序类型
 * - '': 全部（All Time）
 * - 'trending': 趋势（24h）
 * - 'hot': 热门
 */
export type SortType = '' | 'trending' | 'hot';

/**
 * Hook 返回值
 */
interface UseSkillsFromAPIResult {
  /** 技能列表 */
  skills: RegistrySkill[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新请求，forceRefresh=true 时跳过缓存强制拉取 */
  refetch: (forceRefresh?: boolean) => void;
  /** 当前排序 */
  sort: SortType;
  /** 设置排序 */
  setSort: (sort: SortType) => void;
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 解析安装数字符串（如 "112.8K" -> 112800）
 * @param installStr - 安装数字符串
 * @returns 解析后的数字
 */
function parseInstalls(installStr: string): number {
  const str = installStr.trim().toUpperCase();
  if (str.endsWith('K')) {
    return Math.round(parseFloat(str.slice(0, -1)) * 1000);
  }
  if (str.endsWith('M')) {
    return Math.round(parseFloat(str.slice(0, -1)) * 1000000);
  }
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * 从 skills.sh HTML 页面解析技能列表
 * skills.sh 使用相对路径格式: href="/owner/repo/skillId"
 * @param html - HTML 字符串
 * @returns 解析后的 RegistrySkill 数组
 */
function parseSkillsFromHtml(html: string): RegistrySkill[] {
  const skills: RegistrySkill[] = [];
  const seen = new Set<string>();
  
  // 保留路径，这些不是技能页面
  const reservedPaths = ['docs', 'trending', 'hot', 'search', 'api', 's', 'mintlify'];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 查找所有相对路径链接（skills.sh 使用相对路径格式）
  // 格式: href="/owner/repo/skillId"
  const links = doc.querySelectorAll('a[href^="/"]');
  
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    
    // 匹配三段式路径: /owner/repo/skillId
    const pathMatch = href.match(/^\/([^/]+)\/([^/]+)\/([^/?#]+)/);
    if (!pathMatch) return;
    
    const [, owner, repo, skillId] = pathMatch;
    
    // 跳过保留路径
    if (reservedPaths.includes(owner)) return;
    
    // 构建唯一 ID 用于去重
    const uniqueId = `${owner}/${repo}/${skillId}`;
    if (seen.has(uniqueId)) return;
    seen.add(uniqueId);
    
    // 从链接文本中提取安装数
    const text = link.textContent || '';
    let installs = 0;
    
    // 查找类似 "112.8K" 或 "1,234" 的安装数
    const installMatch = text.match(/(\d+(?:[.,]\d+)?[KMkm]?)\s*$/);
    if (installMatch) {
      installs = parseInstalls(installMatch[1]);
    }
    
    skills.push({
      id: skillId,
      name: skillId,
      repo: `${owner}/${repo}`,
      subPath: skillId,
      description: '', // 列表页不展示，点击后获取
      category: '未分类',
      tags: [],
      platforms: ['claude', 'cursor'],
      stars: installs,
      install_mode: 'sparse',
      author: owner,
    });
  });
  
  return skills;
}

/**
 * 备用解析方法：使用正则表达式
 * 当 DOMParser 不可用时使用
 * skills.sh 使用相对路径格式: href="/owner/repo/skillId"
 * @param html - HTML 字符串
 * @returns 解析后的 RegistrySkill 数组
 */
function parseSkillsWithRegex(html: string): RegistrySkill[] {
  const skills: RegistrySkill[] = [];
  const seen = new Set<string>();
  
  // 保留路径
  const reservedPaths = ['docs', 'trending', 'hot', 'search', 'api', 's', 'mintlify', '_next'];
  
  // 匹配相对路径链接: href="/owner/repo/skillId"
  const linkRegex = /href="\/([^/]+)\/([^/]+)\/([^/"?#]+)"/g;
  
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const [, owner, repo, skillId] = match;
    const id = `${owner}/${repo}/${skillId}`;
    
    if (seen.has(id)) continue;
    if (reservedPaths.includes(owner)) continue;
    
    // 跳过静态资源路径
    if (skillId.includes('.')) continue;
    
    seen.add(id);
    skills.push({
      id: skillId,
      name: skillId,
      repo: `${owner}/${repo}`,
      subPath: skillId,
      description: '',
      category: '未分类',
      tags: [],
      platforms: ['claude', 'cursor'],
      stars: 0,
      install_mode: 'sparse',
      author: owner,
    });
  }
  
  return skills;
}

/**
 * 从 skills.sh 主页抓取并解析技能列表（混合模式：缓存 + 后台静默刷新）
 * @param initialSort - 初始排序类型
 * @param limit - 最大数量（用于截断结果）
 */
export function useSkillsFromAPI(
  initialSort: SortType = '',
  limit: number = 50
): UseSkillsFromAPIResult {
  const [skills, setSkills] = useState<RegistrySkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>(initialSort);
  const [hasMore, setHasMore] = useState(false);

  /**
   * 实际请求逻辑
   * @param silent - 后台静默刷新：不设置 loading，失败时不改 error/skills
   */
  const fetchSkillsCore = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const path = sort ? `/${sort}` : '/';
        const baseUrl = import.meta.env.DEV ? '/api/skills-sh' : 'https://skills.sh';
        const url = `${baseUrl}${path}`;
        const response = await getFetch()(url);

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        const html = await response.text();
        let parsedSkills: RegistrySkill[];

        if (typeof DOMParser !== 'undefined') {
          parsedSkills = parseSkillsFromHtml(html);
        } else {
          parsedSkills = parseSkillsWithRegex(html);
        }
        if (parsedSkills.length === 0) {
          parsedSkills = parseSkillsWithRegex(html);
        }

        const limitedSkills = parsedSkills.slice(0, limit);
        setSkills(limitedSkills);
        setHasMore(parsedSkills.length > limit);
        setSnapshot(sort, limitedSkills, parsedSkills.length > limit);
      } catch (err) {
        if (!silent) {
          const message =
            err instanceof Error ? err.message : '获取技能列表失败';
          setError(message);
          setSkills([]);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [sort, limit]
  );

  /**
   * 抓取技能列表：有缓存且未强制刷新时秒开 + 后台静默刷新
   * @param forceRefresh - true 时跳过缓存强制拉取
   */
  const fetchSkills = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = getSnapshot(sort);
        if (cached) {
          setSkills(cached.skills);
          setHasMore(cached.hasMore);
          setLoading(false);
          setError(null);
          fetchSkillsCore(true);
          return;
        }
      }
      await fetchSkillsCore(false);
    },
    [sort, fetchSkillsCore]
  );

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    loading,
    error,
    refetch: fetchSkills,
    sort,
    setSort,
    hasMore,
  };
}
