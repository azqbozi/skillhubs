import { useEffect, useMemo, useState } from 'react';
import { SkillCard } from '@/components/SkillCard';
import { useSkillsFromAPI, type SortType } from '@/hooks/useSkillsFromAPI';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';

/**
 * 排序选项配置
 */
const sortOptions: { value: SortType; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'trending', label: '趋势(24h)' },
  { value: 'hot', label: '热门' },
];

/**
 * 发现页 - Skill 市场
 * 从 skills.sh API 获取技能列表
 */
export function Discover() {
  const [search, setSearch] = useState('');
  const installedSkillIds = useStore((s) => s.installedSkillIds);
  const refreshInstalledSkills = useStore((s) => s.refreshInstalledSkills);

  // 从 API 获取技能列表
  const { skills, loading, error, refetch, sort, setSort } = useSkillsFromAPI();

  useEffect(() => {
    // 首次进入页面同步本地已安装列表
    refreshInstalledSkills().catch(() => {});
  }, [refreshInstalledSkills]);

  /**
   * 按 name、author、repo 过滤
   */
  const filteredSkills = useMemo(() => {
    if (!search) return skills;

    const lowerSearch = search.toLowerCase();
    return skills.filter((skill) => {
      return (
        skill.name.toLowerCase().includes(lowerSearch) ||
        skill.author.toLowerCase().includes(lowerSearch) ||
        skill.repo.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, skills]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold">发现 Skills</h1>
        <p className="text-muted-foreground">
          浏览并安装 AI 助手 Skills（数据来自 skills.sh）
        </p>
      </div>

      {/* 搜索框 + 排序 Tab */}
      <div className="flex flex-col gap-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 Skills（按名称、作者、仓库）..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 排序 Tab */}
        <div className="flex items-center gap-4 border-b">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={`relative px-1 py-2 text-sm font-medium transition-colors ${
                sort === option.value
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
              {/* 选中下划线 */}
              {sort === option.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}

          {/* 刷新按钮：强制拉取最新，跳过缓存 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch(true)}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex flex-1 items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => refetch(true)}>
            重试
          </Button>
        </div>
      )}

      {/* 技能列表 */}
      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isInstalled={installedSkillIds.includes(skill.id)}
              />
            ))}
          </div>

          {/* 空状态 */}
          {filteredSkills.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
              {search ? '暂无匹配的 Skills' : '暂无数据'}
            </div>
          )}

          {/* 数量提示 */}
          {filteredSkills.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              共 {filteredSkills.length} 个 Skills
              {search && skills.length !== filteredSkills.length && (
                <span>（筛选自 {skills.length} 个）</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
