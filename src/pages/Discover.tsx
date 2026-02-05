import { useEffect, useMemo, useState } from 'react';
import { SkillCard } from '@/components/SkillCard';
import { registrySkills } from '@/data/registry';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useStore } from '@/store/useStore';

const categories = ['全部', ...Array.from(new Set(registrySkills.map((s) => s.category)))];

/**
 * 发现页 - Skill 市场
 */
export function Discover() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const installedSkillIds = useStore((s) => s.installedSkillIds);
  const refreshInstalledSkills = useStore((s) => s.refreshInstalledSkills);

  useEffect(() => {
    // 首次进入页面同步本地已安装列表
    refreshInstalledSkills().catch(() => {});
  }, [refreshInstalledSkills]);

  const filteredSkills = useMemo(() => {
    return registrySkills.filter((skill) => {
      const matchSearch =
        !search ||
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        skill.description.toLowerCase().includes(search.toLowerCase()) ||
        skill.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = category === '全部' || skill.category === category;
      return matchSearch && matchCategory;
    });
  }, [search, category]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">发现 Skills</h1>
        <p className="text-muted-foreground">浏览并安装 AI 助手 Skills</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 Skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} isInstalled={installedSkillIds.includes(skill.id)} />
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
          暂无匹配的 Skills
        </div>
      )}
    </div>
  );
}
