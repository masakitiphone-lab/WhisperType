# WhisperType

WhisperType is a Windows-first Tauri desktop app for voice dictation.

## What It Does

- Sign in with Google
- Hold a global shortcut to record
- Send audio to the Cloudflare Worker transcription endpoint
- Transcribe audio
- Consume credits and store history
- Paste the result into the active app

## Stack

- Desktop: Tauri v2
- Frontend: React + Vite + TypeScript
- Backend: Supabase Auth and Postgres
- Transcription provider: Groq Whisper-compatible API via Cloudflare Worker

## Local Development

- `pnpm tauri dev`
- `corepack pnpm build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `pnpm tauri build --bundles nsis`

## Docs

- [Agent.md](./Agent.md)
- [docs/security-release-roadmap.md](./docs/security-release-roadmap.md)
- [docs/windows-release-checklist.md](./docs/windows-release-checklist.md)
