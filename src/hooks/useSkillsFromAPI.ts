import { useState, useEffect, useCallback } from 'react';
import type { RegistrySkill } from '@/data/registry';

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
  /** 重新请求 */
  refetch: () => void;
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
 * 从 skills.sh 主页抓取并解析技能列表
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
   * 抓取 skills.sh 页面并解析
   */
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 根据 sort 选择不同的页面
      // 全部: / , 趋势: /trending , 热门: /hot
      const path = sort ? `/${sort}` : '/';
      
      // 通过 Vite 代理请求 skills.sh 页面
      const url = `/api/skills-sh${path}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const html = await response.text();
      
      // 解析 HTML
      let parsedSkills: RegistrySkill[];
      
      // 优先使用 DOMParser（浏览器环境）
      if (typeof DOMParser !== 'undefined') {
        parsedSkills = parseSkillsFromHtml(html);
      } else {
        // 退回到正则解析
        parsedSkills = parseSkillsWithRegex(html);
      }
      
      // 如果 DOM 解析失败，尝试正则
      if (parsedSkills.length === 0) {
        parsedSkills = parseSkillsWithRegex(html);
      }
      
      // 应用 limit
      const limitedSkills = parsedSkills.slice(0, limit);
      setSkills(limitedSkills);
      setHasMore(parsedSkills.length > limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取技能列表失败';
      setError(message);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [sort, limit]);

  // 初始加载 & sort 变化时重新请求
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
