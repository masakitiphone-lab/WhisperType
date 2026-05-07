# Windows release checklist

## Must finish before Microsoft Store submission

- Reserve the app name in Partner Center and confirm the final publisher identity.
- Create the Plus subscription add-on in Partner Center at JPY 300/month.
- Build the Store package with `WHISPERTYPE_PLUS_STORE_ID` set to the Partner Center Store ID.
- Set `WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST` to the production Worker host.
- Run `npm run validate:release` before packaging.
- Wire `purchase_plus_via_store` to `Windows.Services.Store`.
- Wire `check_plus_store_license` to the Plus subscription add-on entitlement.
- Sync trusted Store entitlement status to Supabase so the Cloudflare Worker sees Plus from server-side data.
- Confirm `VITE_TRANSCRIBE_URL` points to the production Cloudflare Worker.
- Confirm Supabase Auth allows `whispertype://auth/callback` and the production browser redirect URL.
- Publish hosted Privacy Policy, Terms, and Support URLs for the Store listing.
- Run a clean release build and install test on a machine without dev tools.

## Product copy rules

- Plus is described to users as unlimited or built for heavy daily use.
- Do not disclose the internal abuse-protection daily cap in UI, Store listing copy, or public legal copy.
- If the internal cap is reached, show a generic temporary availability or usage-protection error.

## Store listing assets

- App icon and Store logos from `src-tauri/icons`.
- Desktop screenshots for login, main dashboard, overlay recording, settings, and Plus checkout.
- Short description focused on voice dictation and desktop productivity.
- Support URL and contact email.
- Privacy Policy URL.
