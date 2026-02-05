import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InstallButton } from './InstallButton';
import type { RegistrySkill } from '@/data/registry';
import { fetchSkillDescription, getCachedDescription } from '@/lib/skillDetail';
import { Loader2, ExternalLink, Download } from 'lucide-react';

interface SkillDetailModalProps {
  /** 技能数据 */
  skill: RegistrySkill;
  /** 是否已安装 */
  isInstalled?: boolean;
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 技能详情弹窗
 * 展示从 skills.sh 详情页解析的描述信息
 */
export function SkillDetailModal({
  skill,
  isInstalled = false,
  open,
  onOpenChange,
}: SkillDetailModalProps) {
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 打开时加载描述
  useEffect(() => {
    if (!open) return;

    // 先检查缓存
    const cached = getCachedDescription(skill.repo, skill.subPath || skill.name);
    if (cached) {
      setDescription(cached);
      return;
    }

    // 加载描述
    setLoading(true);
    setError(null);

    fetchSkillDescription(skill.repo, skill.subPath || skill.name)
      .then((desc) => {
        setDescription(desc);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, skill.repo, skill.subPath, skill.name]);

  // skills.sh 详情页链接
  const detailUrl = `https://skills.sh/${skill.repo}/${skill.subPath || skill.name}`;
  // GitHub 仓库链接
  const githubUrl = `https://github.com/${skill.repo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {skill.name}
            {isInstalled && (
              <span className="rounded border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                已安装
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <span>{skill.author}</span>
            <span>·</span>
            <span>
              <Download className="mr-1 inline h-3 w-3" />
              {skill.stars.toLocaleString()} 安装
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* 描述内容 */}
        <div className="my-4 min-h-[100px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">加载详情中...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              <div className="rounded-md border border-border/40 bg-secondary/30 p-4">
                <p className="text-sm leading-relaxed">
                  {description || '暂无描述'}
                </p>
              </div>

              {/* 仓库信息 */}
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>仓库：</strong>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline"
                  >
                    {skill.repo}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                </p>
                {skill.subPath && (
                  <p>
                    <strong>子路径：</strong> {skill.subPath}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {/* 查看详情链接 */}
          <Button variant="outline" asChild>
            <a href={detailUrl} target="_blank" rel="noopener noreferrer">
              在 skills.sh 查看
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>

          {/* 安装按钮 */}
          <InstallButton skill={skill} isInstalled={isInstalled} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
