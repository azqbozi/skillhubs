# Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Tauri v2 + React 18 + TypeScript project with Tailwind CSS and shadcn/ui, ready for feature development.

**Architecture:** Initialize a standard Tauri desktop project with Vite + React + TypeScript frontend and Rust backend. Configure Tailwind CSS for styling and install shadcn/ui components. Create the directory structure for components, pages, hooks, lib, and types.

**Tech Stack:** Tauri v2, React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Lucide React

---

## Tasks

### Task 1: Create Tauri project with Vite + React + TypeScript

**Files:**
- Create: `.worktrees/foundation/package.json`
- Create: `.worktrees/foundation/vite.config.ts`
- Create: `.worktrees/foundation/tsconfig.json`
- Create: `.worktrees/foundation/index.html`
- Create: `.worktrees/foundation/src/main.tsx`
- Create: `.worktrees/foundation/src/App.tsx`
- Create: `.worktrees/foundation/src/App.css`

**Step 1: Create package.json**

```json
{
  "name": "skillhub",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.1",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}
```

**Step 2: Run npm install**

```bash
cd .worktrees/foundation && npm install
```

**Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 5: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SkillHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Create src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 8: Create src/App.tsx**

```typescript
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold">SkillHub</h1>
    </div>
  )
}

export default App
```

**Step 9: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

**Step 10: Commit**

```bash
cd .worktrees/foundation && git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html src/ && git commit -m "feat: Initialize Vite + React + TypeScript project"
```

---

### Task 2: Configure Tailwind CSS

**Files:**
- Create: `.worktrees/foundation/tailwind.config.js`
- Create: `.worktrees/foundation/postcss.config.js`
- Modify: `.worktrees/foundation/src/index.css`

**Step 1: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
    },
  },
  plugins: [],
}
```

**Step 2: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Step 3: Update src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 4: Run dev server to verify**

```bash
cd .worktrees/foundation && npm run dev
```

Expected: Vite dev server starts on port 5173

**Step 5: Commit**

```bash
cd .worktrees/foundation && git add tailwind.config.js postcss.config.js src/index.css && git commit -m "feat: Configure Tailwind CSS with shadcn/ui design system"
```

---

### Task 3: Install shadcn/ui utility components

**Files:**
- Create: `.worktrees/foundation/src/lib/utils.ts`
- Create: `.worktrees/foundation/src/components/ui/button.tsx`
- Create: `.worktrees/foundation/src/components/ui/card.tsx`
- Create: `.worktrees/foundation/src/components/ui/badge.tsx`

**Step 1: Create src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: Create src/components/ui/button.tsx**

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Step 3: Create src/components/ui/card.tsx**

```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Step 4: Create src/components/ui/badge.tsx**

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

**Step 5: Add dependencies and install**

```bash
cd .worktrees/foundation && npm install @radix-ui/react-slot class-variance-authority
```

**Step 6: Commit**

```bash
cd .worktrees/foundation && git add src/lib/utils.ts src/components/ui/ && git commit -m "feat: Add shadcn/ui utility components (Button, Card, Badge)"
```

---

### Task 4: Create project directory structure

**Files:**
- Create: `.worktrees/foundation/src/components/SkillCard.tsx`
- Create: `.worktrees/foundation/src/components/InstallButton.tsx`
- Create: `.worktrees/foundation/src/pages/Discover.tsx`
- Create: `.worktrees/foundation/src/pages/MySkills.tsx`
- Create: `.worktrees/foundation/src/pages/Settings.tsx`
- Create: `.worktrees/foundation/src/hooks/useSkills.ts`
- Create: `.worktrees/foundation/src/hooks/useInstall.ts`
- Create: `.worktrees/foundation/src/types/skill.ts`
- Create: `.worktrees/foundation/src/store/useStore.ts`
- Create: `.worktrees/foundation/src/lib/db.ts`
- Create: `.worktrees/foundation/src/lib/git.ts`

**Step 1: Create empty placeholder files**

