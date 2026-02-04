use tauri::Manager;

#[tauri::command]
async fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
