import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { RegistrySkill } from '@/data/registry';
import { PLATFORMS } from '@/store/useStore';

interface InstallAllResult {
  installed: string[];
  skipped: string[];
}

interface InstallTargetModalProps {
  skill: RegistrySkill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

/** 安装弹窗：一键安装到所有平台 / 安装到项目 */
export function InstallTargetModal({ skill, open: modalOpen, onOpenChange, onComplete }: InstallTargetModalProps) {
  const [targetType, setTargetType] = useState<'all' | 'project'>('all');
  const [projectRoot, setProjectRoot] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBrowseProject = useCallback(async () => {
    if (!('__TAURI__' in window)) {
      toast.info('请在 Tauri 桌面应用中浏览目录');
      return;
    }
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择项目根目录',
      });
      if (selected && typeof selected === 'string') {
        setProjectRoot(selected);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[InstallTargetModal] 选择目录失败:', err);
      toast.error(`选择目录失败: ${msg}`);
    }
  }, []);

  /** 一键安装到所有已检测平台 */
  const handleInstallAll = async () => {
    setLoading(true);
    try {
      const result = await invoke<InstallAllResult>('install_skill_to_all_platforms', {
        payload: {
          id: skill.id,
          repo: skill.repo,
          sub_path: skill.subPath ?? null,
        },
      });
      const { installed, skipped } = result;
      if (installed.length > 0) {
        const label = installed.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p).join('、');
        toast.success(`${skill.name} 已安装到 ${installed.length} 个平台（${label}）`);
      }
      if (skipped.length > 0 && installed.length === 0) {
        toast.info(`${skill.name} 在所有检测到的平台均已安装`);
      }
      if (installed.length > 0 || skipped.length > 0) {
        onOpenChange(false);
        onComplete?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || '安装失败');
    } finally {
      setLoading(false);
    }
  };

  /** 安装到项目 */
  const handleInstallToProject = async () => {
    if (!projectRoot.trim()) {
      toast.error('请选择项目根目录');
      return;
    }
    setLoading(true);
    try {
      await invoke<string>('install_skill', {
        payload: {
          id: skill.id,
          repo: skill.repo,
          sub_path: skill.subPath ?? null,
          target_platform: 'claude',
          project_root: projectRoot,
        },
      });
      toast.success(`${skill.name} 已安装到项目`);
      onOpenChange(false);
      onComplete?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || '安装失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (targetType === 'all') {
      handleInstallAll();
    } else {
      handleInstallToProject();
    }
  };

  const canSubmit = targetType === 'all' || projectRoot.trim().length > 0;

  return (
    <Dialog open={modalOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" priority>
        <DialogHeader>
          <DialogTitle>安装到</DialogTitle>
          <DialogDescription>选择 {skill.name} 的安装方式</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 一键安装到所有平台 */}
          <button
            type="button"
            onClick={() => setTargetType('all')}
            className={`w-full flex flex-col gap-1 p-4 rounded-lg border text-left transition-all ${
              targetType === 'all' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'
            }`}
          >
            <span className="text-sm font-medium">一键安装到所有平台</span>
            <span className="text-xs text-muted-foreground">
              检测本机已安装的 agent（Claude Code、Antigravity、Gemini CLI），安装到未覆盖的平台，已安装的跳过
            </span>
          </button>

          {/* 安装到项目 */}
          <button
            type="button"
            onClick={() => setTargetType('project')}
            className={`w-full flex flex-col gap-1 p-4 rounded-lg border text-left transition-all ${
              targetType === 'project' ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'
            }`}
          >
            <span className="text-sm font-medium">安装到项目</span>
            <span className="text-xs text-muted-foreground">
              选择项目根目录，由 npx skills add 自动检测并安装到对应子目录
            </span>
          </button>

          {targetType === 'project' && (
            <div className="space-y-2 pl-1">
              <label className="text-sm font-medium">项目根目录</label>
              <div className="flex gap-2">
                <Input
                  value={projectRoot}
                  onChange={(e) => setProjectRoot(e.target.value)}
                  placeholder="选择或输入项目路径"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleBrowseProject}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading ? '安装中...' : targetType === 'all' ? '一键安装' : '安装到项目'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