```bash
cd .worktrees/foundation/src && \
mkdir -p components pages hooks lib types store && \
touch components/SkillCard.tsx components/InstallButton.tsx && \
touch pages/Discover.tsx pages/MySkills.tsx pages/Settings.tsx && \
touch hooks/useSkills.ts hooks/useInstall.ts && \
touch types/skill.ts store/useStore.ts lib/db.ts lib/git.ts
```

**Step 2: Create placeholder content for types/skill.ts**

```typescript
export interface Skill {
  id: string
  name: string
  repo: string
  subPath?: string
  description: string
  category: string
  tags: string[]
  platforms: ('claude' | 'cursor')[]
  stars: number
  install_mode: 'sparse' | 'full'
  author: string
}

export interface InstalledSkill {
  id: string
  install_path: string
  version?: string
  installed_at: string
  is_active: boolean
  use_count: number
}

export interface Conflict {
  trigger: string
  skills: string[]
}
```

**Step 3: Create placeholder content for store/useStore.ts**

```typescript
import { create } from 'zustand'
import type { Skill, InstalledSkill, Conflict } from '@/types'

interface AppState {
  skills: Skill[]
  installedSkills: InstalledSkill[]
  conflicts: Conflict[]
  selectedPlatform: 'claude' | 'cursor'
  searchQuery: string
  selectedCategory: string | null
  isLoading: boolean

  fetchSkills: () => Promise<void>
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedPlatform: (platform: 'claude' | 'cursor') => void
}

export const useStore = create<AppState>((set) => ({
  skills: [],
  installedSkills: [],
  conflicts: [],
  selectedPlatform: 'claude',
  searchQuery: '',
  selectedCategory: null,
  isLoading: false,

  fetchSkills: async () => {
    set({ isLoading: true })
    // TODO: Implement
    set({ isLoading: false })
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedPlatform: (selectedPlatform) => set({ selectedPlatform }),
}))
```

**Step 4: Commit**

```bash
cd .worktrees/foundation && git add src/components/ src/pages/ src/hooks/ src/types/ src/store/ src/lib/ && git commit -m "feat: Create project directory structure with placeholder files"
```

---

### Task 5: Create Tauri configuration and Rust backend structure

**Files:**
- Create: `.worktrees/foundation/src-tauri/Cargo.toml`
- Create: `.worktrees/foundation/src-tauri/tauri.conf.json`
- Create: `.worktrees/foundation/src-tauri/src/main.rs`
- Create: `.worktrees/foundation/src-tauri/src/lib.rs`
- Create: `.worktrees/foundation/src-tauri/src/commands/mod.rs`
- Create: `.worktrees/foundation/src-tauri/src/commands/git.rs`
- Create: `.worktrees/foundation/src-tauri/src/commands/fs.rs`
- Create: `.worktrees/foundation/src-tauri/src/commands/db.rs`
- Create: `.worktrees/foundation/src-tauri/src/models/mod.rs`
- Create: `.worktrees/foundation/src-tauri/src/models/skill.rs`

**Step 1: Create src-tauri/Cargo.toml**

```toml
[package]
name = "skillhub"
version = "0.1.0"
description = "AI Skills Manager for Claude Code and Cursor"
authors = ["you@example.com"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["shell-open"] }
tauri-sql = { version = "2", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "z"
strip = true
```

**Step 2: Create src-tauri/tauri.conf.json**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "skillhub",
  "version": "0.1.0",
  "identifier": "com.skillhub.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "SkillHub",
        "width": 900,
        "height": 700,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Step 3: Create src-tauri/src/main.rs**

