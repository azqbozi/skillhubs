/**
 * 设置页 - 应用配置
 */
export function Settings() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">配置 SkillHub 应用</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">平台路径</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Claude Code: ~/.claude/skills/
          </p>
          <p className="text-sm text-muted-foreground">
            Cursor: ~/.cursor/skills/
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">关于</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            SkillHub v0.1.0 - AI 助手 Skills 管理工具
          </p>
        </div>
      </div>
    </div>
  );
}
