# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillHub is a cross-platform desktop application for managing AI assistant Skills (Claude Code, Cursor, etc.). It's a Tauri v2 desktop app with Rust backend and React 18 + TypeScript frontend.

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

- **Backend**: Rust + Tauri v2 + SQLite (tauri-sql)
- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS v4 + shadcn/ui patterns
- **State**: Zustand
- **Icons**: Lucide React

## Architecture

### Frontend Structure (`src/`)

```
src/
├── components/     # UI components (SkillCard, InstallButton, etc.)
│   └── ui/        # shadcn/ui base components (Button, Card, Badge)
├── pages/         # Route pages (Discover, MySkills, Settings)
├── hooks/         # Custom hooks (useSkills, useInstall)
├── lib/           # Utilities (db.ts, git.ts, utils.ts)
├── store/         # Zustand store (useStore.ts)
└── types/         # TypeScript interfaces
```

### Backend Structure (`src-tauri/src/`)

```
src-tauri/src/
├── main.rs         # Tauri entry point with SQL plugin
├── lib.rs          # Module exports (commands, models)
├── commands/      # Tauri IPC commands
│   └── mod.rs     # Greet command (template)
├── models/        # Rust data models
└── migrations/     # SQLite schema
```

### Data Flow

```
Frontend (React) → Zustand Store → invoke() → Rust Backend → SQLite/Git
```

## Key Tauri Commands (Rust)

All file system and git operations must go through Tauri commands for security:

- `install_skill(repo, sub_path, target_dir)` - Sparse or full clone
- `get_installed_skills(platform)` - List installed skills
- `check_update(repo, local_path)` - Compare commit hashes
- `update_skill(local_path)` - Git pull
- `uninstall_skill(skill_id, platform)` - Remove skill
- `detect_conflicts(platform)` - Parse SKILL.md for duplicate triggers

## Data Structures

### TypeScript Interfaces (`src/types/skill.ts`)

```typescript
interface Skill {
  id: string;
  name: string;
  repo: string;
  subPath?: string;
  description: string;
  category: string;
  tags: string[];
  platforms: ('claude' | 'cursor')[];
  stars: number;
  install_mode: 'sparse' | 'full';
  author: string;
}

interface InstalledSkill extends Skill {
  install_path: string;
  version?: string;
  installed_at: string;
  is_active: boolean;
  use_count: number;
}

interface Conflict {
  trigger: string;
  skills: string[];
}
```

### registry.json (`src-tauri/assets/registry.json`)

```json
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

## Implementation Status

| Component | Status |
|-----------|--------|
| Project scaffolding | Done |
| Tailwind CSS v4 + shadcn/ui | Done |
| Zustand store | Done |
| SQLite schema | Done |
| Tauri backend skeleton | Done |
| Page components | Stubs |
| Hook implementations | Not started |
| Tauri commands | Stubs |
| Discover page | Not started |
| My Skills page | Not started |

## Important Notes

- **Platform paths**: Claude Code (`~/.claude/skills/`), Cursor (`~/.cursor/skills/` or `./.cursor/skills/`)
- **Sparse checkout**: Use `--filter=blob:none --no-checkout` for efficient partial clones
- **Path handling**: Use `PathBuf` for cross-platform paths (Windows backslash vs POSIX forward slash)
- **Security**: Validate all repo URLs before executing git commands to prevent injection
