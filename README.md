# WhisperType

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

### Development

```bash
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
