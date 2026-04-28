import type { AppLocale } from "@/lib/appLocale";

export type Copy = {
  shellEyebrowHome: string;
  shellEyebrowSettings: string;
  shellTitle: string;
  shellDescription: string;
  settingsDescription: string;
  navHome: string;
  navSettings: string;
  signOut: string;
  signedIn: string;
  noEmail: string;
  voiceInput: string;
  stateIdleTitle: string;
  stateIdleDescription: string;
  stateRecordingTitle: string;
  stateRecordingDescription: string;
  stateTranscribingTitle: string;
  stateTranscribingDescription: string;
  stateFinishedTitle: string;
  stateFinishedDescription: string;
  badgeRecording: string;
  badgeWorking: string;
  badgeDone: string;
  quickControls: string;
  quickControlsDescription: string;
  appLanguage: string;
  appLanguageDescription: string;
  transcriptionLanguage: string;
  model: string;
  shortcut: string;
  openAdvancedSettings: string;
  recent: string;
  recentDescription: string;
  noRecent: string;
  noTextReturned: string;
  credits: string;
  creditsBalance: string;
  holdToTalk: string;
  recordTranscribeInsert: string;
  activeShortcut: string;
  homeStatusTitle: string;
  homeStatusDescription: string;
  shortcutCardTitle: string;
  shortcutCardDescription: string;
  quickSettingsTitle: string;
  quickSettingsDescription: string;
  promoCardTitle: string;
  promoCardDescription: string;
  promoCardHint: string;
  shortcutRecorderTitle: string;
  continueWithGoogle: string;
  loginHeadline: string;
  loginDescription: string;
  openingBrowser: string;
  signInWithGoogle: string;
  workspaceSummaryTitle: string;
  workspaceSummaryDescription: string;
  sessionLabel: string;
  accessLabel: string;
  accessReady: string;
  accessSyncing: string;
  settingsHotkeyTitle: string;
  settingsHotkeyDescription: string;
  settingsPromptTitle: string;
  settingsPromptDescription: string;
  settingsPromoTitle: string;
  settingsPromoDescription: string;
  settingsPromoPlaceholder: string;
  settingsPromoClaim: string;
  settingsPromoNote: string;
  settingsPromptClear: string;
  settingsPromptJapanese: string;
  settingsPromptEnglish: string;
  settingsPromptHint: string;
  settingsOverlayScaleTitle: string;
  settingsOverlayScaleDescription: string;
  settingsLoading: string;
  settingsHotkeyUpdating: string;
  settingsHotkeyUpdated: string;
  settingsHotkeyIdleHint: string;
  settingsDiagnosticsCopied: string;
  settingsDiagnosticsCopyFailed: string;
  settingsCopyDiagnostics: string;
  settingsClearDiagnostics: string;
  settingsBackend: string;
  settingsTier: string;
  settingsPlannedNativeBackend: string;
  settingsFunctionKeys: string;
  settingsNavigationKeys: string;
  settingsModifierOnly: string;
  settingsMouseButtons: string;
  settingsVendorKeys: string;
  settingsPermission: string;
  settingsStatus: string;
  settingsNativeRuntime: string;
  settingsNativePreflight: string;
  settingsWorksWell: string;
  settingsStillLimited: string;
  settingsChecking: string;
  settingsRequestPermission: string;
  settingsRequesting: string;
  settingsProbeNativeBackend: string;
  settingsProbing: string;
  settingsInputMonitoringRequested: string;
  settingsYes: string;
  settingsNo: string;
  navBilling: string;
  billingDescription: string;
  currentPlanLabel: string;
  planDetails: string;
  accountLabel: string;
  authChecking: string;
  loginBadge: string;
  loginFeatureBrowser: string;
  loginFeatureHotkey: string;
  loginFeatureHistory: string;
  loginApprovalDescription: string;
  loginBrowserHint: string;
  manualInsertTitle: string;
  manualInsertDescription: string;
  close: string;
  copy: string;
};

