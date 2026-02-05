import { useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { registrySkills } from '@/data/registry';
import { Badge } from '@/components/ui/badge';

/**
 * 我的 Skills 页 - 已安装管理
 */
export function MySkills() {
  const installedSkills = useStore((s) => s.installedSkills);
  const refreshInstalledSkills = useStore((s) => s.refreshInstalledSkills);

  useEffect(() => {
    refreshInstalledSkills().catch(() => {});
  }, [refreshInstalledSkills]);

  const items = useMemo(() => {
    const registryMap = new Map(registrySkills.map((s) => [s.id, s]));
    return installedSkills.map((s) => ({ meta: s, skill: registryMap.get(s.id) }));
  }, [installedSkills]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">我的 Skills</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理已安装的 AI 助手 Skills</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/30 py-16">
          <Package className="h-14 w-14 text-muted-foreground/60" />
          <p className="mt-4 text-muted-foreground">暂无已安装的 Skills</p>
          <p className="mt-1 text-sm text-muted-foreground/80">前往「发现」页面安装 Skills</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ meta, skill }) => (
            <div
              key={meta.id}
              className="rounded-lg border border-border/60 bg-card/50 p-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold leading-none">{skill?.name ?? meta.name ?? meta.id}</h3>
                    {skill?.category ? (
                      <Badge variant="secondary">{skill.category}</Badge>
                    ) : (
                      <Badge variant="outline">本地技能</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {skill?.description ??
                      meta.description ??
                      '该技能来自本地目录，暂未匹配到注册表元数据。'}
                  </p>
                  {(skill?.tags?.length || meta.tags.length) ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(skill?.tags ?? meta.tags).slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Badge variant="outline">已安装</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
