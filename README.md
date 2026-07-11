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

## Setup

### Requirements

- Node.js 20 or later
- pnpm
- Rust stable toolchain
- Tauri v2 platform prerequisites
- A Groq API key

### Development

```bash
pnpm install
pnpm tauri dev
```

Open the Settings screen, enter your Groq API key (`gsk_...`), and save it. The key is stored in the OS keychain; it is not written to `.env`, localStorage, or the repository.

### Production builds

```bash
pnpm build
pnpm tauri build --bundles nsis   # Windows
pnpm tauri build --bundles dmg    # macOS
```

No build-time environment variables or secrets are required. `.env.example` is intentionally empty apart from documentation.

## Privacy and security

- Your Groq API key remains on your device and is sent only to Groq for API authentication.
- Audio is processed temporarily for transcription and is not intentionally retained by WhisperType.
- Groq's handling of requests is governed by Groq's current terms and privacy policy.
- Anyone using this app is responsible for their own Groq account, API usage, and API-key rotation.

Because this is a desktop application, a determined user can inspect the installed binary. BYOK is therefore the intended model: never use a key that grants access to an organization or account you do not control.

## License

See [LICENSE](LICENSE).
