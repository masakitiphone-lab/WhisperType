import type { AppLocale } from "@/lib/appLocale";
import type { TranscriptionLanguage, TranscriptionModel } from "@/lib/transcription";

export const DEFAULT_HOTKEY = "Ctrl+Alt";

export type HotkeyBackendInfo = {
  backend_name: string;
  platform: string;
  backend_tier: string;
  planned_native_backend: string | null;
  supports_modifier_only: boolean;
  supports_function_keys: boolean;
  supports_navigation_keys: boolean;
  supports_mouse_buttons: boolean;
  supports_vendor_keys: boolean;
  requires_accessibility_permission: boolean;
  required_permission_name: string | null;
  permission_hint: string | null;
  supported_examples: string[];
  unsupported_examples: string[];
  notes: string[];
};

export const LANGUAGE_OPTIONS: Array<{ value: TranscriptionLanguage; labels: Record<AppLocale, string> }> = [
  { value: "auto", labels: { en: "Auto", ja: "自動", es: "Auto" } },
  { value: "ja", labels: { en: "Japanese", ja: "日本語", es: "Japonés" } },
  { value: "en", labels: { en: "English", ja: "英語", es: "Inglés" } },
  { value: "es", labels: { en: "Spanish", ja: "スペイン語", es: "Español" } },
  { value: "fr", labels: { en: "French", ja: "フランス語", es: "Francés" } },
  { value: "de", labels: { en: "German", ja: "ドイツ語", es: "Alemán" } },
  { value: "it", labels: { en: "Italian", ja: "イタリア語", es: "Italiano" } },
  { value: "pt", labels: { en: "Portuguese", ja: "ポルトガル語", es: "Portugués" } },
  { value: "zh", labels: { en: "Chinese", ja: "中国語", es: "Chino" } },
  { value: "ko", labels: { en: "Korean", ja: "韓国語", es: "Coreano" } },
];

export const MODEL_OPTIONS: Array<{ value: TranscriptionModel; labels: Record<AppLocale, string> }> = [
  { value: "whisper-large-v3-turbo", labels: { en: "Turbo model", ja: "Turbo モデル", es: "Modelo turbo" } },
  { value: "whisper-large-v3", labels: { en: "Full model", ja: "高精度モデル", es: "Modelo completo" } },
];

export type UiCopyKey =
  | "interfaceTitle"
  | "interfaceDescription"
  | "transcriptionLanguage"
  | "model"
  | "hotkeyTitle"
  | "hotkeyDescription"
  | "hotkeyIdleHint"
  | "overlayTitle"
  | "overlayDescription"
  | "promptTitle"
  | "promptDescription"
  | "showOverlay"
  | "showWaveform"
  | "playStartSound"
  | "playStopSound"
  | "autoInsert"
  | "useClipboardPaste"
  | "soundVolume"
  | "overlayScale"
  | "backend"
  | "worksWell"
  | "stillLimited"
  | "inputMonitoring"
  | "nativeRuntime"
  | "preflight"
  | "requestPermission"
  | "probeNative"
  | "copyDiagnostics"
  | "clearDiagnostics"
  | "recentLogsTitle"
  | "recentLogsDescription"
  | "clearLogs"
  | "clearPrompt"
  | "presetJapanese"
  | "presetEnglish"
  | "yes"
  | "no"
  | "checking"
  | "requesting"
  | "probing";

export type UiCopy = Record<UiCopyKey, string>;

const EN: UiCopy = {
  interfaceTitle: "Transcription settings",
  interfaceDescription: "Adjust language, model, shortcut, and display settings in one place.",
  transcriptionLanguage: "Transcription language",
  model: "Model",
  hotkeyTitle: "Shortcut",
  hotkeyDescription: "Choose a shortcut that lets you start dictation instantly while you work.",
  hotkeyIdleHint: "Click the card, press the shortcut, then release all keys to save it.",
  overlayTitle: "Overlay and sound",
  overlayDescription: "Control the floating UI and sounds during recording.",
  promptTitle: "Prompt",
  promptDescription: "Use this only when you need help with names, style, or context.",
  showOverlay: "Show overlay",
  showWaveform: "Show waveform",
  playStartSound: "Play start sound",
  playStopSound: "Play success sound",
  autoInsert: "Auto insert",
  useClipboardPaste: "Use clipboard paste",
  soundVolume: "Sound volume",
  overlayScale: "Overlay size",
  backend: "Shortcut compatibility",
  worksWell: "Works well",
  stillLimited: "Still limited",
  inputMonitoring: "Input Monitoring",
  nativeRuntime: "Native runtime",
  preflight: "Preflight",
  requestPermission: "Request permission",
  probeNative: "Probe native backend",
  copyDiagnostics: "Copy diagnostics",
  clearDiagnostics: "Clear",
  recentLogsTitle: "Recent logs",
  recentLogsDescription: "Latest transcription and app events from this session.",
  clearLogs: "Clear logs",
  clearPrompt: "Clear",
  presetJapanese: "Japanese preset",
  presetEnglish: "English preset",
  yes: "Yes",
  no: "No",
  checking: "Checking",
  requesting: "Requesting",
  probing: "Probing",
};

