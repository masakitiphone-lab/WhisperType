use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle,
};

const TRAY_QUIT_ID: &str = "quit";
const TRAY_SHOW_ID: &str = "show";
const TRAY_SETTINGS_ID: &str = "settings";
const TRAY_QUIT_LABEL: &str = "Quit";
const TRAY_SHOW_LABEL: &str = "Show Window";
const TRAY_SETTINGS_LABEL: &str = "Settings";

pub fn setup_tray_clean<FShowMain, FShowSettings, FToggleMain>(
    app: &AppHandle,
    show_main_window: FShowMain,
    show_settings_window: FShowSettings,
    toggle_main_window_visibility: FToggleMain,
) -> Result<(), Box<dyn std::error::Error>>
where
    FShowMain: Fn(&AppHandle) + Send + Sync + 'static,
    FShowSettings: Fn(AppHandle) + Send + Sync + 'static,
    FToggleMain: Fn(&AppHandle) + Send + Sync + 'static,
{
    let quit_i = MenuItem::with_id(app, TRAY_QUIT_ID, TRAY_QUIT_LABEL, true, None::<&str>)?;
    let show_i = MenuItem::with_id(app, TRAY_SHOW_ID, TRAY_SHOW_LABEL, true, None::<&str>)?;
    let settings_i = MenuItem::with_id(
        app,
        TRAY_SETTINGS_ID,
        TRAY_SETTINGS_LABEL,
        true,
        None::<&str>,
    )?;
    let menu = Menu::with_items(app, &[&show_i, &settings_i, &quit_i])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            TRAY_QUIT_ID => {
                app.exit(0);
            }
            TRAY_SHOW_ID => show_main_window(app),
            TRAY_SETTINGS_ID => show_settings_window(app.clone()),
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main_window_visibility(&tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
