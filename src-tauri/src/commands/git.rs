use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::commands::InstallSkillPayload;
use crate::commands::fs::{get_detected_platforms, skills_dir_for, skills_dir_for_project};

/// 将 repo 标识转换为可用的 git URL。
///
/// 支持：
/// - `owner/repo`
/// - `https://github.com/owner/repo`
/// - `https://github.com/owner/repo.git`
fn normalize_repo_url(repo: &str) -> Result<String, String> {
    let repo = repo.trim();
    if repo.is_empty() {
        return Err("repo 不能为空".into());
    }

    // 简单防注入：禁止空格/控制字符/引号
    if repo.chars().any(|c| c.is_whitespace() || c == '"' || c == '\'') {
        return Err("repo 含非法字符".into());
    }

    if repo.starts_with("http://") || repo.starts_with("https://") {
        return Ok(repo.to_string());
    }

    // owner/repo
    let parts: Vec<&str> = repo.split('/').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
        return Err("repo 需为 owner/repo 或 https://github.com/owner/repo(.git)".into());
    }

    Ok(format!("https://github.com/{}.git", repo))
}

fn unique_temp_dir(prefix: &str) -> PathBuf {
    let mut p = std::env::temp_dir();
    let pid = std::process::id();
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    p.push(format!("{}_{}_{}", prefix, pid, ts));
    p
}

fn run_git(args: &[&str], cwd: Option<&Path>) -> Result<(), String> {
    let mut cmd = Command::new("git");
    cmd.args(args);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let out = cmd.output().map_err(|e| format!("git 执行失败: {e}"))?;
    if out.status.success() {
        return Ok(());
    }
    let stdout = String::from_utf8_lossy(&out.stdout);
    let stderr = String::from_utf8_lossy(&out.stderr);
    Err(format!(
        "git 命令失败: git {}\nstdout:\n{}\nstderr:\n{}",
        args.join(" "),
        stdout,
        stderr
    ))
}

fn ensure_dir(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| format!("创建目录失败 {}: {e}", path.display()))
}

fn remove_dir_if_exists(path: &Path) {
    let _ = fs::remove_dir_all(path);
}

/// 校验 skill_id 安全（防注入）
fn validate_skill_id(id: &str) -> Result<(), String> {
    let id = id.trim();
    if id.is_empty() {
        return Err("skill id 不能为空".into());
    }
    if id.chars().any(|c| c.is_whitespace() || c == '/' || c == '\\' || c == '"' || c == '\'') {
        return Err("skill id 含非法字符".into());
    }
    Ok(())
}

/// 将 SkillHub 平台映射为 skills CLI 的 --agent 参数
fn platform_to_agent(platform: &str) -> &'static str {
    match platform.trim().to_lowercase().as_str() {
        "claude" => "claude-code",
        "antigravity" => "antigravity",
        "gemini" => "gemini-cli",
        _ => "claude-code",
    }
}

/// 通过 npx skills add 安装（优先方案，适配 skills.sh 官方 CLI）
/// - agent: skills CLI 的 --agent（如 claude-code, cursor, antigravity, gemini-cli）
/// - is_global: true 用 -g 安装到用户目录，false 安装到项目
/// - cwd: 项目安装时的当前工作目录
fn run_npx_skills_add(
    repo: &str,
    skill_id: &str,
    agent: &str,
    is_global: bool,
    cwd: Option<&Path>,
) -> Result<(), String> {
    let repo_url = if repo.starts_with("http://") || repo.starts_with("https://") {
        repo.to_string()
    } else {
        format!("https://github.com/{}", repo.trim().trim_end_matches(".git"))
    };

    let mut npx_args = vec![
        "--yes",
        "skills",
        "add",
        &repo_url,
        "--skill",
        skill_id,
        "-a",
        agent,
        "-y",
    ];
    if is_global {
        npx_args.push("-g");
    }

    // Windows 下 npx 是 npx.cmd 批处理，Rust Command 无法直接执行，需通过 cmd /c 调用
    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "npx"]);
        c.args(&npx_args);
        c
    } else {
        let mut c = Command::new("npx");
        c.args(&npx_args);
        c
    };
    cmd.env("DISABLE_TELEMETRY", "1");
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }

    let out = cmd.output().map_err(|e| format!("执行 npx 失败（请确保已安装 Node.js）: {e}"))?;

    if out.status.success() {
        return Ok(());
    }
    let stderr = String::from_utf8_lossy(&out.stderr);
    let stdout = String::from_utf8_lossy(&out.stdout);
    Err(format!(
        "npx skills add 失败:\n{}{}",
        if !stdout.is_empty() {
            format!("stdout:\n{stdout}\n")
        } else {
            String::new()
        },
        if !stderr.is_empty() {
            format!("stderr:\n{stderr}")
        } else {
            "无详细信息".to_string()
        }
    ))
}

/// 检查 npx 是否可用（Windows 下通过 cmd /c 调用）
fn npx_available() -> bool {
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/c", "npx", "--version"])
            .output()
    } else {
        Command::new("npx")
            .arg("--version")
            .output()
    };
    result.map(|o| o.status.success()).unwrap_or(false)
}

