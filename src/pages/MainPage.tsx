import { useEffect, useMemo, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Check, ChevronDown, Home, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HotkeyRecorder } from "@/components/HotkeyRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/useAuth";
import { getAppCopy, type AppLocale } from "@/lib/appLocale";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { DEFAULT_APP_SETTINGS, readAppSettings, writeAppSettings, type AppSettings } from "@/lib/appSettings";
import { readOverlayScale, writeOverlayScale } from "@/lib/uiPreferences";
import { requestPreferredAudioStream } from "@/lib/audioCapture";
import { DEFAULT_TRANSCRIPTION_PROMPT, ENGLISH_TRANSCRIPTION_PROMPT, JAPANESE_TRANSCRIPTION_PROMPT } from "@/lib/transcription";
import { supabase } from "@/lib/supabase";
import { DEFAULT_HOTKEY, LANGUAGE_OPTIONS, MODEL_OPTIONS, getUiCopy, type HotkeyBackendInfo } from "@/pages/settingsPageData";
import waveformGradientImage from "@/assets/waveform-gradient.png";
import { useNavigate } from "react-router-dom";
import { MainPageHeaderActions } from "@/pages/MainPageHeaderActions";
import { MainPageHistorySection } from "@/pages/MainPageHistorySection";
import { MainPagePlanSection } from "@/pages/MainPagePlanSection";
import { GLASS_CARD, GLASS_PANEL, NAV_ITEMS, type MainPageSectionId, type PromoResult, type PromoRpcRow, type RecentHistoryItem } from "@/pages/mainPageTypes";

