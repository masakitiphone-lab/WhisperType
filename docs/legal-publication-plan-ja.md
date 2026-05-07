# WhisperType legal publication plan

Last updated: 2026-05-06

This document is a product/legal checklist for preparing WhisperType for public release. It is not legal advice; final text should be reviewed by a qualified professional if the release risk or revenue grows.

## Product facts confirmed from code

- Product name: WhisperType.
- Operator label for now: Studio Mirai, described as an individual-operated software brand, not as a company or corporation.
- Support email: studiomirai.info@gmail.com.
- Current public site: https://studio-mirai.vercel.app/.
- Production OAuth browser callback page: https://studio-mirai.vercel.app/whispertype/redirect/.
- Main market: Japan.
- Minimum target age: 13+.
- App type: Windows desktop voice input app using push-to-talk style recording.
- Background behavior: the app can start with Windows and stay in the system tray, but it records only when the user activates the configured hotkey / recording action.
- Authentication: Supabase Auth with Google OAuth is used. Email magic-link sign-in code also exists in the current app and should either be removed before release or disclosed.
- Local auth storage: Supabase session tokens are persisted, with migration toward Tauri secure storage and fallback localStorage.
- Audio flow: app records microphone audio, preprocesses it locally, sends it to a configured Cloudflare Worker endpoint, then the Worker sends it to Groq through Cloudflare AI Gateway.
- Audio file retention: audio files are not intentionally stored by the app/Worker after transcription processing.
- Text retention: successful transcription text is saved in `public.transcription_history`.
- User profile data: `public.profiles` stores user id, email, name, avatar URL, role, plan, daily free usage count, bonus usage count, daily reset date, Microsoft Store Plus entitlement status, Store id, timestamps.
- Usage history data: `public.transcription_history` stores user id, transcribed text, usage count consumed, and created timestamp.
- Free plan: daily free usage is consumed first; bonus usage is consumed after daily usage is exhausted.
- Plus plan: user-facing transcription is unlimited. An internal abuse-protection daily cap exists and must not be shown publicly.
- Billing: Plus is planned as a Microsoft Store subscription add-on for JPY 300/month.
- Purchase state: if `WHISPERTYPE_PLUS_STORE_ID` is not configured, purchase UI must remain disabled and return `store_product_not_configured`.
- Analytics: no third-party analytics SDK is currently in the app. Cloudflare platform logs/metrics may exist at infrastructure level.
- Advertising: none.
- Model training: user audio and transcription text are not used by Studio Mirai for AI model training or model improvement.

## Public pages needed

Use Vercel, Cloudflare Pages, GitHub Pages, or any stable HTTPS host. Vercel free URL is acceptable for early release as long as the URL is public and stable.

Minimum:

- `/privacy`
- `/terms`
- `/support`
- `/data-deletion`

Recommended:

- `/subscription`
- `/security`
- `/`

## App links needed

- Login screen: Privacy Policy and Terms of Use.
- Main app settings/account area: Privacy Policy, Terms of Use, Support, Data deletion/account deletion.
- Plus purchase screen: Subscription terms, Privacy Policy, Terms of Use.
- Microsoft Store listing: Privacy Policy URL and Support URL.
- Google OAuth consent screen: homepage URL, Privacy Policy URL, Terms URL if requested.

## Release blockers

- Create a support email under a product/brand address before publication.
- Decide final public operator wording for Studio Mirai.
- Replace current garbled in-app Japanese legal copy.
- Add in-app access to legal/support pages after login.
- Implement account deletion or publish a reliable data deletion request process before release.
- Confirm the production `VITE_TRANSCRIBE_URL`.
- Confirm Microsoft Store subscription product ID before enabling purchase.
