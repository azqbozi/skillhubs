# SkillHub Design Document

## Overview

SkillHub is a cross-platform desktop application for managing AI assistant Skills (Claude Code, Cursor, etc.). It provides a centralized interface for discovering, installing, and managing Skills with conflict detection capabilities.

## Architecture

### Overall Structure

```
┌─────────────────────────────────────────────────┐
│              React Frontend (src/)              │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Discover│  │My Skills│  │    Settings     │ │
│  └────┬────┘  └────┬────┘  └─────────────────┘ │
│       │            │                           │
│       └─────┬──────┘                           │
│             ▼                                  │
│       ┌─────────────┐                          │
│       │   Zustand   │                          │
│       │   Store     │                          │
│       └──────┬──────┘                          │
│              │ invoke                          │
│              ▼                                  │
│    ┌─────────────────────┐                     │
│    │  Tauri IPC Bridge   │                     │
│    └──────────┬──────────┘                     │
│               ▼                                │
│    ┌─────────────────────┐                     │
│    │  Rust Backend       │                     │
│    │  (src-tauri/src/)   │                     │
│    └─────────────────────┘                     │
└─────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Rust + Tauri v2
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Database**: SQLite (via Tauri SQL plugin)
- **Icons**: Lucide React

## Frontend Design

### Component Hierarchy

```
pages/
├── Discover.tsx        # Skills marketplace
├── MySkills.tsx        # Local management
└── Settings.tsx        # Configuration

components/
├── SkillCard.tsx       # Skill display card
├── InstallButton.tsx   # Install with progress
├── SkillDetail.tsx     # Detail drawer
├── ConflictAlert.tsx   # Conflict warning
├── PlatformSwitcher.tsx # Claude/Cursor toggle
├── SkillList.tsx       # Filterable list
└── BatchUpdateModal.tsx # Bulk update dialog

ui/                      # shadcn/ui components
```

### State Management (Zustand)

```typescript
interface AppState {
  // Data
  skills: Skill[]
  installedSkills: InstalledSkill[]
  conflicts: Conflict[]

  // UI State
  selectedPlatform: 'claude' | 'cursor'
  searchQuery: string
  selectedCategory: string | null
  isLoading: boolean

  // Actions
  fetchSkills: () => Promise<void>
  installSkill: (skillId: string) => Promise<void>
  uninstallSkill: (skillId: string) => Promise<void>
  checkUpdates: () => Promise<void>
  updateSkill: (skillId: string) => Promise<void>
  detectConflicts: () => Promise<void>
}
```

## Backend Design

### Tauri Commands

```rust
// git.rs - Git operations
#[tauri::command]
async fn install_skill(
    repo: String,
    sub_path: Option<String>,
    target_dir: String
) -> Result<String, String>

#[tauri::command]
async fn check_update(
    repo: String,
    local_path: String
) -> Result<bool, String>

#[tauri::command]
async fn update_skill(local_path: String) -> Result<String, String>

#[tauri::command]
fn get_remote_commit(repo: String) -> Result<String, String>

// fs.rs - File system operations
#[tauri::command]
fn read_skill_file(path: String) -> Result<String, String>

#[tauri::command]
fn get_installed_list(platform: String) -> Vec<InstalledSkill>

#[tauri::command]
fn toggle_skill(skill_id: String, platform: String) -> Result<(), String>

#[tauri::command]
fn uninstall_skill(skill_id: String, platform: String) -> Result<(), String>

// db.rs - Database operations
#[tauri::command]
fn init_db() -> Result<(), String>

#[tauri::command]
fn sync_registry() -> Result<usize, String>

#[tauri::command]
fn save_installed_skill(skill: InstalledSkill) -> Result<(), String>

#[tauri::command]
fn remove_installed_skill(skill_id: String) -> Result<(), String>

#[tauri::command]
fn detect_conflicts(platform: String) -> Vec<Conflict>
```

## Data Structures

### registry.json

```json
{
  "version": "2.0",
  "skills": [{
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
  }]
}
```

### SQLite Schema

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

## Data Flow

### Discover Page

```
User opens Discover
       │
       ▼
Zustand: fetchSkills() ──invoke──▶ Rust: get_registry_skills()
       │                                    │
       │         ◀────── Returns Skill[] ───┘
       ▼
Local filter/search in Zustand
       │
       ▼
Render SkillCard[]
```

### Installation Flow

```
User clicks InstallButton
       │
       ▼
Zustand: installSkill(skillId)
       │              │
       │    ──invoke──▶ Rust: install_skill(repo, subPath)
       │              │
       │              ▼
       │       1. Validate repo URL
       │       2. Execute git sparse-checkout
       │       3. Move to target directory
       │       4. Write to SQLite
       │              │
       │         ◀── Return progress/result ──
       │              │
       ▼              ▼
Update UI         Show Toast notification
```

## Error Handling

| Error Type | Handling | UI Feedback |
|------------|----------|-------------|
| Network timeout | Retry 3 times, then prompt | Toast: "Network timeout, please check connection" |
| Git not installed | Detect at startup | Modal: Guide to install Git |
| Permission denied | Check directory permissions | Toast: "Permission denied, run as administrator" |
| Disk full | Check available space | Toast: "Insufficient disk space" |
| Repo not exists | Validate URL format | Toast: "Repository not found" |

## Platform Paths

- **Claude Code**: `~/.claude/skills/`
- **Cursor (Global)**: `~/.cursor/skills/`
- **Cursor (Project)**: `./.cursor/skills/`

## Key Implementation Details

### Sparse Checkout

```bash
git clone --filter=blob:none --no-checkout https://github.com/{repo}.git temp/
cd temp && git sparse-checkout init --cone
git sparse-checkout set {subPath}
git checkout
mv {subPath} ~/.claude/skills/{skill-id}
```

### Conflict Detection

1. Scan `~/.claude/skills/` for all SKILL.md files
2. Parse frontmatter for triggers/commands
3. Detect duplicate triggers
4. Return conflicts with priority ordering

## Development Order (MVP)

1. **Foundation**: Initialize Tauri + React, configure Tailwind + shadcn
2. **Data Layer**: Create SQLite tables, import registry.json
3. **Discover Page**: Skills grid, filtering, search
4. **Installation**: Sparse checkout, install to Claude directory
5. **My Skills**: Read local directory, display list, uninstall
6. **Updates**: Compare commit hash, update button
7. **Conflict Detection**: Parse SKILL.md, detect duplicate triggers
8. **Settings**: Configure platform paths

## Security Considerations

- Validate all repo URLs before executing git commands
- Use `PathBuf` for cross-platform path handling
- Sanitize user inputs for SQL operations
- Check permissions before file operations
