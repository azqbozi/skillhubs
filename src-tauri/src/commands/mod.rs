use serde::{Deserialize, Serialize};

pub mod db;
pub mod fs;
pub mod git;

#[tauri::command]
pub async fn greet(name: &str) -> Result<String, String> {
    Ok(format!("Hello, {}!", name))
}

#[derive(Debug, Deserialize)]
pub struct InstallSkillPayload {
    pub id: String,
    pub repo: String,
    pub sub_path: Option<String>,
    /// 目标平台 (claude/cursor/antigravity/gemini)，默认 claude
    pub target_platform: Option<String>,
    /// 项目根目录（可选），如有则安装到项目级路径
    pub project_root: Option<String>,
}

/// 一键安装结果
#[derive(Debug, Serialize)]
pub struct InstallAllResult {
    pub installed: Vec<String>,
    pub skipped: Vec<String>,
}

/// 安装 Skill 到本地：优先 npx skills add，失败则回退到 git sparse checkout
#[tauri::command]
pub async fn install_skill(payload: InstallSkillPayload) -> Result<String, String> {
    git::install_skill_impl(payload).await
}

/// 一键安装到所有已检测到的平台（仅全局）
#[tauri::command]
pub async fn install_skill_to_all_platforms(payload: InstallSkillPayload) -> Result<InstallAllResult, String> {
    git::install_skill_to_all_platforms_impl(payload).await
}
