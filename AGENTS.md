# AGENTS.md instructions for whisper-type

## Current database facts
- `public.profiles` currently has these credit-related columns:
  - `bonus_credits` = bonus credits
  - `daily_credits` = daily free credits
  - `daily_credits_refreshed_on` = daily reset date
- `credit` and `credits` do not exist in the live schema unless a later migration adds them.
- `auth.uid()` based queries return rows only when run in an authenticated session, not from SQL Editor as an anonymous user.

## Credit rules
- Free plan:
  - Use `daily_credits` first.
  - If `daily_credits` reaches zero, use `bonus_credits` as bonus credits.
  - If both are zero, transcription must be blocked before preprocessing.
- Plus plan:
  - Do not check credits.
  - Treat transcription as unlimited for billing, but cap usage at 500 transcriptions per day.

## Current release rules
- Microsoft Store Plus is an in-app subscription add-on for the free app.
- Plus price target is JPY 300/month.
- Set `WHISPERTYPE_PLUS_STORE_ID` at build time after creating the Partner Center subscription add-on.
- Until the Store product ID is configured, purchase UI must stay disabled and return a clear `store_product_not_configured` state.
- The production desktop OAuth callback uses `whispertype://auth/callback`.
- The production browser landing page after Google login is `http://retirecurl.app`.
- `VITE_TRANSCRIBE_URL` still needs live confirmation before release.
- Cloudflare Worker is the only transcription endpoint; Supabase Edge Functions are not used for transcription.
- Worker must validate the Supabase access token sent by the app before sending audio to Groq.
- Worker must call `record_transcription` after successful transcription; do not patch credit columns directly.

## Working rules
- Keep the code aligned with the live schema before changing migrations.
- When the schema and code disagree, update the schema contract first in this file, then fix code to match.
- Verify with `npm run build` after changes.
