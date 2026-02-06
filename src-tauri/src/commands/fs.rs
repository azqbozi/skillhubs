use std::collections::HashMap;
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

/// 各平台用于「检测 agent 是否存在」的父目录路径
fn platform_detection_path(platform: &str) -> Result<PathBuf, String> {
    match platform {
        "claude" => Ok(home_dir()?.join(".claude")),
        "antigravity" => Ok(home_dir()?.join(".gemini").join("antigravity")),
        "gemini" => Ok(home_dir()?.join(".gemini")),
        _ => Err("platform 仅支持 claude/antigravity/gemini".into()),
    }
}

/// 检测本机存在的 agent 平台（以目录存在为准）
#[tauri::command]
pub fn get_detected_platforms() -> Result<Vec<String>, String> {
    let platforms = PLATFORMS;
    let detected: Vec<String> = platforms
        .iter()
        .filter(|p| {
            platform_detection_path(*p)
                .map(|path| path.exists())
                .unwrap_or(false)
        })
        .map(|p| (*p).to_string())
        .collect();
    Ok(detected)
}

/// 获取全局 skills 目录（主路径，用于安装等）
pub(crate) fn skills_dir_for(platform: &str) -> Result<PathBuf, String> {
    match platform {
        "claude" => Ok(home_dir()?.join(".claude").join("skills")),
        "antigravity" => Ok(home_dir()?.join(".gemini").join("antigravity").join("skills")),
        "gemini" => Ok(home_dir()?.join(".gemini").join("skills")),
        _ => Err("platform 仅支持 claude/antigravity/gemini".into()),
    }
}

/// 获取项目级 skills 目录
pub(crate) fn skills_dir_for_project(platform: &str, project_root: &Path) -> Result<PathBuf, String> {
    let sub_dir = match platform {
        "claude" => ".claude/skills",
        "antigravity" => ".agent/skills",
        "gemini" => ".gemini/skills",
        _ => return Err("platform 仅支持 claude/antigravity/gemini".into()),
    };
    Ok(project_root.join(sub_dir))
}

/// 校验路径是否在合法的 skills 目录下
fn is_valid_skills_path(path: &Path) -> bool {
    let home = home_dir().ok();
    if let Some(home_path) = &home {
        if path.starts_with(home_path) {
            return true;
        }
    }
    PLATFORMS.iter().any(|p| {
        if let Ok(global_dir) = skills_dir_for(p) {
            if let Ok(global_canonical) = global_dir.canonicalize() {
                if let Ok(path_canonical) = path.canonicalize() {
                    return path_canonical.starts_with(&global_canonical) ||
                           path_canonical.starts_with(&global_canonical.join(".."));
                }
            }
        }
        false
    })
}

const PLATFORMS: &[&str] = &["claude", "antigravity", "gemini"];

/// 批量获取各 skill 在哪些平台已安装（skill_id -> [platform, ...]）
#[tauri::command]
pub fn get_installed_platforms_for_skills(ids: Vec<String>) -> Result<HashMap<String, Vec<String>>, String> {
    let mut result = HashMap::new();
    for id in ids {
        if id.trim().is_empty() {
            continue;
        }
        let mut platforms = Vec::new();
        for platform in PLATFORMS {
            if let Ok(dir) = skills_dir_for(platform) {
                if dir.join(&id).exists() {
                    platforms.push((*platform).to_string());
                }
            }
        }
        if !platforms.is_empty() {
            result.insert(id, platforms);
        }
    }
    Ok(result)
}

/// 获取在任意已检测平台中已安装的 skill ID 列表（用于发现页「已安装」展示）
#[tauri::command]
pub fn get_installed_skill_ids_anywhere() -> Result<Vec<String>, String> {
    let platforms = get_detected_platforms()?;
    let mut all_ids = std::collections::HashSet::new();
    for platform in &platforms {
        if let Ok(ids) = get_installed_skill_ids(platform.clone()) {
            all_ids.extend(ids);
        }
    }
    let mut ids: Vec<String> = all_ids.into_iter().collect();
    ids.sort();
    Ok(ids)
}

/// 获取本地已安装 skill 目录名列表（扫描各平台 skills 目录；支持符号链接）
#[tauri::command]
pub fn get_installed_skill_ids(platform: String) -> Result<Vec<String>, String> {
    let dir = skills_dir_for(platform.trim())?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let rd = fs::read_dir(&dir).map_err(|e| format!("读取目录失败 {}: {e}", dir.display()))?;
    let mut ids: Vec<String> = rd
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir()) // 使用 path.is_dir() 以支持符号链接
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

/// 获取本地已安装技能元数据（扫描目录 + 解析 SKILL.md；支持符号链接）
#[tauri::command]
pub fn get_installed_skills(platform: String) -> Result<Vec<InstalledSkillMeta>, String> {
    let dir = skills_dir_for(platform.trim())?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let rd = fs::read_dir(&dir).map_err(|e| format!("读取目录失败 {}: {e}", dir.display()))?;
    let mut out: Vec<InstalledSkillMeta> = vec![];

    for ent in rd.flatten() {
        let install_path = ent.path();
        if !install_path.is_dir() {
            continue; // 使用 path.is_dir() 以支持符号链接
        }
        let id = ent.file_name().to_string_lossy().to_string();
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

    out.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(out)
}

/// 卸载 skill：删除指定路径的 skill 目录
#[tauri::command]
pub fn uninstall_skill(skill_id: String, install_path: String) -> Result<(), String> {
    if skill_id.trim().is_empty() {
        return Err("skill_id 不能为空".into());
    }
    if install_path.trim().is_empty() {
        return Err("install_path 不能为空".into());
    }

    let path = PathBuf::from(&install_path);
    if !path.exists() {
        return Err("安装路径不存在，可能已被删除".into());
    }

    // 校验路径安全
    if !is_valid_skills_path(&path) {
        return Err("路径不在合法的 skills 目录下".into());
    }

    // 防止误删：路径必须以 skill_id 结尾
    if path.file_name().map(|n| n.to_string_lossy() != skill_id).unwrap_or(true) {
        return Err("路径与 skill_id 不匹配".into());
    }

    fs::remove_dir_all(&path)
        .map_err(|e| format!("删除目录失败: {}", e))?;

    Ok(())
}