const JA: UiCopy = {
  interfaceTitle: "音声入力設定",
  interfaceDescription: "言語、モデル、ショートカット、表示設定をまとめて調整できます。",
  transcriptionLanguage: "文字起こし言語",
  model: "モデル",
  hotkeyTitle: "ショートカット",
  hotkeyDescription: "音声入力をすぐに始められるキー操作を設定します。",
  hotkeyIdleHint: "カードをクリックし、設定したいキーを押してから離すと保存されます。",
  overlayTitle: "オーバーレイと音",
  overlayDescription: "録音中の表示や効果音の動作を調整します。",
  promptTitle: "プロンプト",
  promptDescription: "名前、混在言語、文体などを補助したいときだけ使います。",
  showOverlay: "オーバーレイを表示",
  showWaveform: "波形を表示",
  playStartSound: "開始音を再生",
  playStopSound: "完了音を再生",
  autoInsert: "自動で挿入",
  useClipboardPaste: "クリップボード貼り付けを使う",
  soundVolume: "音量",
  overlayScale: "オーバーレイのサイズ",
  backend: "ショートカット互換性",
  worksWell: "問題なく動作",
  stillLimited: "一部制限あり",
  inputMonitoring: "Input Monitoring",
  nativeRuntime: "ネイティブ実行状態",
  preflight: "事前確認",
  requestPermission: "権限を要求",
  probeNative: "ネイティブバックエンドを確認",
  copyDiagnostics: "診断情報をコピー",
  clearDiagnostics: "クリア",
  recentLogsTitle: "直近ログ",
  recentLogsDescription: "このセッションの最新イベントです。",
  clearLogs: "ログをクリア",
  clearPrompt: "クリア",
  presetJapanese: "日本語プリセット",
  presetEnglish: "英語プリセット",
  yes: "はい",
  no: "いいえ",
  checking: "確認中",
  requesting: "要求中",
  probing: "確認中",
};

const ES: UiCopy = {
  interfaceTitle: "Configuración de transcripción",
  interfaceDescription: "Ajusta idioma, modelo, atajos y visualización en un solo lugar.",
  transcriptionLanguage: "Idioma de transcripción",
  model: "Modelo",
  hotkeyTitle: "Atajo",
  hotkeyDescription: "Configura un atajo cómodo para empezar a dictar al instante.",
  hotkeyIdleHint: "Haz clic en la tarjeta, pulsa la combinación y suelta todas las teclas para guardarla.",
  overlayTitle: "Overlay y sonido",
  overlayDescription: "Controla la interfaz flotante y el sonido durante la grabación.",
  promptTitle: "Prompt",
  promptDescription: "Úsalo solo cuando necesites ayuda con nombres, estilo o contexto.",
  showOverlay: "Mostrar overlay",
  showWaveform: "Mostrar forma de onda",
  playStartSound: "Reproducir sonido inicial",
  playStopSound: "Reproducir sonido final",
  autoInsert: "Insertar automáticamente",
  useClipboardPaste: "Usar pegado del portapapeles",
  soundVolume: "Volumen",
  overlayScale: "Tamaño del overlay",
  backend: "Compatibilidad del atajo",
  worksWell: "Funciona bien",
  stillLimited: "Aún tiene límites",
  inputMonitoring: "Input Monitoring",
  nativeRuntime: "Estado nativo",
  preflight: "Preflight",
  requestPermission: "Solicitar permiso",
  probeNative: "Comprobar backend nativo",
  copyDiagnostics: "Copiar diagnóstico",
  clearDiagnostics: "Limpiar",
  recentLogsTitle: "Registros recientes",
  recentLogsDescription: "Eventos recientes de la sesión actual.",
  clearLogs: "Borrar registros",
  clearPrompt: "Limpiar",
  presetJapanese: "Preajuste japonés",
  presetEnglish: "Preajuste inglés",
  yes: "Sí",
  no: "No",
  checking: "Comprobando",
  requesting: "Solicitando",
  probing: "Comprobando",
};

export function getUiCopy(locale: AppLocale): UiCopy {
  if (locale === "ja") return JA;
  if (locale === "es") return ES;
  return EN;
}
