import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InstallButton } from './InstallButton';
import { SkillDetailModal } from './SkillDetailModal';
import type { RegistrySkill } from '@/data/registry';
import { Download, ExternalLink } from 'lucide-react';

interface SkillCardProps {
  skill: RegistrySkill;
  isInstalled?: boolean;
}

/**
 * Skill 展示卡片组件
 * 点击卡片打开详情弹窗
 */
export function SkillCard({ skill, isInstalled = false }: SkillCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <Card
        className="flex cursor-pointer flex-col overflow-hidden transition-shadow hover:shadow-md"
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{skill.name}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs text-muted-foreground">
            {skill.repo}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>{skill.stars.toLocaleString()} 安装</span>
            <span>·</span>
            <span>{skill.author}</span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2">
          {/* 安装按钮（阻止冒泡，避免触发卡片点击） */}
          <div onClick={(e) => e.stopPropagation()} className="flex-1">
            <InstallButton skill={skill} isInstalled={isInstalled} />
          </div>
          
          {/* 详情提示 */}
          <span className="flex items-center text-xs text-muted-foreground">
            详情
            <ExternalLink className="ml-1 h-3 w-3" />
          </span>
        </CardFooter>
      </Card>

      {/* 详情弹窗 */}
      <SkillDetailModal
        skill={skill}
        isInstalled={isInstalled}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
