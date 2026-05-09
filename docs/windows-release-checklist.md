# Windows release checklist

## Microsoft Store update model

- Microsoft Store builds use a dedicated Tauri config at `src-tauri/tauri.microsoftstore.conf.json`.
- Build Store submissions with `npm run release:store`.
- `npm run validate:store-release` checks version sync and Store bundle requirements before packaging.
- The Store package must use the offline WebView2 installer mode required by Tauri's Microsoft Store guidance.
- App updates are delivered by creating a new Partner Center submission for the same app identity.
- Keep the package identity stable after first submission. Changing package name or publisher breaks the Store update path.
- Increase `src-tauri/tauri.conf.json` `version` for every Store update. Microsoft Store/MSIX package updates require a higher package version.
- Do not add an in-app self-updater for Store builds. Let Microsoft Store own install and update delivery.
- For staged releases, use Partner Center gradual rollout or package flights after the first public Store submission.

## Store build command

```powershell
$env:WHISPERTYPE_PLUS_STORE_ID="YOUR_PARTNER_CENTER_STORE_ID"
$env:WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST="your-worker.your-subdomain.workers.dev"
$env:VITE_SUPABASE_URL="https://..."
$env:VITE_SUPABASE_ANON_KEY="..."
$env:VITE_TRANSCRIBE_URL="https://your-worker.your-subdomain.workers.dev"
$env:VITE_AUTH_REDIRECT_URL="https://studio-mirai.vercel.app/whispertype/redirect/"
npm run release:store
```

The generated installer package is submitted through Partner Center. For an update, create a new submission on the existing app, upload the newly built package, complete certification, then let Microsoft Store distribute it to existing users.

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
