import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Package, Trash2, Loader2 } from 'lucide-react';
import { useStore, PLATFORMS, Platform } from '@/store/useStore';
import { registrySkills } from '@/data/registry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function PlatformTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-all',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

/**
 * 我的 Skills 页 - 已安装管理
 */
export function MySkills() {
  const [unloadingId, setUnloadingId] = useState<string | null>(null);
  const { installedSkills, platform, setPlatform, refreshInstalledSkills } = useStore();

  useEffect(() => {
    refreshInstalledSkills().catch(() => {});
  }, [platform, refreshInstalledSkills]);

  const items = useMemo(() => {
    const registryMap = new Map(registrySkills.map((s) => [s.id, s]));
    return installedSkills.map((s) => ({ meta: s, skill: registryMap.get(s.id) }));
  }, [installedSkills]);

  const handleUninstall = async (meta: typeof installedSkills[0]) => {
    if (!confirm(`确定要卸载 "${meta.name ?? meta.id}" 吗？此操作不可恢复。`)) {
      return;
    }

    setUnloadingId(meta.id);
    try {
      await invoke<void>('uninstall_skill', { skillId: meta.id, installPath: meta.install_path });
      toast.success('卸载成功');
      refreshInstalledSkills().catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || '卸载失败');
    } finally {
      setUnloadingId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">我的 Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理已安装的 AI 助手 Skills</p>
        </div>
      </div>

      {/* 平台切换 */}
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <PlatformTab
            key={p.value}
            label={p.label}
            active={platform === p.value}
            onClick={() => setPlatform(p.value as Platform)}
          />
        ))}
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
                <div className="flex-1">
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
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    {meta.install_path}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">已安装</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleUninstall(meta)}
                    disabled={unloadingId === meta.id}
                  >
                    {unloadingId === meta.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
