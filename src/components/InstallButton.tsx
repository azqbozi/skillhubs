import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import type { RegistrySkill } from '@/data/registry';
import { Download, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

interface InstallButtonProps {
  skill: RegistrySkill;
  isInstalled?: boolean;
}

/**
 * Skill 安装按钮组件
 */
export function InstallButton({ skill, isInstalled = false }: InstallButtonProps) {
  const [loading, setLoading] = useState(false);
  const [installed, setInstalled] = useState(isInstalled);
  const refreshInstalledSkills = useStore((s) => s.refreshInstalledSkills);

  useEffect(() => {
    setInstalled(isInstalled);
  }, [isInstalled]);

  const handleClick = async () => {
    if (installed) {
      toast.info('卸载功能开发中');
      return;
    }

    if (!('__TAURI__' in window)) {
      toast.info('请在 Tauri 桌面应用中运行以使用安装功能');
      return;
    }

    setLoading(true);
    try {
      const [result] = await Promise.all([
        invoke<string>('install_skill', {
          payload: {
            id: skill.id,
            repo: skill.repo,
            sub_path: skill.subPath ?? null,
          },
        }),
        new Promise((r) => setTimeout(r, 400)), // 最小加载时长，确保用户看到反馈
      ]);
      // 安装成功后刷新全局已安装列表，并同步本按钮状态
      await refreshInstalledSkills().catch(() => {});
      setInstalled(true);
      toast.success(result || `${skill.name} 安装请求已提交`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || '安装失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      variant={installed ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          安装中...
        </>
      ) : installed ? (
        <>
          <Check className="h-4 w-4" />
          已安装
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          安装
        </>
      )}
    </Button>
  );
}