/// 实际安装逻辑（供 commands/mod.rs 的 tauri::command 包装调用）
pub async fn install_skill_impl(payload: InstallSkillPayload) -> Result<String, String> {
    validate_skill_id(&payload.id)?;
    let url = normalize_repo_url(&payload.repo)?;

    // 确定目标目录
    let target_dir: PathBuf = if let Some(project_root) = payload.project_root.as_ref().filter(|p| !p.trim().is_empty()) {
        let platform = payload.target_platform.as_deref().unwrap_or("claude");
        skills_dir_for_project(platform, Path::new(project_root))?.join(&payload.id)
    } else {
        let platform = payload.target_platform.as_deref().unwrap_or("claude");
        skills_dir_for(platform)?.join(&payload.id)
    };

    ensure_dir(&target_dir.parent().unwrap_or(&PathBuf::new()))?;

    if target_dir.exists() {
        return Err(format!("已存在同名目录，疑似已安装: {}", target_dir.display()));
    }

    let skill_id = payload.sub_path.as_deref().unwrap_or(&payload.id).trim();
    if skill_id.is_empty() {
        return Err("无法确定 skill 名称".into());
    }
    validate_skill_id(skill_id)?;

    let is_global = payload.project_root.is_none();
    let platform = payload.target_platform.as_deref().unwrap_or("claude");
    let agent = platform_to_agent(platform);
    let cwd = payload
        .project_root
        .as_ref()
        .filter(|p| !p.trim().is_empty())
        .map(|p| Path::new(p));

    // 优先使用 npx skills add；成功后校验 target_dir 是否存在，不存在则 git 回退
    if npx_available() {
        match run_npx_skills_add(&payload.repo, skill_id, agent, is_global, cwd.as_deref()) {
            Ok(()) => {
                if target_dir.exists() {
                    return Ok(format!("安装完成: {}", target_dir.display()));
                }
                // npx 返回成功但目标路径不存在（如 gemini-cli 装到 .agent/skills），回退 git
            }
            Err(e) => return Err(e),
        }
    }

    // npx 不可用或 npx 成功但未安装到预期路径时，回退到 git sparse checkout
    let tmp = unique_temp_dir("skillhub_clone");
    remove_dir_if_exists(&tmp);
    let tmp_path = tmp.to_string_lossy().to_string();
    let target_path = target_dir.to_string_lossy().to_string();

    // 避免残留：任何失败都清理 tmp
    let result = (|| {
        if let Some(sub_path) = payload.sub_path.as_deref().filter(|s| !s.trim().is_empty()) {
            // sparse checkout 到 tmp
            run_git(
                &["clone", "--filter=blob:none", "--no-checkout", &url, &tmp_path],
                None,
            )?;
            run_git(&["sparse-checkout", "init", "--cone"], Some(&tmp))?;
            run_git(&["sparse-checkout", "set", sub_path], Some(&tmp))?;
            run_git(&["checkout"], Some(&tmp))?;

            // git sparse-checkout set 即使路径不存在也可能不报错，因此这里做二次校验/回退
            let mut src_rel = sub_path.to_string();
            let mut src = tmp.join(&src_rel);
            if !src.exists() {
                // 常见情况：真实目录在 skills/<sub_path>
                let trimmed = src_rel.trim().trim_start_matches("./").trim_start_matches("skills/").to_string();
                let alt = format!("skills/{}", trimmed);
                run_git(&["sparse-checkout", "set", &alt], Some(&tmp))?;
                run_git(&["checkout"], Some(&tmp))?;
                src_rel = alt;
                src = tmp.join(&src_rel);
            }

            if !src.exists() {
                // 输出更友好的提示：列出 skills 下可用目录（如果存在）
                let skills_dir = tmp.join("skills");
                let mut hint = String::new();
                if skills_dir.exists() {
                    if let Ok(read) = fs::read_dir(&skills_dir) {
                        let mut names: Vec<String> = read
                            .filter_map(|e| e.ok())
                            .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                            .filter_map(|e| e.file_name().to_str().map(|s| s.to_string()))
                            .collect();
                        names.sort();
                        if !names.is_empty() {
                            hint = format!("可用 skills 子目录示例: {}", names.into_iter().take(12).collect::<Vec<_>>().join(", "));
                        }
                    }
                }
                return Err(format!(
                    "稀疏检出目录不存在: {}（请求 subPath='{}'）。{}",
                    src.display(),
                    sub_path,
                    hint
                ));
            }
            // move 子目录到 skills/{id}
            fs::rename(&src, &target_dir).map_err(|e| {
                format!(
                    "移动安装目录失败: {} -> {}: {e}",
                    src.display(),
                    target_dir.display()
                )
            })?;
        } else {
            // 完整 clone 到目标目录
            run_git(&["clone", &url, &target_path], None)?;
        }

        Ok::<(), String>(())
    })();

    // 清理 tmp（无论成功失败）
    remove_dir_if_exists(&tmp);

    result?;

    Ok(format!("安装完成: {}", target_dir.display()))
}

/// 一键安装到所有已检测到的平台（仅全局，跳过已安装）
pub async fn install_skill_to_all_platforms_impl(
    payload: InstallSkillPayload,
) -> Result<crate::commands::InstallAllResult, String> {
    validate_skill_id(&payload.id)?;

    let platforms = get_detected_platforms()?;
    if platforms.is_empty() {
        return Err("未检测到任何 agent 平台（请确保已安装 Claude Code、Antigravity 或 Gemini CLI）".into());
    }

    let mut installed = Vec::new();
    let mut skipped = Vec::new();

    for platform in &platforms {
        let skills_dir = skills_dir_for(platform)?;
        let skill_path = skills_dir.join(&payload.id);
        if skill_path.exists() {
            skipped.push(platform.clone());
            continue;
        }

        let p = InstallSkillPayload {
            id: payload.id.clone(),
            repo: payload.repo.clone(),
            sub_path: payload.sub_path.clone(),
            target_platform: Some(platform.clone()),
            project_root: None,
        };
        match install_skill_impl(p).await {
            Ok(_) => installed.push(platform.clone()),
            Err(e) => return Err(e),
        }
    }

    Ok(crate::commands::InstallAllResult { installed, skipped })
}
