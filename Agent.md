# WhisperType Agent Notes

## Purpose

WhisperType is a Windows-first Tauri desktop app for voice dictation.

Core flow:
1. Sign in with Google
2. Hold a global shortcut to record
3. Send audio to the Cloudflare Worker transcription endpoint
4. Transcribe audio
5. Consume credits and store history
6. Paste the result into the active app

## Current Stack

- Desktop: Tauri v2
- Frontend: React + Vite + TypeScript
- Backend: Supabase Auth and Postgres
- Transcription provider: Groq Whisper-compatible API via Cloudflare Worker

## Current Auth Model

- Google sign-in opens in the external browser.
- Desktop callback uses `whispertype://auth/callback`.
- Local development uses `whispertype://auth/callback` for the native app handoff.
- Session restore is optimized for reliable auto-login.
- Current implementation uses browser storage for Supabase auth persistence and also keeps Tauri-side token helpers for desktop flows.

## Current Release Rules

- Production browser redirect / landing page after Google login:
  - URL: `http://retirecurl.app`
  - Use a browser page that tells the user they can return to the app and close the page.
  - This is separate from the desktop deep-link callback.
- Microsoft Store Plus purchase:
  - Prepare the Plus purchase flow before release.
  - Wire it to the Store identity after Store publication.
- Free plan credits:
  - `daily_credits` is consumed first.
  - `bonus_credits` is consumed after `daily_credits` reaches zero.
  - 50 daily credits refresh once per day.
  - 1 transcription consumes 1 credit.
- Plus plan:
  - Unlimited billing access.
  - Operational cap: 500 transcriptions per day.

## Current App Behavior

- Main window starts hidden and is designed for tray-first use.
- Overlay is a separate transparent Tauri window.
- Global shortcut registration is native through Tauri.
- Text insertion prefers clipboard paste over per-character typing.
- If `Ctrl+V` cannot be sent, the overlay shows a manual copy fallback.
- Overlay waveform and onboarding are part of the shipped product UI.

## Required Environment

### Frontend `.env`

Required keys:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_AUTH_REDIRECT_URL`

Note:
- Do not put secrets behind a `VITE_` prefix; those values are exposed to the frontend bundle.

Recommended local values:
- `VITE_APP_URL=http://localhost:1420`
- `VITE_AUTH_REDIRECT_URL=whispertype://auth/callback`

### Cloudflare Worker secrets

Required keys:
- `ALLOWED_ORIGINS`
- `CF_AI_GATEWAY_ACCOUNT_ID`
- `CF_AI_GATEWAY_ID`
- `CF_AIG_TOKEN`
- `GROQ_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended:
- `ALLOWED_ORIGINS`
  Example: `http://localhost:1420,http://127.0.0.1:1420`

Notes:
- `SUPABASE_DATABASE_URL` is not used by the current code.
- Worker variables in Cloudflare must use the exact names listed above.
- `VITE_TRANSCRIBE_URL` in the desktop app should point to the Cloudflare Worker URL, not a Supabase Functions URL.
- The exact production `VITE_TRANSCRIBE_URL` still needs confirmation before release.
- The app sends a Supabase access token to the Cloudflare Worker.
- Worker must validate that token server-side before sending audio to Groq.
- Worker must use `record_transcription` for history and credit updates. Do not directly patch `profiles.daily_credits`, `profiles.bonus_credits`, or old `profiles.credits`.

## URLs And Redirects

Development URLs:
- App URL: `http://localhost:1420`
- Desktop callback: `whispertype://auth/callback`
- Browser landing page after Google login: `http://retirecurl.app`

Supabase redirect allow-list should include:
- `whispertype://auth/callback`
- `http://retirecurl.app`
- `http://localhost:1420/auth/callback` only if you want a browser fallback page during local testing

## Database Assumptions

### `public.profiles`
Used for:
- display name
- avatar URL
- credit balance
- plan

Expected fields used by the app:
- `id`
- `email`
- `name`
- `avatar_url`
- `daily_credits`
- `bonus_credits`
- `daily_credits_refreshed_on`
- `role`
- `plan` with values `free | plus`
- Current plan rule:
  - free plan uses `daily_credits` first, then `bonus_credits`
  - plus plan does not check credits in the UI flow, but the operational cap is 500 transcriptions per day

### `public.transcription_history`
Used for:
- per-user transcription history
- recent activity in the main UI

### `public.promo_codes`
Used for:
- code string
- reward credits
- active state
- expiration
- redemption limit

### `public.promo_redemptions`
Used for:
- redeemed code records
- one promo redemption per account enforcement

Current rule:
- An authenticated account can redeem at most one promo code total.

## Important SQL Files

Core schema:
- `supabase/migrations/20260306223000_initial_schema.sql`

Promo code system:
- `supabase/migrations/20260308130000_promo_codes.sql`
- `supabase/manual_sql/20260309_one_promo_per_account.sql`

Welcome credits:
- `supabase/migrations/20260309190000_welcome_credits.sql`

Plan field:
- `supabase/migrations/20260309193000_profile_plan.sql`

## Important Runtime Files

Frontend:
- `src/App.tsx`
- `src/contexts/AuthProvider.tsx`
- `src/lib/supabase.ts`
- `src/lib/authStorage.ts`
- `src/services/transcription.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/MainPage.tsx`
- `src/pages/OverlayPage.tsx`
- `src/pages/PlanCheckoutPage.tsx`
- `src/components/OnboardingModal.tsx`
- `src/components/WelcomeCreditsCelebration.tsx`

Desktop:
- `src-tauri/src/lib.rs`
- `src-tauri/src/text_input.rs`
- `src-tauri/src/windowing.rs`
- `src-tauri/src/tray.rs`
- `src-tauri/src/hotkeys.rs`
- `src-tauri/tauri.conf.json`

Backend:
- Cloudflare Worker transcription endpoint

## Build And Dev Commands

Development:
- `pnpm tauri dev`

Frontend build:
- `corepack pnpm build`

Rust check:
- `cargo check --manifest-path src-tauri/Cargo.toml`

Windows installer build:
- `pnpm tauri build --bundles nsis`

## Release Notes For Future AI Work

Treat these as current source of truth:
- `README.md`
- `docs/security-release-roadmap.md`
- `docs/windows-release-checklist.md`

Current release direction:
- Windows first
- `nsis` installer
- likely unsigned for early family-and-friends distribution

Before broader release, verify:
1. Google sign-in
2. auto-login after restart
3. microphone permission and recording
4. global shortcut
5. transcription and credit deduction
6. overlay paste flow
7. promo code redemption
8. logout

## What Not To Reintroduce

Do not reintroduce these without a deliberate decision:
- loopback desktop OAuth listener on a fixed localhost port
- raw backend error messages in UI
- raw transcript text in Rust logs
- debug-only UI or debug audio saving
- hardcoded plan labels in the sidebar

## README Rule

Keep this file short and current.
Only store information that future contributors or AI agents are likely to need to avoid breaking the product.
Do not use this file as a diary or long change log.

## UI Rules

- Keep the UI minimal and user-facing.
- Do not surface developer-facing messages, debug copy, or implementation notes in the product UI.
- Prefer short labels, direct actions, and clear state over explanatory paragraphs.
