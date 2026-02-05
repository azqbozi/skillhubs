use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

fn home_dir() -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("USERPROFILE") {
        if !p.trim().is_empty() {
            return Ok(PathBuf::from(p));
        }
    }
    if let Ok(p) = std::env::var("HOME") {
        if !p.trim().is_empty() {
            return Ok(PathBuf::from(p));
        }
    }
    Err("无法定位用户目录（USERPROFILE/HOME）".into())
}

fn skills_dir_for(platform: &str) -> Result<PathBuf, String> {
    match platform {
        "claude" => Ok(home_dir()?.join(".claude").join("skills")),
        "cursor" => Ok(home_dir()?.join(".cursor").join("skills")),
        _ => Err("platform 仅支持 claude/cursor".into()),
    }
}

/// 获取本地已安装 skill 目录名列表（扫描 ~/.claude/skills 或 ~/.cursor/skills）
#[tauri::command]
pub fn get_installed_skill_ids(platform: String) -> Result<Vec<String>, String> {
    let dir = skills_dir_for(platform.trim())?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let rd = fs::read_dir(&dir).map_err(|e| format!("读取目录失败 {}: {e}", dir.display()))?;
    let mut ids: Vec<String> = rd
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
        .collect();
    ids.sort();
    Ok(ids)
}

#[derive(Debug, Serialize)]
pub struct InstalledSkillMeta {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub install_path: String,
    pub skill_md_path: Option<String>,
}

fn find_skill_md(dir: &Path, max_depth: usize) -> Option<PathBuf> {
    let direct = dir.join("SKILL.md");
    if direct.exists() {
        return Some(direct);
    }
    if max_depth == 0 {
        return None;
    }
    let rd = fs::read_dir(dir).ok()?;
    for ent in rd.flatten() {
        let ft = ent.file_type().ok()?;
        if ft.is_dir() {
            if let Some(found) = find_skill_md(&ent.path(), max_depth - 1) {
                return Some(found);
            }
        }
    }
    None
}

fn parse_frontmatter(md: &str) -> (Option<String>, Option<String>, Vec<String>) {
    let md = md.replace("\r\n", "\n");
    if !md.starts_with("---\n") {
        return (None, None, vec![]);
    }
    let rest = &md["---\n".len()..];
    let end = rest.find("\n---");
    let Some(end_idx) = end else {
        return (None, None, vec![]);
    };
    let fm = &rest[..end_idx];

    let mut name: Option<String> = None;
    let mut desc: Option<String> = None;
    let mut tags: Vec<String> = vec![];

    for line in fm.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some(v) = line.strip_prefix("name:") {
            let v = v.trim().trim_matches('"').trim_matches('\'');
            if !v.is_empty() {
                name = Some(v.to_string());
            }
            continue;
        }
        if let Some(v) = line.strip_prefix("description:") {
            let v = v.trim().trim_matches('"').trim_matches('\'');
            if !v.is_empty() {
                desc = Some(v.to_string());
            }
            continue;
        }
        if let Some(v) = line.strip_prefix("tags:") {
            let raw = v.trim();
            // 支持 tags: [a, b] / tags: a,b / tags: a
            let cleaned = raw.trim_matches('[').trim_matches(']');
            let parts: Vec<&str> = cleaned
                .split(',')
                .map(|s| s.trim().trim_matches('"').trim_matches('\''))
                .filter(|s| !s.is_empty())
                .collect();
            if !parts.is_empty() {
                tags = parts.into_iter().map(|s| s.to_string()).collect();
            }
        }
    }

    (name, desc, tags)
}

fn parse_fallback(md: &str) -> (Option<String>, Option<String>) {
    let md = md.replace("\r\n", "\n");
    // 去掉 frontmatter（若存在）
    let body = if md.starts_with("---\n") {
        if let Some(end_idx) = md["---\n".len()..].find("\n---") {
            let after = &md["---\n".len() + end_idx + "\n---".len()..];
            after
        } else {
            md.as_str()
        }
    } else {
        md.as_str()
    };

    let mut name: Option<String> = None;
    let mut desc: Option<String> = None;

    for line in body.lines() {
        let t = line.trim();
        if t.starts_with("# ") {
            name = Some(t.trim_start_matches("# ").trim().to_string());
            continue;
        }
        if name.is_some() && desc.is_none() && !t.is_empty() && !t.starts_with('#') {
            desc = Some(t.to_string());
            break;
        }
    }

    (name, desc)
}

/// 获取本地已安装技能元数据（扫描目录 + 解析 SKILL.md）
#[tauri::command]
pub fn get_installed_skills(platform: String) -> Result<Vec<InstalledSkillMeta>, String> {
    let dir = skills_dir_for(platform.trim())?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let rd = fs::read_dir(&dir).map_err(|e| format!("读取目录失败 {}: {e}", dir.display()))?;
    let mut out: Vec<InstalledSkillMeta> = vec![];

    for ent in rd.flatten() {
        let ft = ent.file_type().ok();
        if ft.map(|t| t.is_dir()).unwrap_or(false) {
            let id = ent.file_name().to_string_lossy().to_string();
            let install_path = ent.path();
            let skill_md = find_skill_md(&install_path, 3);
            let mut name: Option<String> = None;
            let mut description: Option<String> = None;
            let mut tags: Vec<String> = vec![];

            if let Some(md_path) = &skill_md {
                if let Ok(content) = fs::read_to_string(md_path) {
                    let (n1, d1, t1) = parse_frontmatter(&content);
                    name = n1;
                    description = d1;
                    tags = t1;
                    if name.is_none() || description.is_none() {
                        let (n2, d2) = parse_fallback(&content);
                        if name.is_none() {
                            name = n2;
                        }
                        if description.is_none() {
                            description = d2;
                        }
                    }
                }
            }

            out.push(InstalledSkillMeta {
                id,
                name,
                description,
                tags,
                install_path: install_path.to_string_lossy().to_string(),
                skill_md_path: skill_md.map(|p| p.to_string_lossy().to_string()),
            });
        }
    }

    out.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(out)
}
