-- Migration file for database setup
-- This file is used by tauri-sql to create initial tables

CREATE TABLE IF NOT EXISTS skills_registry (
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

CREATE TABLE IF NOT EXISTS installed_skills (
  id TEXT PRIMARY KEY,
  install_path TEXT NOT NULL,
  version TEXT,
  installed_at TEXT,
  is_active INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  FOREIGN KEY (id) REFERENCES skills_registry(id)
);

CREATE TABLE IF NOT EXISTS skill_relations (
  skill_a_id TEXT,
  skill_b_id TEXT,
  conflict_type TEXT,
  PRIMARY KEY (skill_a_id, skill_b_id)
);
