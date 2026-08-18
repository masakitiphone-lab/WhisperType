# AGENTS.md instructions for whisper-type

## Architecture
- Desktop-only voice dictation app (Tauri v2 + React + Rust)
- No cloud backend, no accounts, no subscription
- Bring your own Groq API key (BYOK)
- Audio → local preprocessing (WebRTC VAD via ffmpeg) → Rust direct to Groq API → clipboard paste

## API key
- Windows: stored directly in the Windows Credential Manager (`CredReadW`/`CredWriteW`/`CredDeleteW` in `src-tauri/src/secure_storage.rs`); legacy keyring entries are migrated on read
- macOS: stored in the Keychain via the `keyring` crate
- Settings screen has a password field to input/save/clear it
- Never stored in `.env`, localStorage, or the repo

## Overlay windows
- Two transparent always-on-top windows: `overlay` (recording capsule + live transcription preview) and `notice` (transient errors, manual-copy prompts)
- The overlay window is click-through on both platforms (`set_ignore_cursor_events`; on Windows `WS_EX_TRANSPARENT` is also applied to the WebView2 child windows)
- `src/lib/overlayLayout.ts` owns the capsule/preview geometry; window resizing goes through `resize_overlay_window_command`

## macOS platform facts
- Bundle target: `dmg` (in addition to `nsis` for Windows)
- Build command: `pnpm tauri build --bundles dmg`
- Hotkeys: macOS native CGEventTap backend (`src-tauri/src/hotkeys/macos.rs`)
- Paste shortcut: `Cmd+V` on macOS (vs `Ctrl+V` on Windows), controlled by `cfg!(target_os = "macos")` in `src-tauri/src/text_input.rs`
- Paste needs Accessibility permission (`AXIsProcessTrusted`); checked in `src-tauri/src/accessibility.rs`
- ffmpeg search paths: `/usr/local/bin/ffmpeg` (Intel), `/opt/homebrew/bin/ffmpeg` (Apple Silicon), `$HOME/bin/ffmpeg`
- Code signing: configured in `src-tauri/tauri.conf.json` with `hardenedRuntime: true` and `entitlements: "entitlements.plist"`
- Minimum system version: macOS 13.0 (Ventura)

## Auto-update
- `tauri-plugin-updater` checks GitHub Releases for a `latest.json` manifest on launch and restarts after installing
- The update signing private key lives outside the repo at `~/.tauri/whispertype-updater.key`; the public key is embedded in `src-tauri/tauri.conf.json`

## Working rules
- No Supabase, auth, Cloudflare Worker, or MS Store code exists — do not add it
- Onboarding and tutorial use settings-based booleans (not user IDs)
- Verify with `pnpm build` (tsc + vite) and `cargo check` (in `src-tauri`) after changes
- The overlay/notice windows never store transcribed text in logs; keep it that way (log status and sizes only)