const EN: Copy = {
  shellEyebrowHome: "Workspace",
  shellEyebrowSettings: "Preferences",
  shellTitle: "WhisperType",
  shellDescription: "Manage your shortcut, transcription language, plan, and credits from one place.",
  settingsDescription: "Adjust app behavior, recording preferences, and account-related settings.",
  navHome: "Home",
  navSettings: "Settings",
  signOut: "Sign out",
  signedIn: "Signed in",
  noEmail: "No email",
  voiceInput: "Voice Input",
  stateIdleTitle: "Ready",
  stateIdleDescription: "Hold the shortcut. Release to insert.",
  stateRecordingTitle: "Listening",
  stateRecordingDescription: "Speak naturally.",
  stateTranscribingTitle: "Transcribing",
  stateTranscribingDescription: "Converting speech to text.",
  stateFinishedTitle: "Inserted",
  stateFinishedDescription: "Sent to the target app.",
  badgeRecording: "Recording",
  badgeWorking: "Working",
  badgeDone: "Done",
  quickControls: "Quick controls",
  quickControlsDescription: "Keep the settings you use every day within easy reach.",
  appLanguage: "App language",
  appLanguageDescription: "Choose the interface language. It is saved automatically and used again next launch.",
  transcriptionLanguage: "Transcription language",
  model: "Model",
  shortcut: "Shortcut",
  openAdvancedSettings: "Open advanced settings",
  recent: "Recent",
  recentDescription: "Your latest inserts show up here automatically.",
  noRecent: "No recent transcriptions yet.",
  noTextReturned: "No text returned",
  credits: "Credits",
  creditsBalance: "Balance",
  holdToTalk: "Hold to talk.",
  recordTranscribeInsert: "Record, transcribe, insert.",
  activeShortcut: "Active shortcut",
  homeStatusTitle: "Voice input is ready",
  homeStatusDescription: "Press your shortcut, speak naturally, and drop text into any app.",
  shortcutCardTitle: "Shortcut",
  shortcutCardDescription: "Click once, press your shortcut, then release to save it.",
  quickSettingsTitle: "Quick settings",
  quickSettingsDescription: "Change language and model quickly from the main screen.",
  promoCardTitle: "Promotion codes",
  promoCardDescription: "Apply a promotion code to add credits to your account.",
  promoCardHint: "You can enter a code from the plan section.",
  shortcutRecorderTitle: "Press to set shortcut",
  continueWithGoogle: "Continue with Google",
  loginHeadline: "Sign in once, then keep voice input close to your cursor.",
  loginDescription: "WhisperType opens Google sign-in in your browser, returns to the desktop app, and keeps the rest of the experience focused on quick input.",
  openingBrowser: "Opening browser...",
  signInWithGoogle: "Sign in with Google",
  workspaceSummaryTitle: "Workspace summary",
  workspaceSummaryDescription: "See your balance and account at a glance.",
  sessionLabel: "Session",
  accessLabel: "Access",
  accessReady: "Ready",
  accessSyncing: "Syncing",
  settingsHotkeyTitle: "Shortcut",
  settingsHotkeyDescription: "Set the shortcut you want to use when starting voice input.",
  settingsPromptTitle: "Prompt behavior",
  settingsPromptDescription: "Advanced transcription guidance for names, mixed language input, and writing style.",
  settingsPromoTitle: "Promotion code",
  settingsPromoDescription: "コード入力と特典の受け取りに使います。",
  settingsPromoPlaceholder: "Enter promo code",
  settingsPromoClaim: "Claim credits",
  settingsPromoNote: "コードを入力するとクレジットを受け取れます。",
  settingsPromptClear: "Clear prompt",
  settingsPromptJapanese: "Japanese preset",
  settingsPromptEnglish: "English preset",
  settingsPromptHint: "Keep this short. Use it for names, brand spelling, natural Japanese writing, or mixed Japanese/English dictation.",
  settingsOverlayScaleTitle: "Overlay scale",
  settingsOverlayScaleDescription: "Adjust the floating recording UI size.",
  settingsLoading: "Loading settings...",
  settingsHotkeyUpdating: "Updating the native shortcut...",
  settingsHotkeyUpdated: "Shortcut updated.",
  settingsHotkeyIdleHint: "The shortcut updates as soon as you release the keys.",
  settingsDiagnosticsCopied: "Diagnostics copied.",
  settingsDiagnosticsCopyFailed: "Failed to copy diagnostics.",
  settingsCopyDiagnostics: "Copy diagnostics",
  settingsClearDiagnostics: "Clear",
  settingsBackend: "Backend",
  settingsTier: "Tier",
  settingsPlannedNativeBackend: "Native backend",
  settingsFunctionKeys: "Function keys",
  settingsNavigationKeys: "Navigation keys",
  settingsModifierOnly: "Modifier only",
  settingsMouseButtons: "Mouse buttons",
  settingsVendorKeys: "Vendor keys",
  settingsPermission: "Permission",
  settingsStatus: "Status",
  settingsNativeRuntime: "Native runtime",
  settingsNativePreflight: "Native preflight",
  settingsWorksWell: "Works well",
  settingsStillLimited: "Still limited",
  settingsChecking: "Checking",
  settingsRequestPermission: "Request permission",
  settingsRequesting: "Requesting",
  settingsProbeNativeBackend: "Probe native backend",
  settingsProbing: "Probing",
  settingsInputMonitoringRequested: "Input monitoring requested.",
  settingsYes: "Yes",
  settingsNo: "No",
  navBilling: "Billing",
  billingDescription: "Manage your plan, credits, and billing status from one place.",
  currentPlanLabel: "Current plan",
  planDetails: "Plan details",
  accountLabel: "Account",
  authChecking: "Checking access...",
  loginBadge: "Desktop app",
  loginFeatureBrowser: "Browser sign-in",
  loginFeatureHotkey: "Global shortcut",
  loginFeatureHistory: "Recent history",
  loginApprovalDescription: "Approve the sign-in in your browser and come back to the desktop app.",
  loginBrowserHint: "You will be redirected back automatically.",
  manualInsertTitle: "Insert text manually",
  manualInsertDescription: "Paste text here if you need to add content without recording.",
  close: "Close",
  copy: "Copy",
};

