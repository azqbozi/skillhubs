# Role: 资深全栈桌面应用开发工程师
# Target: 开发跨平台 AI Skills 管理桌面应用

## 1. 项目概述
开发一款名为 "SkillHub" 的桌面应用，用于管理 AI 编程助手（Claude Code、Cursor 等）的 Skills。类似 "App Store" + "本地管家" 的结合体。

核心功能：
- 📦 Skill 发现：展示热门 Skills 榜单（从 registry.json 读取）
- ⬇️ 一键安装：支持 Sparse Checkout（只下载子目录）和 Full Clone
- 🗂️ 本地管理：查看已安装 Skills、更新、卸载、启用/禁用
- ⚠️ 冲突检测：检测多个 Skill 指令冲突

## 2. 技术栈要求
- **框架**: Tauri v2 (Rust 后端) + React 18 (TypeScript 前端)
- **UI 库**: Tailwind CSS + shadcn/ui 组件库
- **状态管理**: Zustand 或 React Context
- **数据库**: SQLite (通过 Tauri SQL 插件)
- **图标**: Lucide React

## 3. 数据结构

### registry.json (内置数据源)
\`\`\`json
{
  "version": "2.0",
  "skills": [
    {
      "id": "react-performance-expert",
      "name": "React Performance Expert",
      "repo": "vercel-labs/agent-skills",
      "subPath": "react-best-practices",
      "description": "React性能优化专家",
      "category": "前端开发",
      "tags": ["react", "nextjs"],
      "platforms": ["claude", "cursor"],
      "stars": 2100,
      "install_mode": "sparse",
      "author": "vercel-labs"
    }
  ]
}
\`\`\`

### SQLite 表结构
1. **skills_registry**: 存储 registry.json 的数据（id, name, repo, subPath, stars...）
2. **installed_skills**: 本地已安装（id, install_path, version, installed_at, is_active, use_count）
3. **skill_relations**: 依赖关系（skill_a_id, skill_b_id, conflict_type）

## 4. 核心功能模块

### 模块 A: Skill 发现页 (Discover)
- 展示 Skills 卡片网格（名称、描述、⭐ 数量、分类标签）
- 分类筛选器（前端、后端、DevOps、文档等）
- 搜索框（实时过滤名称和描述）
- 点击卡片展开详情抽屉（显示完整 SKILL.md 预览）

### 模块 B: 安装系统 (Installer)
**关键逻辑**:
1. 判断 install_mode:
   - "sparse": 执行 sparse checkout
     \`\`\`bash
     git clone --filter=blob:none --no-checkout https://github.com/{repo}.git temp/
     cd temp && git sparse-checkout init --cone
     git sparse-checkout set {subPath}
     git checkout
     mv {subPath} ~/.claude/skills/{skill-id}
     \`\`\`
   - "full": 直接 clone 到技能目录

2. 多平台支持:
   - Claude Code: ~/.claude/skills/
   - Cursor: ~/.cursor/skills/ (全局) 或 ./.cursor/skills/ (项目级)

3. 安装后记录到 SQLite 的 installed_skills 表

### 模块 C: 本地管理页 (My Skills)
- 列表展示已安装 Skills（图标、名称、版本、最后更新时间）
- 操作按钮:
  - 启用/禁用（重命名文件夹或修改配置）
  - 检查更新（对比本地 commit hash 和远程最新）
  - 卸载（删除文件夹 + 清理数据库记录）
- 批量操作：一键更新全部（遍历执行 git pull）

### 模块 D: 冲突检测 (Conflict Detector)
- 扫描 ~/.claude/skills/ 下所有 SKILL.md
- 解析 frontmatter 中的 triggers/commands
- 检测重复指令（如两个 Skill 都定义了 /fix）
- UI 提示冲突，支持拖拽排序优先级

## 5. 项目文件结构
\`\`\`
src/
├── components/          # React 组件
│   ├── SkillCard.tsx   # 技能卡片
│   ├── InstallButton.tsx # 安装按钮（含进度）
│   ├── ConflictAlert.tsx # 冲突警告
│   └── ui/             # shadcn 基础组件
├── pages/
│   ├── Discover.tsx    # 发现页
│   ├── MySkills.tsx    # 我的技能页
│   └── Settings.tsx    # 设置页（平台路径配置）
├── hooks/
│   ├── useSkills.ts    # 操作 skills 数据
│   ├── useInstall.ts   # 安装逻辑
│   └── useGit.ts       # Git 操作封装
├── lib/
│   ├── db.ts           # SQLite 数据库操作
│   ├── git.ts          # Git 命令封装（调用 Tauri Command）
│   └── utils.ts        # 工具函数
└── types/
    └── skill.ts        # TypeScript 类型定义

src-tauri/
├── src/
│   ├── main.rs         # Tauri 入口
│   ├── commands/       # 前端可调用的 Rust 命令
│   │   ├── git.rs      # git clone/sparse checkout
│   │   ├── fs.rs       # 文件系统操作
│   │   └── db.rs       # 数据库操作
│   └── models/
│       └── skill.rs    # Rust 数据结构
\`\`\`

## 6. Tauri Commands (Rust 端需提供)

\`\`\`rust
// 安装 Skill（sparse 或 full）
#[tauri::command]
async fn install_skill(repo: String, sub_path: Option&lt;String&gt;, target_dir: String) -&gt; Result&lt;String, String&gt;;

// 获取已安装 Skills 列表
#[tauri::command]
fn get_installed_skills(platform: String) -&gt; Vec&lt;InstalledSkill&gt;;

// 检查更新（对比本地和远程 commit）
#[tauri::command]
async fn check_update(repo: String, local_path: String) -&gt; Result&lt;bool, String&gt;;

// 执行 git pull 更新
#[tauri::command]
async fn update_skill(local_path: String) -&gt; Result&lt;String, String&gt;;

// 卸载 Skill
#[tauri::command]
fn uninstall_skill(skill_id: String, platform: String) -&gt; Result&lt;(), String&gt;;

// 检测冲突（读取所有 SKILL.md 解析 triggers）
#[tauri::command]
fn detect_conflicts(platform: String) -&gt; Vec&lt;Conflict&gt;;
\`\`\`

## 7. UI/UX 设计要求

### 布局
- 左侧边栏导航：发现 / 我的技能 / 设置
- 右侧主内容区
- 顶部搜索栏 + 平台切换器（Claude/Cursor）

### 视觉
- 深色/浅色主题切换
- 卡片悬停效果（阴影 + 微上移）
- 安装进度条（克隆仓库时显示）
- Toast 通知（安装成功/失败提示）

## 8. 开发顺序 (MVP)

按以下顺序实现，每完成一个可独立测试：

1. **基础架构**: 搭建 Tauri + React 项目，配置 Tailwind 和 shadcn
2. **数据层**: 创建 SQLite 表，读取 registry.json 导入数据库
3. **发现页**: 展示 Skills 网格，分类筛选，搜索
4. **安装功能**: 实现 sparse checkout 逻辑，安装到 Claude 目录
5. **我的技能页**: 读取本地目录，展示已安装列表，卸载功能
6. **更新检查**: 对比 commit hash，实现更新按钮
7. **冲突检测**: 解析 SKILL.md frontmatter，检测重复 triggers
8. **设置页**: 配置不同平台的技能目录路径

## 9. 计划文档规范

- **计划文件位置**：所有实现计划、设计文档统一保存在 `docs/plans/` 目录下
- **命名约定**：`YYYY-MM-DD-描述.md` 或 `功能名-plan.md`（如 `skills-sh-integration-plan.md`）

## 10. 注意事项

- **Git 依赖**: 检查系统是否安装 Git，未安装提示用户
- **错误处理**: 网络失败、权限不足、磁盘空间满等情况的 UI 提示
- **路径处理**: Windows 使用反斜杠，macOS/Linux 使用正斜杠（使用 PathBuf 处理）
- **安全性**: 执行 Git 命令前验证 repo URL 格式，防止命令注入

## 11. 交付物要求

完成后应包含：
- 可运行的 Tauri 应用（npm run tauri dev 能启动）
- 内置 registry.json（包含 10+ 个热门 Skills）
- 安装向导（首次启动引导用户配置平台路径）
- README 文档（如何构建、打包、贡献 Skills）

开始开发，从第 1 步基础架构开始。有任何技术决策需要先与我确认。