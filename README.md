# WhisperType

Desktop voice dictation for Windows and macOS. Hold the global shortcut, speak, and insert the transcription into the active application.

## Features

- Global shortcut and recording overlay
- Direct Groq Whisper-compatible transcription
- Bring your own Groq API key (BYOK)
- API key stored in the operating system keychain
- Japanese, English, and Spanish interface
- No account, hosted backend, subscription, or usage quota managed by WhisperType

## How it works

```text
Microphone → local preprocessing → Tauri/Rust → Groq API → text insertion
```

Audio is sent directly from the native desktop backend to `https://api.groq.com`. WhisperType does not operate a proxy, store transcription history in a cloud database, or receive your API key.

## Installation

### Windows

1. Download the latest installer (`WhisperType_*_x64-setup.exe`) from the [Releases](https://github.com/masakitiphone-lab/WhisperType/releases) page.
2. Run the installer. No administrator rights are required.
3. Installers are unsigned, so Windows SmartScreen may show a warning. Click **More info → Run anyway** to continue.

### macOS

1. Download the DMG for your Mac (`x86_64` for Intel, `aarch64` for Apple Silicon) from the [Releases](https://github.com/masakitiphone-lab/WhisperType/releases) page.
2. Open the DMG and drag WhisperType into the Applications folder.
3. Installers are unsigned, so macOS Gatekeeper may block the first launch. Right-click the app and select **Open**, then confirm **Open** in the dialog.

> Installers are unsigned because WhisperType is a free open-source project. If you prefer, you can build from source (see [Development](#development)) instead.

## Getting started

1. **Add your Groq API key.** On first launch, the onboarding will ask for it. You can also add or change it later in **Settings → Groq API key**. Get a key at <https://console.groq.com/keys>. The key is stored only in your OS keychain and is sent directly to Groq — never to WhisperType.
2. **Check the shortcut.** The default shortcut is `Ctrl+Alt` (Windows) / `Cmd+Alt` (macOS). Hold it, speak, and release it to stop. You can change it in **Settings → Shortcut key**.
3. **Start dictating.** While holding the shortcut, speak into the microphone. The transcription is inserted into the active application when you release the shortcut.

## Usage

### Recording

- Hold the global shortcut to start recording; release it to stop and insert the text.
- The floating overlay shows a live waveform and the transcription progress.
- Tip: with a modifier-only shortcut like `Ctrl+Alt`, you can even use a mouse button as an alternative trigger.

### Settings

| Setting | Description |
| --- | --- |
| Groq API key | Your `gsk_...` key. Stored in the OS keychain. |
| Shortcut key | The global hotkey that starts/stops recording. |
| Input microphone | Choose which microphone to use. |
| Transcription language | Spoken language or **Auto**. |
| Model | **Turbo** (faster) or **Full** (more accurate). |
| Overlay | Show/hide the floating overlay and waveform during recording. |
| Sounds | Play start/success sounds and adjust their volume. |
| Auto insert | Automatically insert the transcription on release. |
| Clipboard paste | Insert via clipboard instead of simulated key events (more reliable in some apps). |
| Prompt | Optional hints for names, mixed languages, or writing style. |

### Languages

Interface and transcription support Japanese, English, and Spanish (plus French, German, Italian, Portuguese, Chinese, and Korean for transcription). Change the interface language during onboarding or on the main screen.

## Development

### Requirements

- Node.js 20 or later
- pnpm
- Rust stable toolchain
- Tauri v2 platform prerequisites ([docs](https://v2.tauri.app/start/prerequisites/))
- A Groq API key

### Setup

```bash
pnpm install
pnpm tauri dev
```

On first launch, onboarding will ask for your Groq API key (`gsk_...`). The key is stored in the OS keychain; it is not written to `.env`, localStorage, or the repository.

### Production builds

```bash
pnpm build
pnpm tauri build --bundles nsis   # Windows
pnpm tauri build --bundles dmg    # macOS
```

No build-time environment variables or secrets are required. `.env.example` is intentionally empty apart from documentation.

### Releases

Pushing a version tag builds installers for Windows (NSIS), macOS Intel (DMG), and macOS Apple Silicon (DMG) on GitHub Actions and attaches them to a draft Release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Open the draft in the [Releases](https://github.com/masakitiphone-lab/WhisperType/releases) page, review it, and publish.

## Privacy and security

- Your Groq API key remains on your device and is sent only to Groq for API authentication.
- Audio is processed temporarily for transcription and is not intentionally retained by WhisperType.
- Groq's handling of requests is governed by Groq's current terms and privacy policy.
- Anyone using this app is responsible for their own Groq account, API usage, and API-key rotation.

Because this is a desktop application, a determined user can inspect the installed binary. BYOK is therefore the intended model: never use a key that grants access to an organization or account you do not control.

## License

See [LICENSE](LICENSE).
