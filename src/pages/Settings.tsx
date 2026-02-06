import { PLATFORMS } from '@/store/useStore';

/**
 * 设置页 - 应用配置
 */
export function Settings() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">配置 SkillHub 应用</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-card/50 p-4 backdrop-blur-sm">
          <h3 className="font-medium">平台路径</h3>
          <div className="mt-3 space-y-2">
            {PLATFORMS.map((p) => (
              <div key={p.value} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground min-w-[100px]">{p.label}:</span>
                <code className="text-muted-foreground">{p.globalPath}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/50 p-4 backdrop-blur-sm">
          <h3 className="font-medium">关于</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            SkillHub v0.1.0 - AI 助手 Skills 管理工具
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            支持 Claude Code、Antigravity、Gemini CLI 的全局与项目级安装
          </p>
        </div>
      </div>
    </div>
  );
}