const JA: Copy = {
  shellEyebrowHome: "ワークスペース",
  shellEyebrowSettings: "設定",
  shellTitle: "WhisperType",
  shellDescription: "ショートカット、文字起こし言語、プラン、クレジットをひとつの画面で管理できます。",
  settingsDescription: "アプリの動作、録音設定、アカウント関連の設定を調整できます。",
  navHome: "ホーム",
  navSettings: "設定",
  signOut: "サインアウト",
  signedIn: "サインイン中",
  noEmail: "メールなし",
  voiceInput: "音声入力",
  stateIdleTitle: "待機中",
  stateIdleDescription: "ショートカットを押して、離すと挿入されます。",
  stateRecordingTitle: "録音中",
  stateRecordingDescription: "自然に話してください。",
  stateTranscribingTitle: "文字起こし中",
  stateTranscribingDescription: "音声をテキストに変換しています。",
  stateFinishedTitle: "挿入完了",
  stateFinishedDescription: "対象アプリに送信しました。",
  badgeRecording: "録音中",
  badgeWorking: "処理中",
  badgeDone: "完了",
  quickControls: "クイック設定",
  quickControlsDescription: "よく使う設定をすぐ触れる場所にまとめます。",
  appLanguage: "アプリ言語",
  appLanguageDescription: "UI の言語を選択します。次回起動時も同じ設定が使われます。",
  transcriptionLanguage: "文字起こし言語",
  model: "モデル",
  shortcut: "ショートカット",
  openAdvancedSettings: "詳細設定を開く",
  recent: "最近の履歴",
  recentDescription: "最新の文字起こし結果が自動で表示されます。",
  noRecent: "まだ最近の文字起こしはありません。",
  noTextReturned: "テキストが返されませんでした",
  credits: "クレジット",
  creditsBalance: "残高",
  holdToTalk: "押し続けて話す",
  recordTranscribeInsert: "録音、文字起こし、挿入。",
  activeShortcut: "現在のショートカット",
  homeStatusTitle: "音声入力の準備ができています",
  homeStatusDescription: "ショートカットを押して自然に話すだけで、任意のアプリに文字を入力できます。",
  shortcutCardTitle: "ショートカット",
  shortcutCardDescription: "一度クリックして、設定したショートカットを押して離すと保存されます。",
  quickSettingsTitle: "クイック設定",
  quickSettingsDescription: "メイン画面から言語とモデルをすぐ変更できます。",
  promoCardTitle: "プロモーションコード",
  promoCardDescription: "プロモーションコードを適用してクレジットを追加します。",
  promoCardHint: "コードはキャンペーンが有効なときにプラン画面から受け取れます。",
  shortcutRecorderTitle: "ショートカットを設定",
  continueWithGoogle: "Google で続行",
  loginHeadline: "一度サインインすれば、音声入力をすぐ使えます。",
  loginDescription: "WhisperType はブラウザで Google サインインを開き、デスクトップアプリに戻って入力に集中できるようにします。",
  openingBrowser: "ブラウザを開いています...",
  signInWithGoogle: "Google でサインイン",
  workspaceSummaryTitle: "ワークスペース概要",
  workspaceSummaryDescription: "残高とアカウントをひと目で確認できます。",
  sessionLabel: "セッション",
  accessLabel: "アクセス",
  accessReady: "準備完了",
  accessSyncing: "同期中",
  settingsHotkeyTitle: "ショートカット",
  settingsHotkeyDescription: "音声入力を開始するときに使うキー操作を設定します。",
  settingsPromptTitle: "プロンプトの挙動",
  settingsPromptDescription: "名前、混在言語、文体の補助に使う詳細な指示です。",
  settingsPromoTitle: "プロモーションコード",
  settingsPromoDescription: "キャンペーンや紹介特典はここで受け取ります。",
  settingsPromoPlaceholder: "プロモーションコードを入力",
  settingsPromoClaim: "クレジットを受け取る",
  settingsPromoNote: "この機能はまだ公開前です。将来のキャンペーン用に予約しています。",
  settingsPromptClear: "プロンプトを消去",
  settingsPromptJapanese: "日本語プリセット",
  settingsPromptEnglish: "英語プリセット",
  settingsPromptHint: "短く保ってください。名前、ブランド表記、自然な日本語、日英混在の文字起こしに使います。",
  settingsOverlayScaleTitle: "オーバーレイのサイズ",
  settingsOverlayScaleDescription: "録音 UI の大きさを調整します。",
  settingsLoading: "設定を読み込んでいます...",
  settingsHotkeyUpdating: "ネイティブショートカットを更新中...",
  settingsHotkeyUpdated: "ショートカットを更新しました。",
  settingsHotkeyIdleHint: "キーを離すとすぐにショートカットが更新されます。",
  settingsDiagnosticsCopied: "診断情報をコピーしました。",
  settingsDiagnosticsCopyFailed: "診断情報をコピーできませんでした。",
  settingsCopyDiagnostics: "診断情報をコピー",
  settingsClearDiagnostics: "クリア",
  settingsBackend: "バックエンド",
  settingsTier: "ティア",
  settingsPlannedNativeBackend: "ネイティブ backend",
  settingsFunctionKeys: "ファンクションキー",
  settingsNavigationKeys: "ナビゲーションキー",
  settingsModifierOnly: "修飾キーのみ",
  settingsMouseButtons: "マウスボタン",
  settingsVendorKeys: "ベンダーキー",
  settingsPermission: "権限",
  settingsStatus: "状態",
  settingsNativeRuntime: "ネイティブ runtime",
  settingsNativePreflight: "ネイティブ事前確認",
  settingsWorksWell: "問題なく動作",
  settingsStillLimited: "一部制限あり",
  settingsChecking: "確認中",
  settingsRequestPermission: "権限を要求",
  settingsRequesting: "要求中",
  settingsProbeNativeBackend: "ネイティブ backend を確認",
  settingsProbing: "確認中",
  settingsInputMonitoringRequested: "Input Monitoring の要求を送信しました。",
  settingsYes: "はい",
  settingsNo: "いいえ",
  navBilling: "プラン",
  billingDescription: "プラン、クレジット、請求状態をひとつの画面で管理します。",
  currentPlanLabel: "現在のプラン",
  planDetails: "プラン詳細",
  accountLabel: "アカウント",
  authChecking: "アクセスを確認中...",
  loginBadge: "デスクトップアプリ",
  loginFeatureBrowser: "ブラウザサインイン",
  loginFeatureHotkey: "グローバルショートカット",
  loginFeatureHistory: "最近の履歴",
  loginApprovalDescription: "ブラウザでサインインを承認して、デスクトップアプリに戻ってください。",
  loginBrowserHint: "自動で戻ります。",
  manualInsertTitle: "テキストを手動で挿入",
  manualInsertDescription: "録音せずに内容を追加したい場合はここへ貼り付けてください。",
  close: "閉じる",
  copy: "コピー",
};

