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
$env:WHISPERTYPE_MS_STORE_PLUS_PRODUCT_ID="YOUR_PARTNER_CENTER_STORE_ID"
corepack pnpm tauri build
```

Use the actual Store ID from Partner Center, not an internal alias such as `whispertype_plus_monthly`.

## 3. App behavior

- The checkout page opens Microsoft Store purchase UI.
- Card entry UI is not implemented locally.
- Local builds stay purchase-disabled.
- Store-packaged builds can purchase and refresh the subscription license.

## 4. Remaining backend work

This repository can now detect a local Store subscription and unlock the desktop UI.
It does **not** yet synchronize Microsoft Store entitlement back to Supabase as a trusted server-side subscription source.

Before production launch, add a backend reconciliation path so the transcription backend treats Microsoft Store subscribers as `plan = 'plus'`.