export default function MainPage({
  appLocale,
  onAppLocaleChange,
  onRestartTutorial,
}: {
  appLocale: AppLocale;
  onAppLocaleChange: (locale: AppLocale) => void;
  onRestartTutorial?: () => void;
}) {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<MainPageSectionId>("home");
  const [hotkey, setHotkey] = useState("Ctrl+Alt");
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_APP_SETTINGS,
    hotkey: DEFAULT_HOTKEY,
    overlayScale: readOverlayScale(),
  });
  const [hotkeyStatusMessage, setHotkeyStatusMessage] = useState("");
  const [hotkeyBackendInfo, setHotkeyBackendInfo] = useState<HotkeyBackendInfo | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoResult>(null);
  const [celebrationCredits, setCelebrationCredits] = useState<number | null>(null);
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const [micState, setMicState] = useState<"checking" | "available" | "missing" | "blocked">("checking");
  const [recentHistory, setRecentHistory] = useState<RecentHistoryItem[]>([]);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const copy = getAppCopy(appLocale);
  const ui = getUiCopy(appLocale);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const parsed = readAppSettings();
    setSettings({
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      hotkey: normalizeHotkeyForDisplay(parsed.hotkey || DEFAULT_HOTKEY),
      overlayScale: parsed.overlayScale ?? readOverlayScale(),
    });
    setHotkey(normalizeHotkeyForDisplay(parsed.hotkey || DEFAULT_HOTKEY));
  }, []);

  useEffect(() => {
    const checkMicrophone = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicState("missing");
        return;
      }

      try {
        const stream = await requestPreferredAudioStream();
        stream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMicState(devices.some((device) => device.kind === "audioinput") ? "available" : "missing");
      } catch (error) {
        setMicState(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "missing");
      }
    };

    void checkMicrophone();
  }, []);

  useEffect(() => {
    void invoke<HotkeyBackendInfo>("get_hotkey_backend_info").then(setHotkeyBackendInfo).catch((err) => console.error("get_hotkey_backend_info failed:", err));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchRecentHistory = async () => {
      const { data, error } = await supabase
        .from("transcription_history")
        .select("id, transcribed_text, created_at, credits_used")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent history:", error);
        return;
      }

      setRecentHistory((data ?? []) as RecentHistoryItem[]);
    };

    void fetchRecentHistory();

    let unlistenFinished: (() => void) | undefined;
    listen("transcription-finished", () => {
      void fetchRecentHistory();
    }).then((fn) => {
      unlistenFinished = fn;
    });

    return () => {
      unlistenFinished?.();
    };
  }, [user]);

  useEffect(() => {
    const save = window.setTimeout(() => {
      writeAppSettings({ ...settings, hotkey });
      writeOverlayScale(settings.overlayScale);
    }, 180);
    return () => window.clearTimeout(save);
  }, [hotkey, settings]);

  useEffect(() => {
    if (celebrationCredits === null) return;
    const id = window.setTimeout(() => setCelebrationCredits(null), 1600);
    return () => window.clearTimeout(id);
  }, [celebrationCredits]);

  useEffect(() => {
    const observedSections = NAV_ITEMS.map((item) => sectionRefs.current[item.id]).filter((element): element is HTMLElement => Boolean(element));
    if (observedSections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id as MainPageSectionId);
        }
      },
      { root: null, rootMargin: "-20% 0px -55% 0px", threshold: [0.2, 0.35, 0.5, 0.65] },
    );

    observedSections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      sectionRefs.current = {};
    };
  }, []);


  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id as MainPageSectionId);
  };

  const handleHotkeyChange = async (nextHotkey: string) => {
    const normalized = normalizeHotkeyForDisplay(nextHotkey);
    setHotkey(normalized);

    try {
      await invoke<string>("set_global_shortcut", { shortcut: normalizeHotkeyForNative(normalized) });
      setHotkeyStatusMessage(copy.settingsHotkeyUpdated);
    } catch {
      setHotkeyStatusMessage(appLocale === "ja" ? "更新できませんでした。" : appLocale === "es" ? "No se pudo actualizar." : "Could not update.");
    }
  };

  const currentPlanLabel = profile?.plan === "plus" ? "Plus" : appLocale === "ja" ? "フリー" : "Free";
  const languageLabel = LANGUAGE_OPTIONS.find((option) => option.value === settings.language)?.labels[appLocale] ?? settings.language;
  const modelLabel = MODEL_OPTIONS.find((option) => option.value === settings.model)?.labels[appLocale] ?? settings.model;
  const shortcutLabel = hotkey;

  const planMeta = useMemo(
    () =>
      ({
        free: {
          title: appLocale === "ja" ? "フリー" : "Free",
          price: appLocale === "ja" ? "¥0" : "$0",
          features: appLocale === "ja" ? ["毎月 300 credits", "標準の書き起こし", "最近の履歴"] : ["300 credits per month", "Standard transcription", "Recent history"],
          notes: appLocale === "ja" ? ["無料で試したい方向け", "credits は毎月更新されます"] : ["For getting started", "Credits reset each month"],
        },
        plus: {
          title: "WhisperType Plus",
          price: appLocale === "ja" ? "¥300" : "$3",
          features: appLocale === "ja" ? ["無制限 credits", "高速書き起こし", "優先的な請求サポート"] : ["Unlimited credits", "Unlimited transcription", "Priority billing support"],
          notes: appLocale === "ja" ? ["月額 300 円", "いつでも解約できます"] : ["Billed monthly", "Cancel anytime"],
        },
      }) as const,
    [appLocale]
  );

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim() || !user) return;
    setIsRedeemingPromo(true);
    setPromoResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("redeem_promo_code", { input_code: promoCode });
      if (rpcError) throw rpcError;

      const row = (Array.isArray(data) ? data[0] : data) as PromoRpcRow | null;

      if (row?.status === "redeemed") {
        setPromoResult({
          kind: "success",
          title: appLocale === "ja" ? "クレジットを追加しました" : "Credits added",
          message: appLocale === "ja" ? `${row.reward_credits ?? 0} credits` : `+${row.reward_credits ?? 0}`,
        });
        setPromoCode("");
        setCelebrationCredits(row.reward_credits ?? 0);
        await refreshProfile();
      } else {
        setPromoResult({
          kind: "error",
          title: appLocale === "ja" ? "プロモーションコード" : "Promotion code",
          message: row?.message ?? (appLocale === "ja" ? "無効なコードです。" : "Invalid code."),
        });
      }
    } catch (err) {
      console.error("Redeem promo code failed:", err);
      setPromoResult({
        kind: "error",
        title: appLocale === "ja" ? "エラー" : "Error",
        message: appLocale === "ja" ? "コード適用中に問題が発生しました。" : "Something went while applying the code.",
      });
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const localeLabel = useMemo(() => {
    if (appLocale === "ja") return "日本語";
    if (appLocale === "es") return "Español";
    return "English";
  }, [appLocale]);

  const sectionIconClass = "h-5 w-5 shrink-0 text-slate-600 dark:text-slate-200";
  const sectionTitleClass = "text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100";
  const sectionValueClass = "text-sm font-semibold text-slate-900 dark:text-slate-100";
  const sectionLabelClass = "text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";

  const sectionHeaderClass = "flex items-center gap-3";
  const sectionAccentClass = "h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10";
  const sectionAccent = useMemo(
    () => (
      <div className={sectionAccentClass}>
        <img src={waveformGradientImage} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      </div>
    ),
    []
  );
  const historyLabel = appLocale === "ja" ? "履歴" : "History";

  const handleCopyHistory = async (item: RecentHistoryItem) => {
    if (!item.transcribed_text) return;
    await navigator.clipboard.writeText(item.transcribed_text);
    setCopiedHistoryId(item.id);
    window.setTimeout(() => setCopiedHistoryId((current) => (current === item.id ? null : current)), 1200);
  };

  return (
    <AppShell
      appLocale={appLocale}
      navItems={NAV_ITEMS.map((item) => ({ id: item.id, label: item.label[appLocale === "ja" ? "ja" : "en"] }))}
      activeNavId={activeSection}
      onNavItemClick={scrollToSection}
      headerActions={
        <MainPageHeaderActions
          appLocale={appLocale}
          isLocaleMenuOpen={isLocaleMenuOpen}
          localeLabel={localeLabel}
          onAppLocaleChange={onAppLocaleChange}
          onLocaleMenuOpenChange={setIsLocaleMenuOpen}
          onRestartTutorial={onRestartTutorial}
        />
      }
    >
      <div className="space-y-6">
        <section ref={(el) => { sectionRefs.current.home = el; }} id="home" className="scroll-mt-8">
          <div className="space-y-6">
            <div className={sectionHeaderClass}>
              <Home className={sectionIconClass} />
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className={sectionTitleClass}>{appLocale === "ja" ? "ホーム" : "Home"}</p>
                  {sectionAccent}
                </div>
              </div>
            </div>

            <div className="grid gap-5 rounded-[30px] border border-white/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(244,247,252,0.92),rgba(255,255,255,0.8))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03),rgba(255,255,255,0.05))] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    {appLocale === "ja" ? "準備完了" : "Ready"}
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                    {appLocale === "ja" ? "音声入力の準備ができています" : "Voice input is ready"}
                  </p>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {appLocale === "ja" ? `${shortcutLabel} を押して開始` : `Press ${shortcutLabel} to start`}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {micState === "available"
                      ? appLocale === "ja"
                        ? "マイク利用可能"
                        : "Mic available"
                      : micState === "blocked"
                        ? appLocale === "ja"
                          ? "マイク許可が必要"
                          : "Mic permission needed"
                        : appLocale === "ja"
                          ? "マイクを確認中"
                          : "Checking mic"}
                  </span>
                </div>
              </div>

              <div className="relative flex min-h-[280px] items-center justify-center overflow-visible rounded-[26px] p-3 lg:min-h-[340px]">
                <img
                  src="/hero-woman-transparent.png"
                  alt={appLocale === "ja" ? "音声入力のイラスト" : "Voice input illustration"}
                  className="relative z-10 block h-auto w-auto max-h-[clamp(280px,34vw,420px)] max-w-full object-contain object-center"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className={GLASS_PANEL + " px-4 py-3"}>
                <p className={sectionLabelClass}>Plan</p>
                <p className={`mt-1 ${sectionValueClass}`}>{currentPlanLabel}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={GLASS_PANEL + " group flex w-full items-center justify-between px-4 py-3 text-left"}>
                    <div>
                      <p className={sectionLabelClass}>Language</p>
                      <p className={`mt-1 ${sectionValueClass}`}>{languageLabel}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 ease-out group-hover:translate-y-[1px] dark:text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => setSettings((current) => ({ ...current, language: option.value }))}
                      className={settings.language === option.value ? "bg-black/[0.06] font-semibold dark:bg-white/10" : ""}
                    >
                      <span>{option.labels[appLocale]}</span>
                      {settings.language === option.value ? <Check className="h-4 w-4" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={GLASS_PANEL + " group flex w-full items-center justify-between px-4 py-3 text-left"}>
                    <div>
                      <p className={sectionLabelClass}>Model</p>
                      <p className={`mt-1 ${sectionValueClass}`}>{modelLabel}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 ease-out group-hover:translate-y-[1px] dark:text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {MODEL_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => setSettings((current) => ({ ...current, model: option.value }))}
                      className={settings.model === option.value ? "bg-black/[0.06] font-semibold dark:bg-white/10" : ""}
                    >
                      <span>{option.labels[appLocale]}</span>
                      {settings.model === option.value ? <Check className="h-4 w-4" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </section>

        <MainPageHistorySection
          copy={copy}
          copiedHistoryId={copiedHistoryId}
          historyLabel={historyLabel}
          recentHistory={recentHistory}
          sectionAccent={sectionAccent}
          sectionHeaderClass={sectionHeaderClass}
          sectionIconClass={sectionIconClass}
          sectionTitleClass={sectionTitleClass}
          onCopyHistory={(item) => {
            void handleCopyHistory(item);
          }}
          setSectionRef={(element) => {
            sectionRefs.current.history = element;
          }}
        />

        <section ref={(el) => { sectionRefs.current.settings = el; }} id="settings" className="scroll-mt-8">
          <div className="mb-3">
            <div className={sectionHeaderClass}>
              <SlidersHorizontal className={sectionIconClass} />
              <p className={sectionTitleClass}>{appLocale === "ja" ? "設定" : "Settings"}</p>
              {sectionAccent}
            </div>
          </div>
          <Card className={GLASS_CARD}>
            <CardContent className="space-y-4 pt-6">
              <div className={GLASS_PANEL + " p-4"}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {appLocale === "ja" ? "ショートカットキー" : "Shortcut key"}
                </p>
                <div className="mt-3">
                  <HotkeyRecorder
                    value={hotkey}
                    allowModifierOnly={hotkeyBackendInfo?.supports_modifier_only ?? false}
                    allowMouseButtons={hotkeyBackendInfo?.supports_mouse_buttons ?? false}
                    labels={{
                      listening: appLocale === "ja" ? "入力中" : "Listening",
                      currentHotkey: appLocale === "ja" ? "現在のキー" : "Current",
                      pressNow: appLocale === "ja" ? "キーを押してください" : "Press now",
                      helper: appLocale === "ja" ? "カードをクリックして、キーを押して、離すと保存されます。" : "Click, press keys, then release to save.",
                      unsupportedMouseButtons: appLocale === "ja" ? "この環境ではマウスボタンは使えません。" : "Mouse buttons are not available.",
                      unidentifiedInput: appLocale === "ja" ? "入力を判別できませんでした。" : "Input could not be identified.",
                    }}
                    onChange={(next) => {
                      void handleHotkeyChange(next);
                    }}
                    onInvalid={(message) => setHotkeyStatusMessage(message)}
                    className="w-full"
                  />
                  {hotkeyStatusMessage ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">{hotkeyStatusMessage}</p> : null}
                </div>
              </div>

              <div className={GLASS_PANEL + " p-4"}>
                <div className="flex items-center justify-between">
                  <label htmlFor="overlay-scale" className="text-sm">{ui.overlayScale}</label>
                  <span className="text-xs font-semibold">{settings.overlayScale.toFixed(2)}x</span>
                </div>
                <input
                  id="overlay-scale"
                  type="range"
                  min="0.8"
                  max="2"
                  step="0.05"
                  value={settings.overlayScale}
                  aria-label={ui.overlayScale}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      overlayScale: Number.parseFloat(event.target.value),
                    }))
                  }
                  className="mt-3 w-full accent-black dark:accent-white"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(["showOverlay", "showWaveform", "playStartSound", "playStopSound", "autoInsert"] as const).map((key) => (
                  <div key={key} className={GLASS_PANEL + " flex items-center justify-between px-4 py-3"}>
                    <span className="text-sm text-slate-700 dark:text-slate-200">{ui[key]}</span>
                    <Switch
                      checked={Boolean(settings[key])}
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          [key]: !Boolean(current[key]),
                        }))
                      }
                      className="bg-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className={GLASS_PANEL + " p-4"}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {appLocale === "ja" ? "プロンプト" : "Prompt"}
                </p>
                <textarea
                  value={settings.prompt}
                  onChange={(event) => setSettings((current) => ({ ...current, prompt: event.target.value }))}
                  rows={5}
                  className="mt-3 w-full rounded-2xl border border-white/25 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-none outline-none dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: DEFAULT_TRANSCRIPTION_PROMPT }))}>
                    {appLocale === "ja" ? "初期値" : "Reset"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: JAPANESE_TRANSCRIPTION_PROMPT }))}>
                    JP
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSettings((current) => ({ ...current, prompt: ENGLISH_TRANSCRIPTION_PROMPT }))}>
                    EN
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        <MainPagePlanSection
          appLocale={appLocale}
          sectionAccent={sectionAccent}
          sectionHeaderClass={sectionHeaderClass}
          sectionIconClass={sectionIconClass}
          sectionTitleClass={sectionTitleClass}
          planMeta={planMeta}
          promoCode={promoCode}
          isRedeemingPromo={isRedeemingPromo}
          promoResult={promoResult}
          celebrationCredits={celebrationCredits}
          onPromoCodeChange={setPromoCode}
          onRedeemPromoCode={() => {
            void handleRedeemPromoCode();
          }}
          onUpgradePlus={() => {
            navigate("/plan/checkout", { state: { plan: "plus" } });
          }}
          setSectionRef={(element) => {
            sectionRefs.current.plan = element;
          }}
        />
      </div>
    </AppShell>
  );
}



