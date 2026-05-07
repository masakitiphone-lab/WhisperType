# Microsoft Store subscription rollout

## 1. Partner Center

1. Reserve the app in Partner Center.
2. Submit the parent app first.
3. Create an add-on with product type `Subscription`.
4. Set the recurring price to `JPY 300 / month`.
5. Copy the add-on Store ID issued by Partner Center.

## 2. Build configuration

The desktop app expects the subscription add-on Store ID at build time.

```powershell
$env:WHISPERTYPE_PLUS_STORE_ID="YOUR_PARTNER_CENTER_STORE_ID"
$env:WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST="your-worker.your-subdomain.workers.dev"
npm run validate:release
corepack pnpm tauri build
```

Use the actual Store ID from Partner Center, not an internal alias such as `whispertype_plus_monthly`.

## 3. App behavior

- The checkout page opens Microsoft Store purchase UI after `Windows.Services.Store` purchase wiring is completed.
- Card entry UI is not implemented locally.
- Local builds stay purchase-disabled.
- Store-packaged builds can purchase and refresh the subscription license.

## 4. Backend entitlement path

The database has a server-side entitlement target on `public.profiles`:

- `ms_store_plus_active`
- `ms_store_plus_store_id`
- `ms_store_plus_checked_at`

Use `sync_ms_store_plus_entitlement(user_id, store_id, active)` from a trusted backend after validating the Store subscription. The Cloudflare Worker will treat either `plan = 'plus'` or `ms_store_plus_active = true` as Plus.

The Worker scaffold exposes `POST /store/entitlement` for that trusted sync path. It requires:

- `STORE_ENTITLEMENT_SYNC_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not call this endpoint directly from the desktop app because the sync secret must never ship to users.

## 5. Release blockers

- Implement `purchase_plus_via_store` with `Windows.Services.Store`.
- Implement `check_plus_store_license` against the Store subscription add-on.
- Connect the Store license check to a trusted backend call to `sync_ms_store_plus_entitlement`.
- Build and submit the Store package with the Partner Center Store ID in `WHISPERTYPE_PLUS_STORE_ID`.
