// Migration file for database setup
// This file is used by tauri-sql to create initial tables

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    proficiency INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);
