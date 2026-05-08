import { useEffect, useMemo, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/useAuth";
import { getAppCopy, type AppLocale } from "@/lib/appLocale";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { DEFAULT_APP_SETTINGS, readAppSettings, writeAppSettings, type AppSettings } from "@/lib/appSettings";
import { getOverlayCapsuleStageHeight, getOverlayCapsuleStageWidth } from "@/lib/overlayLayout";
import { resizeOverlayWindowForPreferences, selectOverlayLayoutPreferences, setNativeOverlayLayoutPreferences } from "@/lib/overlayLayoutPreferences";
import { readOverlayScale } from "@/lib/uiPreferences";
import { requestPreferredAudioStream } from "@/lib/audioCapture";
import { supabase } from "@/lib/supabase";
import { DEFAULT_HOTKEY, LANGUAGE_OPTIONS, MODEL_OPTIONS, getUiCopy, type HotkeyBackendInfo } from "@/pages/settingsPageData";
import { useNavigate } from "react-router-dom";
import { MainPageDeleteAccountDialog } from "@/pages/MainPageDeleteAccountDialog";
import { MainPageHeaderActions } from "@/pages/MainPageHeaderActions";
import { MainPageHistorySection } from "@/pages/MainPageHistorySection";
import { MainPageHomeSection } from "@/pages/MainPageHomeSection";
import { MainPagePlanSection } from "@/pages/MainPagePlanSection";
import { MainPageSettingsSection } from "@/pages/MainPageSettingsSection";
import { getDeleteAccountCopy, getMainPageLocaleLabel, getMainPagePlanMeta } from "@/pages/mainPageCopy";
import { NAV_ITEMS, type MainPageSectionId, type PromoResult, type PromoRpcRow, type RecentHistoryItem } from "@/pages/mainPageTypes";

type AudioInput = {
  deviceId: string;
  label: string;
};

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
  const { profile, user, refreshProfile, deleteAccountData } = useAuth();
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
  const [audioInputs, setAudioInputs] = useState<AudioInput[]>([]);
  const [micTestState, setMicTestState] = useState<"idle" | "testing" | "error">("idle");
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [recentHistory, setRecentHistory] = useState<RecentHistoryItem[]>([]);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const copy = getAppCopy(appLocale);
  const ui = getUiCopy(appLocale);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const micTestAudioContextRef = useRef<AudioContext | null>(null);
  const micTestAnimationFrameRef = useRef<number | null>(null);
  const micTestSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micTestAnalyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const parsed = readAppSettings();
    void setNativeOverlayLayoutPreferences(selectOverlayLayoutPreferences(parsed)).catch(() => {});
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
        const currentSettings = readAppSettings();
        const stream = await requestPreferredAudioStream(currentSettings.preferredAudioInputDeviceId || undefined);
        stream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(
          devices
            .filter((device) => device.kind === "audioinput")
            .map((device, index) => ({
              deviceId: device.deviceId,
              label: device.label || (appLocale === "ja" ? `マイク ${index + 1}` : `Microphone ${index + 1}`),
            })),
        );
        setMicState(devices.some((device) => device.kind === "audioinput") ? "available" : "missing");
      } catch (error) {
        setMicState(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "missing");
      }
    };

    void checkMicrophone();
  }, [appLocale]);

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
      void refreshProfile();
    }).then((fn) => {
      unlistenFinished = fn;
    });

    return () => {
      unlistenFinished?.();
    };
  }, [user]);

  useEffect(() => {
    const save = window.setTimeout(() => {
      const overlayPreferences = selectOverlayLayoutPreferences(settings);
      writeAppSettings({ ...settings, hotkey });
      void setNativeOverlayLayoutPreferences(overlayPreferences).catch(() => {});
      void resizeOverlayWindowForPreferences(
        getOverlayCapsuleStageWidth(),
        getOverlayCapsuleStageHeight(),
        overlayPreferences,
      ).catch(() => {});
      void emit("overlay-settings-changed", overlayPreferences).catch(() => {});
    }, 180);
    return () => window.clearTimeout(save);
  }, [hotkey, settings]);

  useEffect(() => {
    if (celebrationCredits === null) return;
    const id = window.setTimeout(() => setCelebrationCredits(null), 1600);
    return () => window.clearTimeout(id);
  }, [celebrationCredits]);

  const stopMicTest = async () => {
    if (micTestAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(micTestAnimationFrameRef.current);
      micTestAnimationFrameRef.current = null;
    }

    micTestSourceRef.current?.disconnect();
    micTestAnalyserRef.current?.disconnect();
    micTestSourceRef.current = null;
    micTestAnalyserRef.current = null;

    micTestStreamRef.current?.getTracks().forEach((track) => track.stop());
    micTestStreamRef.current = null;

    await micTestAudioContextRef.current?.close().catch(() => {
    });
    micTestAudioContextRef.current = null;
    setMicTestState("idle");
    setMicTestLevel(0);
  };

  const handleMicTest = async () => {
    if (micTestState === "testing") return;
    await stopMicTest();
    setMicTestState("testing");
    setMicTestLevel(0);

    try {
      const stream = await requestPreferredAudioStream(settings.preferredAudioInputDeviceId || undefined);
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.72;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      micTestStreamRef.current = stream;
      micTestAudioContextRef.current = audioContext;
      micTestSourceRef.current = source;
      micTestAnalyserRef.current = analyser;

      const samples = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (!micTestAnalyserRef.current) return;

        analyser.getFloatTimeDomainData(samples);
        let sumSquares = 0;
        let peak = 0;
        for (const sample of samples) {
          const absolute = Math.abs(sample);
          sumSquares += sample * sample;
          if (absolute > peak) peak = absolute;
        }

        const rms = Math.sqrt(sumSquares / samples.length);
        const rawLevel = Math.max(0, Math.min(1, rms * 3.2 + peak * 1.1));
        const easedLevel = Math.min(1, rawLevel * 1.12);
        setMicTestLevel((current) => current * 0.58 + easedLevel * 0.42);

        micTestAnimationFrameRef.current = window.requestAnimationFrame(tick);
      };

      micTestAnimationFrameRef.current = window.requestAnimationFrame(tick);
    } catch {
      await stopMicTest();
      setMicTestState("error");
    }
  };

  useEffect(() => {
    return () => {
      void stopMicTest();
    };
  }, []);

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
  const currentPlan = profile?.plan === "plus" ? "plus" : "free";
  const creditSummaryLabel =
    currentPlan === "plus"
      ? appLocale === "ja"
        ? "無制限"
        : "Unlimited"
      : appLocale === "ja"
        ? `デイリー ${profile?.dailyCredits ?? 50} / 50`
        : `Daily ${profile?.dailyCredits ?? 50} / 50`;
  const bonusCreditCount =
    currentPlan === "plus"
      ? null
      : (profile?.credits ?? 0) > 0
        ? profile?.credits ?? 0
        : null;
  const languageLabel = LANGUAGE_OPTIONS.find((option) => option.value === settings.language)?.labels[appLocale] ?? settings.language;
  const modelLabel = MODEL_OPTIONS.find((option) => option.value === settings.model)?.labels[appLocale] ?? settings.model;
  const shortcutLabel = hotkey;

  const planMeta = getMainPagePlanMeta(appLocale);

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

  const localeLabel = getMainPageLocaleLabel(appLocale);

  const sectionIconClass = "h-5 w-5 shrink-0 text-slate-600 dark:text-slate-200";
  const sectionTitleClass = "text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100";
  const sectionValueClass = "text-sm font-semibold text-slate-900 dark:text-slate-100";
  const sectionLabelClass = "text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";

  const sectionHeaderClass = "flex items-center gap-3";
  const sectionAccentClass =
    "h-1.5 w-20 shrink-0 rounded-full bg-[linear-gradient(90deg,#ff4d7d_0%,#ff8a5c_18%,#ffd84d_36%,#64e4a1_54%,#5dd6ff_72%,#9b8cff_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";
  const sectionAccent = useMemo(
    () => <div className={sectionAccentClass} aria-hidden="true" />,
    []
  );
  const historyLabel = appLocale === "ja" ? "履歴" : "History";

  const handleCopyHistory = async (item: RecentHistoryItem) => {
    if (!item.transcribed_text) return;
    await navigator.clipboard.writeText(item.transcribed_text);
    setCopiedHistoryId(item.id);
    window.setTimeout(() => setCopiedHistoryId((current) => (current === item.id ? null : current)), 1200);
  };

  const deleteAccountCopy = getDeleteAccountCopy(appLocale);

  const handleDeleteAccountData = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteAccountError(null);
      await deleteAccountData();
    } catch {
      setDeleteAccountError(deleteAccountCopy.error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
    {isDeleteAccountDialogOpen ? (
      <MainPageDeleteAccountDialog
        copy={deleteAccountCopy}
        error={deleteAccountError}
        isDeleting={isDeletingAccount}
        onCancel={() => {
          setDeleteAccountError(null);
          setIsDeleteAccountDialogOpen(false);
        }}
        onConfirm={() => {
          void handleDeleteAccountData();
        }}
      />
    ) : null}
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
        <MainPageHomeSection
          appLocale={appLocale}
          bonusCreditCount={bonusCreditCount}
          creditSummaryLabel={creditSummaryLabel}
          currentPlan={currentPlan}
          currentPlanLabel={currentPlanLabel}
          language={settings.language}
          languageLabel={languageLabel}
          micState={micState}
          model={settings.model}
          modelLabel={modelLabel}
          sectionAccent={sectionAccent}
          sectionHeaderClass={sectionHeaderClass}
          sectionIconClass={sectionIconClass}
          sectionLabelClass={sectionLabelClass}
          sectionTitleClass={sectionTitleClass}
          sectionValueClass={sectionValueClass}
          shortcutLabel={shortcutLabel}
          onLanguageChange={(language) => setSettings((current) => ({ ...current, language }))}
          onModelChange={(model) => setSettings((current) => ({ ...current, model }))}
          setSectionRef={(element) => {
            sectionRefs.current.home = element;
          }}
        />

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

        <MainPageSettingsSection
          appLocale={appLocale}
          audioInputs={audioInputs}
          deleteAccountCopy={deleteAccountCopy}
          hotkey={hotkey}
          hotkeyBackendInfo={hotkeyBackendInfo}
          hotkeyStatusMessage={hotkeyStatusMessage}
          micState={micState}
          micTestLevel={micTestLevel}
          micTestState={micTestState}
          sectionAccent={sectionAccent}
          sectionHeaderClass={sectionHeaderClass}
          sectionIconClass={sectionIconClass}
          sectionTitleClass={sectionTitleClass}
          settings={settings}
          setSettings={setSettings}
          ui={ui}
          onDeleteAccountOpen={() => {
            setDeleteAccountError(null);
            setIsDeleteAccountDialogOpen(true);
          }}
          onHotkeyChange={(next) => {
            void handleHotkeyChange(next);
          }}
          onHotkeyInvalid={setHotkeyStatusMessage}
          onMicTestStart={() => {
            void handleMicTest();
          }}
          onMicTestStop={() => {
            void stopMicTest();
          }}
          onPreferredAudioInputDeviceChange={(deviceId) => {
            setMicTestState("idle");
            setMicTestLevel(0);
            setSettings((current) => ({
              ...current,
              preferredAudioInputDeviceId: deviceId,
            }));
          }}
          setSectionRef={(element) => {
            sectionRefs.current.settings = element;
          }}
        />

        <MainPagePlanSection
          appLocale={appLocale}
          sectionAccent={sectionAccent}
          sectionHeaderClass={sectionHeaderClass}
          sectionIconClass={sectionIconClass}
          sectionTitleClass={sectionTitleClass}
          planMeta={planMeta}
          currentPlan={currentPlan}
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
    </>
  );
}



