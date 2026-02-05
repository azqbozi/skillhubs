pub mod commands;
pub mod models;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: include_str!("../migrations/1_create_tables.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:skills.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::install_skill,
            commands::fs::get_installed_skill_ids,
            commands::fs::get_installed_skills
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