```#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

**Step 4: Create src-tauri/src/lib.rs**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 5: Create placeholder modules**

```bash
cd .worktrees/foundation/src-tauri/src && \
mkdir -p commands models && \
echo "pub mod git;" > commands/mod.rs && \
echo "pub mod fs;" >> commands/mod.rs && \
echo "pub mod db;" >> commands/mod.rs && \
echo "" >> commands/mod.rs && \
echo "pub use commands::git::*;" && \
echo "pub use commands::fs::*;" && \
echo "pub use commands::db::*;" && \
touch commands/git.rs commands/fs.rs commands/db.rs && \
touch models/mod.rs models/skill.rs
```

**Step 6: Create src-tauri/build.rs**

```rust
fn main() {
    tauri_build::build()
}
```

**Step 7: Commit**

```bash
cd .worktrees/foundation && git add src-tauri/ && git commit -m "feat: Add Tauri configuration and Rust backend structure"
```

---

### Task 6: Add npm scripts for Tauri commands

**Files:**
- Modify: `.worktrees/foundation/package.json`

**Step 1: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  }
}
```

**Step 2: Commit**

```bash
cd .worktrees/foundation && git add package.json && git commit -m "chore: Add tauri npm script"
```

---

### Task 7: Create registry.json with sample skills

**Files:**
- Create: `.worktrees/foundation/src-tauri/assets/registry.json`

**Step 1: Create registry.json**

```json
{
  "version": "2.0",
  "skills": [
    {
      "id": "react-performance-expert",
      "name": "React Performance Expert",
      "repo": "vercel-labs/agent-skills",
      "subPath": "react-best-practices",
      "description": "React性能优化专家，帮助优化React应用的性能和用户体验",
      "category": "前端开发",
      "tags": ["react", "nextjs", "performance"],
      "platforms": ["claude", "cursor"],
      "stars": 2100,
      "install_mode": "sparse",
      "author": "vercel-labs"
    },
    {
      "id": "python-data-analysis",
      "name": "Python Data Analysis",
      "repo": "vercel-labs/agent-skills",
      "subPath": "python-data-analysis",
      "description": "Python数据分析助手，支持pandas、numpy、matplotlib",
      "category": "数据分析",
      "tags": ["python", "pandas", "data"],
      "platforms": ["claude", "cursor"],
      "stars": 1800,
      "install_mode": "sparse",
      "author": "vercel-labs"
    },
    {
      "id": "go-microservices",
      "name": "Go Microservices",
      "repo": "vercel-labs/agent-skills",
      "subPath": "go-microservices",
      "description": "Go微服务开发专家，专注于Go语言微服务架构",
      "category": "后端开发",
      "tags": ["go", "microservices", "grpc"],
      "platforms": ["claude", "cursor"],
      "stars": 1500,
      "install_mode": "sparse",
      "author": "vercel-labs"
    },
    {
      "id": "rust-system-programming",
      "name": "Rust System Programming",
      "repo": "vercel-labs/agent-skills",
      "subPath": "rust-system",
      "description": "Rust系统编程专家，适合底层开发和高性能应用",
      "category": "系统开发",
      "tags": ["rust", "systems", "performance"],
      "platforms": ["claude", "cursor"],
      "stars": 2200,
      "install_mode": "sparse",
      "author": "vercel-labs"
    },
    {
      "id": "docker-devops",
      "name": "Docker DevOps",
      "repo": "vercel-labs/agent-skills",
      "subPath": "docker-devops",
      "description": "Docker和DevOps工具专家，支持容器化和CI/CD",
      "category": "DevOps",
      "tags": ["docker", "kubernetes", "ci-cd"],
      "platforms": ["claude", "cursor"],
      "stars": 1900,
      "install_mode": "sparse",
      "author": "vercel-labs"
    }
  ]
}
```

**Step 2: Commit**

```bash
cd .worktrees/foundation && git add src-tauri/assets/registry.json && git commit -m "feat: Add sample registry.json with 5 skills"
```

---

### Task 8: Verify project builds successfully

**Step 1: Run build**

```bash
cd .worktrees/foundation && npm run build
```

Expected: Build completes without errors

**Step 2: Verify file structure**

```bash
cd .worktrees/foundation && find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" | head -30
```

Expected output shows all created files

**Step 3: Commit**

```bash
cd .worktrees/foundation && git status && git commit --allow-empty -m "chore: Verify project builds successfully"
```

---

## Plan Complete

Foundation implementation plan saved to `docs/plans/2026-02-04-foundation-plan.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
