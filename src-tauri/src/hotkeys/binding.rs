use std::collections::BTreeSet;
use std::fmt;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum BindingToken {
    Modifier(&'static str),
    Key(String),
    Mouse(String),
    Vendor(String),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HotkeyBinding {
    pub tokens: Vec<BindingToken>,
}

impl fmt::Display for HotkeyBinding {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let rendered = self
            .tokens
            .iter()
            .map(|token| match token {
                BindingToken::Modifier(value) => (*value).to_string(),
                BindingToken::Key(value) => value.clone(),
                BindingToken::Mouse(value) => value.clone(),
                BindingToken::Vendor(value) => value.clone(),
            })
            .collect::<Vec<_>>()
            .join("+");
        write!(f, "{}", rendered)
    }
}

impl HotkeyBinding {
    pub fn parse(input: &str) -> Result<Self, String> {
        let mut modifiers = BTreeSet::new();
        let mut main_tokens = Vec::new();

        for raw_part in input.split('+') {
            let part = raw_part.trim();
            if part.is_empty() {
                continue;
            }

            match normalize_binding_token(part) {
                BindingToken::Modifier(value) => {
                    modifiers.insert(BindingToken::Modifier(value));
                }
                token => main_tokens.push(token),
            }
        }

        if modifiers.is_empty() && main_tokens.is_empty() {
            return Err("No keys were captured.".to_string());
        }

        let mut tokens = modifiers.into_iter().collect::<Vec<_>>();
        tokens.extend(main_tokens);
        Ok(Self { tokens })
    }

    #[allow(dead_code)]
    pub fn has_mouse_tokens(&self) -> bool {
        self.tokens
            .iter()
            .any(|token| matches!(token, BindingToken::Mouse(_)))
    }

    #[allow(dead_code)]
    pub fn has_vendor_tokens(&self) -> bool {
        self.tokens
            .iter()
            .any(|token| matches!(token, BindingToken::Vendor(_)))
    }

    #[allow(dead_code)]
    pub fn has_modifier_only(&self) -> bool {
        self.tokens
            .iter()
            .all(|token| matches!(token, BindingToken::Modifier(_)))
    }
}

fn normalize_binding_token(input: &str) -> BindingToken {
    let uppercase = input.to_uppercase();

    match uppercase.as_str() {
        "CTRL" | "CONTROL" => BindingToken::Modifier("Ctrl"),
        "SHIFT" => BindingToken::Modifier("Shift"),
        "ALT" | "ALTGRAPH" => BindingToken::Modifier("Alt"),
        "META" | "COMMAND" | "CMD" | "SUPER" | "WIN" | "WINDOWS" => {
            BindingToken::Modifier("Meta")
        }
        "EQUAL" | "PLUS" => BindingToken::Key("Equal".to_string()),
        "MINUS" => BindingToken::Key("Minus".to_string()),
        "BRACKETLEFT" => BindingToken::Key("BracketLeft".to_string()),
        "BRACKETRIGHT" => BindingToken::Key("BracketRight".to_string()),
        "BACKSLASH" => BindingToken::Key("Backslash".to_string()),
        "SEMICOLON" => BindingToken::Key("Semicolon".to_string()),
        "QUOTE" | "APOSTROPHE" => BindingToken::Key("Quote".to_string()),
        "COMMA" => BindingToken::Key("Comma".to_string()),
        "PERIOD" | "DOT" => BindingToken::Key("Period".to_string()),
        "SLASH" | "FORWARDSLASH" => BindingToken::Key("Slash".to_string()),
        "BACKQUOTE" | "GRAVE" => BindingToken::Key("Backquote".to_string()),
        "PRINTSCREEN" | "PRTSC" | "PRTSCN" => BindingToken::Key("PrintScreen".to_string()),
        "SCROLLLOCK" => BindingToken::Key("ScrollLock".to_string()),
        "PAUSE" | "PAUSEBREAK" => BindingToken::Key("Pause".to_string()),
        "INSERT" => BindingToken::Key("Insert".to_string()),
        "DELETE" => BindingToken::Key("Delete".to_string()),
        "HOME" => BindingToken::Key("Home".to_string()),
        "END" => BindingToken::Key("End".to_string()),
        "PAGEUP" => BindingToken::Key("PageUp".to_string()),
        "PAGEDOWN" => BindingToken::Key("PageDown".to_string()),
        "CONTEXTMENU" | "APPS" | "MENU" => BindingToken::Key("ContextMenu".to_string()),
        "BROWSERBACK" => BindingToken::Key("BrowserBack".to_string()),
        "BROWSERFORWARD" => BindingToken::Key("BrowserForward".to_string()),
        "BROWSERREFRESH" => BindingToken::Key("BrowserRefresh".to_string()),
        "BROWSERSTOP" => BindingToken::Key("BrowserStop".to_string()),
        "BROWSERSEARCH" => BindingToken::Key("BrowserSearch".to_string()),
        "BROWSERFAVORITES" => BindingToken::Key("BrowserFavorites".to_string()),
        "BROWSERHOME" => BindingToken::Key("BrowserHome".to_string()),
        "AUDIOVOLUMEMUTE" | "VOLUMEMUTE" => BindingToken::Key("AudioVolumeMute".to_string()),
        "AUDIOVOLUMEDOWN" | "VOLUMEDOWN" => BindingToken::Key("AudioVolumeDown".to_string()),
        "AUDIOVOLUMEUP" | "VOLUMEUP" => BindingToken::Key("AudioVolumeUp".to_string()),
        "MEDIATRACKNEXT" | "MEDIANEXTTRACK" => BindingToken::Key("MediaTrackNext".to_string()),
        "MEDIATRACKPREVIOUS" | "MEDIAPREVIOUSTRACK" => {
            BindingToken::Key("MediaTrackPrevious".to_string())
        }
        "MEDIASTOP" => BindingToken::Key("MediaStop".to_string()),
        "MEDIAPLAYPAUSE" => BindingToken::Key("MediaPlayPause".to_string()),
        "LAUNCHMAIL" => BindingToken::Key("LaunchMail".to_string()),
        "LAUNCHAPP1" => BindingToken::Key("LaunchApp1".to_string()),
        "LAUNCHAPP2" => BindingToken::Key("LaunchApp2".to_string()),
        "SLEEP" => BindingToken::Key("Sleep".to_string()),
        "WAKEUP" => BindingToken::Key("WakeUp".to_string()),
        "UP" | "ARROWUP" => BindingToken::Key("ArrowUp".to_string()),
        "DOWN" | "ARROWDOWN" => BindingToken::Key("ArrowDown".to_string()),
        "LEFT" | "ARROWLEFT" => BindingToken::Key("ArrowLeft".to_string()),
        "RIGHT" | "ARROWRIGHT" => BindingToken::Key("ArrowRight".to_string()),
        "SPACE" | "SPACEBAR" => BindingToken::Key("Space".to_string()),
        "ENTER" | "RETURN" => BindingToken::Key("Enter".to_string()),
        "ESC" | "ESCAPE" => BindingToken::Key("Escape".to_string()),
        "TAB" => BindingToken::Key("Tab".to_string()),
        "BACKSPACE" => BindingToken::Key("Backspace".to_string()),
        "MOUSELEFT" | "LEFTMOUSE" => BindingToken::Mouse("MouseLeft".to_string()),
        "MOUSEMIDDLE" | "MIDDLEMOUSE" => BindingToken::Mouse("MouseMiddle".to_string()),
        "MOUSERIGHT" | "RIGHTMOUSE" => BindingToken::Mouse("MouseRight".to_string()),
        "MOUSE4" | "XBUTTON1" => BindingToken::Mouse("Mouse4".to_string()),
        "MOUSE5" | "XBUTTON2" => BindingToken::Mouse("Mouse5".to_string()),
        "MOUSE6" | "MOUSE7" | "MOUSE8" => BindingToken::Mouse(input.to_string()),
        token if token.starts_with("F") && token.len() <= 3 => BindingToken::Key(token.to_string()),
        token if token.starts_with("NUMPAD") => BindingToken::Key(token.to_string()),
        token if token.starts_with("VENDOR") || token.starts_with("CUSTOM") => {
            BindingToken::Vendor(input.to_string())
        }
        token if token.len() == 1 => BindingToken::Key(token.to_string()),
        _ => BindingToken::Key(input.to_string()),
    }
}
