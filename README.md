<div align="center">

<img src="public/app-icon.png" alt="WhisperType" width="96" />

# WhisperType

**Desktop voice dictation for Windows and macOS.**

Hold a global shortcut, speak, and the transcribed text is inserted
into whatever application you are using — no accounts, no subscriptions,
no cloud backend.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey.svg)](#installation)
[![Tauri v2](https://img.shields.io/badge/tauri-v2-24C8DB.svg)](https://v2.tauri.app)
[![Rust](https://img.shields.io/badge/rust-stable-dea584.svg)](https://www.rust-lang.org)

</div>

---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Privacy & security](#privacy--security)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Global shortcut** — hold a key (or mouse button) from any application to start recording; release to transcribe and insert
- **Transparent overlay** — a floating capsule shows recording state, a live waveform, and a **live transcription preview** as segments finish, without blocking the window beneath it (click-through)
- **Direct Groq API** — audio goes straight from the native Rust backend to Groq's Whisper endpoint; no proxy, no cloud database
- **Bring your own API key (BYOK)** — stored in the OS credential store (Windows Credential Manager / macOS Keychain), never in `.env` or localStorage
- **Smart preprocessing** — WebRTC VAD filters silence, ffmpeg normalizes volume and converts to the optimal format before the request
- **Automatic insertion** — text is pasted at the cursor via `Ctrl+V` / `Cmd+V`, split into chunks for long dictation sessions
- **Multilingual** — interface and transcription in Japanese, English, and Spanish; additional languages for transcription
- **Auto-update** — checks GitHub Releases on launch and updates itself

## How it works

```text
Microphone → local preprocessing (VAD + ffmpeg) → Rust → Groq API → clipboard paste
```

1. You hold the global shortcut; the app records from your microphone.
2. On release, the audio is decoded locally, checked for speech with WebRTC VAD, and re-encoded to a compact format.
3. The processed audio is sent directly from the Rust backend to `https://api.groq.com` (OpenAI-compatible `/audio/transcriptions`).
4. The transcribed text is inserted into the active application via the clipboard.

WhisperType does not operate a proxy, store transcription history in a cloud database, or receive your API key.

## Privacy & security

- Your Groq API key stays on your device and is sent only to Groq for authentication.
- Audio is processed temporarily and is not retained by WhisperType.
- Transcribed text is **not written to logs** (only status codes and sizes are logged) and is stored only in memory during a session.
- No telemetry, analytics, or crash reporting.
- Groq's handling of requests is governed by Groq's current terms and privacy policy; you are responsible for your own API key and usage.

> BYOK model: because this is a desktop application, a determined user can inspect the installed binary. Never use a key that grants access to an organization or account you do not control.

## Installation

### Windows

1. Download the latest installer (`WhisperType_*_x64-setup.exe`) from the [Releases](https://github.com/masakitiphone-lab/WhisperType/releases) page.
2. Run the installer — no administrator rights required.
3. Installers are unsigned, so Windows SmartScreen may show a warning. Click **More info → Run anyway**.

### macOS

1. Download the DMG for your Mac (`x86_64` for Intel, `aarch64` for Apple Silicon) from the [Releases](https://github.com/masakitiphone-lab/WhisperType/releases) page.
2. Open the DMG and drag WhisperType into Applications.
3. macOS Gatekeeper may block the first launch (unsigned build). Right-click the app, choose **Open**, and confirm.

> Alternatively, build from source — see [Development](#development).

## Getting started

1. **Add your Groq API key** — the onboarding asks for it on first launch. You can change it anytime under **Settings → Groq API key**. Get a key at <https://console.groq.com/keys>. It is stored only in your OS credential store.
2. **Check the shortcut** — the default is `Ctrl+Alt` (Windows) / `Cmd+Alt` (macOS). Hold it, speak, and release to stop. Change it under **Settings → Shortcut key**.
3. **Dictate** — while holding the shortcut, speak. The transcription is inserted when you release it.

> **Tip**: with a modifier-only shortcut like `Ctrl+Alt`, you can bind a mouse button as an alternative trigger.

## Usage

### Recording & overlay

- Hold the global shortcut to start recording; release to stop and insert the text.
- The overlay capsule shows a live waveform while recording and a progress spinner while transcribing.
- During long dictation sessions, each finished segment is appended to a **transcription preview** above the capsule, so you can monitor what has been captured without looking at the target application.
- The overlay is click-through: it never blocks clicks on the windows beneath it.

### Settings

| Setting | Description |
| --- | --- |
| Groq API key | Your `gsk_...` key, stored in the OS credential store. |
| Shortcut key | The global hotkey that starts/stops recording. |
| Input microphone | Choose which microphone to use. |
| Transcription language | Spoken language or **Auto**. |
| Model | **Turbo** (faster) or **Full** (more accurate). |
| Overlay | Show/hide the floating overlay and waveform during recording. |
| Sounds | Play start/success sounds and adjust volume. |
| Auto insert | Automatically insert the transcription on release. |
| Clipboard paste | Insert via clipboard instead of simulated key events (more reliable in some apps). |
| Prompt | Optional hints for names, mixed languages, or writing style. |

## Development

### Requirements

- Node.js 20+
- [pnpm](https://pnpm.io)
- Rust stable toolchain
- Tauri v2 platform prerequisites ([docs](https://v2.tauri.app/start/prerequisites/))
- A Groq API key for testing
- On macOS: ffmpeg via Homebrew (`brew install ffmpeg`)

### Setup

```bash
pnpm install
pnpm tauri dev
```

### Verification

```bash
pnpm exec tsc --noEmit   # frontend typecheck
pnpm build               # frontend typecheck + bundle
cargo check              # Rust (run inside src-tauri/)
```

### Production builds

```bash
pnpm tauri build --bundles nsis   # Windows
pnpm tauri build --bundles dmg    # macOS
```

No build-time secrets are required. `.env.example` exists only as documentation and is intentionally empty.

### Releases & auto-update

Pushing a version tag builds installers for Windows (NSIS), macOS Intel (DMG), and macOS Apple Silicon (DMG) on GitHub Actions:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The app ships with `tauri-plugin-updater` wired up: on launch it checks the GitHub Releases `latest.json`, downloads an update, and restarts. The update signing keypair lives **outside the repository** at `~/.tauri/whispertype-updater.key` (private) and `.pub` (public). For updates to flow, release artifacts must be signed and a `latest.json` manifest published — see [AGENTS.md](AGENTS.md#auto-update) for details, and keep the private key secret.

## Contributing

Contributions are welcome! Please keep changes focused and consistent with the existing style:

1. Fork the repository and create a feature branch.
2. Make your change and verify it with `pnpm build` and `cargo check`.
3. Open a pull request describing the motivation and the change.

Note: the project intentionally has no backend — do not introduce server-side components (Supabase, Cloudflare Workers, etc.).

## License

[MIT](LICENSE) © 2026 Studio Mirai
