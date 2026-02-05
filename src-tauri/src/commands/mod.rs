use serde::Deserialize;

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
}

/// 安装 Skill 到本地（当前为占位实现，实际 git 克隆待完善）
#[tauri::command]
pub async fn install_skill(payload: InstallSkillPayload) -> Result<String, String> {
    git::install_skill_impl(payload).await
}
