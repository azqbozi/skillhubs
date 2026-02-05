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

/// 安装 Skill 到本地：优先 npx skills add，失败则回退到 git sparse checkout
#[tauri::command]
pub async fn install_skill(payload: InstallSkillPayload) -> Result<String, String> {
    git::install_skill_impl(payload).await
}
