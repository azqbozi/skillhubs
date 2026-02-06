import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RegistrySkill } from '@/data/registry';
import { Download, Check } from 'lucide-react';
import { useStore, PLATFORMS } from '@/store/useStore';
import { InstallTargetModal } from './InstallTargetModal';

interface InstallButtonProps {
  skill: RegistrySkill;
  /** 是否在任意平台已安装（用于展示状态，按钮仍可点击以安装到更多平台） */
  isInstalled?: boolean;
  /** 已安装的平台列表（用于 Tooltip 展示） */
  installedPlatforms?: string[];
}

/**
 * Skill 安装按钮组件
 * 已安装时显示「已安装」+ Tooltip 平台列表，仍可点击打开弹窗安装到更多平台或项目
 */
export function InstallButton({ skill, isInstalled = false, installedPlatforms = [] }: InstallButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const refreshInstalledSkills = useStore((s) => s.refreshInstalledSkills);
  const tooltipText =
    installedPlatforms.length > 0
      ? `已安装于：${installedPlatforms.map((p) => PLATFORMS.find((x) => x.value === p)?.label ?? p).join('、')}`
      : '';

  const handleComplete = () => {
    refreshInstalledSkills().catch(() => {});
  };

  const buttonEl = (
    <Button
      className="w-full"
      variant={isInstalled ? 'outline' : 'default'}
      size="sm"
      onClick={() => setModalOpen(true)}
    >
      {isInstalled ? (
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

  return (
    <>
      {isInstalled && tooltipText ? (
        <Tooltip>
          <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      ) : (
        buttonEl
      )}

      <InstallTargetModal
        skill={skill}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onComplete={handleComplete}
      />
    </>
  );
}
