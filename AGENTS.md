# AGENTS.md instructions for whisper-type

## Architecture
- Desktop-only voice dictation app (Tauri v2 + React)
- No cloud backend, no accounts, no subscription
- Bring your own Groq API key (BYOK)
- Audio → local preprocessing (WebRTC VAD) → Rust direct to Groq API → clipboard paste

## API key
- Stored in OS keychain via `keyring` crate (`whispertype.groq.api-key`)
- Settings screen has a password field to input/save/clear it
- Not stored in `.env`, localStorage, or the repo

## Credit rules (NOT APPLICABLE)
- No credit system, no free tier, no Plus plan
- All users are unlimited — the only requirement is a valid Groq API key

## macOS platform facts
- Bundle target: `dmg` (in addition to `nsis` for Windows)
- Build command: `pnpm tauri build --bundles dmg`
- Hotkeys: macOS native CGEventTap backend (`src-tauri/src/hotkeys/macos.rs`)
- Paste shortcut: `Cmd+V` on macOS (vs `Ctrl+V` on Windows), controlled by `cfg!(target_os = "macos")` in `src-tauri/src/text_input.rs`
- Paste needs Accessibility permission (`AXIsProcessTrusted`); checked in `src-tauri/src/accessibility.rs`
- Autostart: Uses a LaunchAgent plist at `~/Library/LaunchAgents/com.whispertype.app.plist`
- ffmpeg search paths: `/usr/local/bin/ffmpeg` (Intel), `/opt/homebrew/bin/ffmpeg` (Apple Silicon), `$HOME/bin/ffmpeg`
- Code signing: configured in `src-tauri/tauri.conf.json` with `hardenedRuntime: true` and `entitlements: "entitlements.plist"`
- Entitlements required: `com.apple.security.cs.disable-library-validation`, `com.apple.security.cs.allow-unsigned-executable-memory`, `com.apple.security.device.microphone`, `com.apple.security.automation.apple-events`
- Minimum system version: macOS 13.0 (Ventura)

## Working rules
- No Supabase, auth, Cloudflare Worker, or MS Store code exists — do not add it
- Onboarding and tutorial use settings-based booleans (not user IDs)
- Verify with `npm run build` and `cargo check` after changes