const ES: Copy = {
  ...EN,
  shellEyebrowHome: "Espacio de trabajo",
  shellEyebrowSettings: "Preferencias",
  shellDescription: "Administra atajos, idioma de transcripción, plan y créditos desde un solo lugar.",
  settingsDescription: "Ajusta el comportamiento de la app, las preferencias de grabación y la cuenta.",
  navHome: "Inicio",
  navSettings: "Ajustes",
  signOut: "Cerrar sesión",
  signedIn: "Sesión iniciada",
  noEmail: "Sin correo",
  voiceInput: "Entrada de voz",
  homeStatusTitle: "La entrada de voz está lista",
  homeStatusDescription: "Pulsa tu atajo, habla con naturalidad y envía texto a cualquier app.",
  recent: "Recientes",
  currentPlanLabel: "Plan actual",
  planDetails: "Detalles del plan",
  billingDescription: "Gestiona tu plan, créditos y estado de facturación desde un solo lugar.",
  loginBadge: "Aplicación de escritorio",
  accessReady: "Listo",
  accessSyncing: "Sincronizando",
  settingsHotkeyUpdated: "Atajo actualizado.",
  settingsHotkeyUpdating: "Actualizando el atajo nativo...",
  close: "Cerrar",
  copy: "Copiar",
};

export const COPY: Record<AppLocale, Copy> = { en: EN, ja: JA, es: ES };
