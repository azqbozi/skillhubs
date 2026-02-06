# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillHub is a cross-platform desktop application for managing AI assistant Skills (Claude Code, Cursor, Antigravity, Gemini CLI). It's a Tauri v2 desktop app with Rust backend and React 18 + TypeScript frontend.

## Build Commands

```bash
# Development
npm run tauri dev          # Run app in development mode (requires Rust)
npm run dev                # Frontend dev server only (Vite on port 5173)

# Production
npm run tauri build        # Build production binary
npm run build              # Build frontend only
npm run preview            # Preview production build
```

## Tech Stack

- **Backend**: Rust + Tauri v2 + tauri-plugin-sql (SQLite)
- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS v4 + shadcn/ui patterns
- **State**: Zustand
- **Icons**: Lucide React
- **Notifications**: sonner

## Architecture

### Frontend Structure (`src/`)

```
src/
├── components/     # UI components (SkillCard, InstallButton, etc.)
│   └── ui/        # shadcn/ui base components (Button, Card, Badge, etc.)
├── pages/         # Route pages (Discover, MySkills, Settings)
├── hooks/         # Custom hooks (useSkills, useInstall, useSkillsFromAPI)
├── lib/           # Utilities (db.ts, git.ts, utils.ts, skillsCache.ts, skillDetail.ts)
├── store/         # Zustand store (useStore.ts)
└── types/         # TypeScript interfaces (skill.ts)
```

### Backend Structure (`src-tauri/src/`)

```
src-tauri/src/
├── lib.rs         # Tauri entry point with SQL plugin registration
├── commands/      # Tauri IPC commands
│   ├── mod.rs    # Command exports (install_skill, get_installed_skills, etc.)
│   ├── git.rs    # Git operations (install_skill_impl with npx/git fallback)
│   ├── fs.rs     # File system operations (get_installed_skills, SKILL.md parsing)
│   └── db.rs     # Database operations
├── models/        # Rust data models
└── migrations/    # SQLite schema (1_create_tables.sql)
```

### Data Flow

```
Frontend (React) → Zustand Store → invoke() → Rust Backend → SQLite/Git
```

## Key Tauri Commands

All file system and git operations must go through Tauri commands for security:

| Command | Parameters | Description |
|---------|------------|-------------|
| `install_skill` | `{id, repo, sub_path?}` | Install skill via npx skills add (preferred) or git sparse checkout (fallback) |
| `get_installed_skills` | `{platform}` | List installed skills with SKILL.md metadata parsing |
| `get_installed_skill_ids` | `{platform}` | Get installed skill IDs only |

### InstallSkillPayload (Rust)

```rust
struct InstallSkillPayload {
    id: String,
    repo: String,
    sub_path: Option<String>,
}
```

## Data Structures

### TypeScript Interfaces (`src/types/skill.ts`)

```typescript
interface InstalledSkillMeta {
  id: string;
  name?: string | null;
  description?: string | null;
  tags: string[];
  install_path: string;
  skill_md_path?: string | null;
}
```

### SQLite Schema (`src-tauri/migrations/1_create_tables.sql`)

```sql
CREATE TABLE skills_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repo TEXT NOT NULL,
  sub_path TEXT,
  description TEXT,
  category TEXT,
  tags TEXT,
  platforms TEXT,
  stars INTEGER,
  install_mode TEXT,
  author TEXT
);

CREATE TABLE installed_skills (
  id TEXT PRIMARY KEY,
  install_path TEXT NOT NULL,
  version TEXT,
  installed_at TEXT,
  is_active INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  FOREIGN KEY (id) REFERENCES skills_registry(id)
);

CREATE TABLE skill_relations (
  skill_a_id TEXT,
  skill_b_id TEXT,
  conflict_type TEXT,
  PRIMARY KEY (skill_a_id, skill_b_id)
);
```

## Platform Paths

| Platform | Global Path |
|----------|-------------|
| Claude Code | `~/.claude/skills/` |
| Cursor | `~/.cursor/skills/` |
| Antigravity | `~/.gemini/antigravity/skills/` |
| Gemini CLI | `~/.gemini/skills/` |

## Important Notes

- **Installation strategy**: Prefer `npx skills add` (skills.sh CLI) with git sparse checkout fallback
- **SKILL.md parsing**: Backend parses YAML frontmatter with fallback to markdown heading/line extraction
- **Security**: Validate repo URLs and skill IDs to prevent command injection
- **Path handling**: Use `PathBuf` for cross-platform paths (Windows backslash vs POSIX forward slash)
- **Browser fallback**: Frontend checks `__TAURI__` in window to detect Tauri vs browser mode
