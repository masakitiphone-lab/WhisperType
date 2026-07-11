# Security release roadmap

## Required before public release

- Keep transcription traffic routed only through the Cloudflare Worker.
- Validate the Supabase access token in the Worker before sending audio to Groq.
- Call `record_transcription` after successful transcription; do not patch credit columns directly.
- Keep Groq, Cloudflare Gateway, and Supabase service-role secrets out of the desktop app.
- Confirm the Worker CORS allowlist contains only production origins needed by the app.
- Confirm Store entitlement updates are written through a trusted backend using `sync_ms_store_plus_entitlement`.
- Confirm `WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST` contains only the production Worker host.
- Confirm `STORE_ENTITLEMENT_SYNC_SECRET` is set only in the trusted backend/Worker environment, never in the desktop app.
- Confirm Privacy Policy and Terms explain temporary audio processing and third-party transcription infrastructure.

## Release verification

- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- Install a release build on a clean Windows machine.
- Sign in with Google using `https://studio-mirai.vercel.app/whispertype/redirect/`, which forwards the OAuth parameters to `whispertype://auth/callback`.
- Transcribe on Free with daily credits, then bonus credits.
- Transcribe on Plus after Store entitlement sync.
- Confirm failed/limited requests show generic user-facing errors without exposing internal caps.
- Confirm release builds reject transcription endpoints outside `WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST`.
