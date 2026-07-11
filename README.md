# WhisperType

<<<<<<< HEAD
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
=======
Voice dictation for your desktop. Hold a global shortcut, speak, and insert text into any application.

## Features

- **Global shortcut** – Record from anywhere with a customizable hotkey
- **Real-time transcription** – Powered by Groq's Whisper-compatible API via Cloudflare Workers
- **Smart paste** – Inserts transcribed text directly into the active input field
- **Overlay UI** – Floating recording indicator with waveform visualization
- **Multi-language** – Supports Japanese, English, and Spanish UI; multi-language transcription
- **Free tier** – Daily credits for casual use
- **Plus plan** – Unlimited transcription (Windows Store subscription)

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Tauri Desktop App  │────▶│  Cloudflare      │────▶│  Groq API       │
│  (React + Rust)     │     │  Worker          │     │  (Whisper)      │
└─────────┬───────────┘     └──────────────────┘     └─────────────────┘
          │
          ▼
┌─────────────────────┐
│  Supabase           │
│  (Auth + Postgres)  │
└─────────────────────┘
```

- **Desktop**: Tauri v2 shell with React frontend and Rust backend
- **Transcription**: Cloudflare Worker validates auth, delegates to Groq Whisper, records usage
- **Auth**: Google OAuth via Supabase; session persists in native secure storage
- **Storage**: Supabase Postgres for profiles, credits, transcription history, promo codes

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Rust (Tauri commands) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase Postgres |
| Transcription | Groq Whisper via Cloudflare Worker |
| Billing | Microsoft Store SDK (Windows) |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm
- Rust toolchain (stable)
- Tauri v2 system dependencies ([guide](https://v2.tauri.app/start/prerequisites/))

### Setup

```bash
# Clone and install
git clone https://github.com/<org>/whisper-type
cd whisper-type
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase project credentials
```
>>>>>>> 76c0a9ef47068d3322c0f3d617003f87660d788a

### Development

```bash
<<<<<<< HEAD
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
=======
# Run in dev mode (hot-reload)
pnpm tauri dev
```

### Build

```bash
# Frontend only
pnpm build

# Windows installer
pnpm tauri build --bundles nsis

# macOS disk image
pnpm tauri build --bundles dmg

# Rust validation
cargo check --manifest-path src-tauri/Cargo.toml
```

## Project Structure

```
src/                    # Frontend (React + TypeScript)
  components/           # Reusable UI components
    overlay/            # Recording overlay UI
    ui/                 # Primitive UI components
  contexts/             # React contexts (auth)
  hooks/                # Custom React hooks
  lib/                  # Utilities and helpers
  pages/                # Route page components
  services/             # Business logic services
src-tauri/              # Desktop backend (Rust)
  src/
    hotkeys/            # Global shortcut backends (Windows/macOS)
    shared/             # Shared utilities (logging, events, windowing)
    lib.rs              # Tauri commands and app setup
docs/                   # Documentation
supabase/               # Database migrations
```

## Documentation

- [Agent.md](./Agent.md) – Development reference
- [docs/security-release-roadmap.md](./docs/security-release-roadmap.md)
- [docs/windows-release-checklist.md](./docs/windows-release-checklist.md)

## License

MIT License – see [LICENSE](./LICENSE).
>>>>>>> 76c0a9ef47068d3322c0f3d617003f87660d788a
