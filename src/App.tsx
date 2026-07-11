<<<<<<< HEAD
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import MainPage from "@/pages/MainPage";
import { PrivacyPage, TermsPage } from "@/pages/LegalPages";
import { readAppLocale, type AppLocale } from "@/lib/appLocale";

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(() => readAppLocale());
  return <Routes>
    <Route path="/privacy" element={<PrivacyPage appLocale={locale} />} />
    <Route path="/terms" element={<TermsPage appLocale={locale} />} />
    <Route path="*" element={<MainPage appLocale={locale} onAppLocaleChange={setLocale} />} />
  </Routes>;
=======
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import OnboardingModal from "@/components/OnboardingModal";
import TutorialPracticeModal from "@/components/TutorialPracticeModal";
import { WelcomeCreditsCelebration } from "@/components/WelcomeCreditsCelebration";
import { useAuth } from "@/contexts/useAuth";
import { getAppCopy, readAppLocale, writeAppLocale, type AppLocale } from "@/lib/appLocale";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { readAppSettings, writeAppSettings } from "@/lib/appSettings";
import { supabase } from "@/lib/supabase";
import AuthCallback from "@/pages/AuthCallback";
import { PrivacyPage, TermsPage } from "@/pages/LegalPages";
import LoginPage from "@/pages/LoginPage";
import MainPage from "@/pages/MainPage";
import PlanCheckoutPage from "@/pages/PlanCheckoutPage";

type WelcomeCreditsRpcRow = {
  status: string;
  reward_credits: number | null;
  remaining_credits: number | null;
  message: string | null;
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, session } = useAuth();
  const copy = getAppCopy(readAppLocale());

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-muted-foreground">{copy.authChecking}</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSessionExpired = session?.expires_at ? session.expires_at * 1000 < Date.now() : false;
  if (isSessionExpired) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, isLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [appLocale, setAppLocale] = useState<AppLocale>(() => readAppLocale());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [pendingPracticeOpen, setPendingPracticeOpen] = useState(false);
  const [welcomeCredits, setWelcomeCredits] = useState<number | null>(null);
  const welcomeCreditsCheckedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    writeAppLocale(appLocale);
  }, [appLocale]);

  useEffect(() => {
    if (isLoading || !user) {
      setIsOnboardingOpen(false);
      setIsPracticeOpen(false);
      setPendingPracticeOpen(false);
      return;
    }

    const settings = readAppSettings();
    const completedUserIds = settings.onboardingCompletedUserIds ?? [];
    const legacyCompleted = settings.onboardingCompleted && completedUserIds.length === 0;
    const hasCompletedForCurrentUser = completedUserIds.includes(user.id) || legacyCompleted;

    if (legacyCompleted) {
      writeAppSettings({ onboardingCompletedUserIds: [user.id] });
    }

    setIsOnboardingOpen(!hasCompletedForCurrentUser);
    setIsPracticeOpen(false);
    setPendingPracticeOpen(false);
  }, [isLoading, user]);

  useEffect(() => {
    if (isLoading || !user || isOnboardingOpen) return;
    if (welcomeCreditsCheckedRef.current.has(user.id)) return;
    welcomeCreditsCheckedRef.current.add(user.id);

    void (async () => {
      try {
        const { data, error } = await supabase.rpc("grant_welcome_credits");
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes("grant_welcome_credits") && message.includes("does not exist")) {
            console.warn("Welcome credits RPC is not installed yet.");
            return;
          }
          throw error;
        }

        const row = (Array.isArray(data) ? data[0] : data) as WelcomeCreditsRpcRow | null;
        if (!row) return;

        if (row.status === "granted") {
          setWelcomeCredits(row.reward_credits ?? 300);
          await refreshProfile();
        }
      } catch (error) {
        console.warn("Failed to grant welcome credits:", error);
      }
    })();
  }, [isLoading, isOnboardingOpen, refreshProfile, user]);

  const handleOnboardingComplete = (result: {
    appLocale: AppLocale;
    language: Parameters<typeof writeAppSettings>[0]["language"];
    model: Parameters<typeof writeAppSettings>[0]["model"];
    prompt: string;
  }) => {
    const currentSettings = readAppSettings();
    const nextCompletedUserIds = Array.from(
      new Set([...(currentSettings.onboardingCompletedUserIds ?? []), ...(user ? [user.id] : [])]),
    );

    writeAppSettings({
      appLocale: result.appLocale,
      language: result.language,
      model: result.model,
      prompt: result.prompt,
      onboardingCompleted: true,
      onboardingCompletedUserIds: nextCompletedUserIds,
    });
    setAppLocale(result.appLocale);
    setIsOnboardingOpen(false);
    setPendingPracticeOpen(Boolean(user && !readAppSettings().tutorialCompletedUserIds.includes(user.id)));
  };

  useEffect(() => {
    if (!pendingPracticeOpen || !user) return;
    setIsPracticeOpen(true);
    setPendingPracticeOpen(false);
  }, [pendingPracticeOpen, user]);

  const handlePracticeComplete = () => {
    const currentSettings = readAppSettings();
    const nextCompletedUserIds = Array.from(
      new Set([...(currentSettings.tutorialCompletedUserIds ?? []), ...(user ? [user.id] : [])]),
    );

    writeAppSettings({
      tutorialCompletedUserIds: nextCompletedUserIds,
    });
    setIsPracticeOpen(false);
  };

  const handlePracticeSkip = () => {
    setIsPracticeOpen(false);
  };

  const handleTutorialReset = () => {
    const currentSettings = readAppSettings();
    const remainingOnboardingUsers = (currentSettings.onboardingCompletedUserIds ?? []).filter((id) => id !== user?.id);
    const remainingPracticeUsers = (currentSettings.tutorialCompletedUserIds ?? []).filter((id) => id !== user?.id);

    writeAppSettings({
      onboardingCompleted: false,
      onboardingCompletedUserIds: remainingOnboardingUsers,
      tutorialCompletedUserIds: remainingPracticeUsers,
    });
    setIsPracticeOpen(false);
    setIsOnboardingOpen(Boolean(user));
  };

  useEffect(() => {
    let unlistenAuthRequired: (() => void) | undefined;

    void (async () => {
      unlistenAuthRequired = await listen("auth-required", () => {
        if (!user) {
          void invoke("show_settings_window").catch(() => {});
          navigate("/login", { replace: true });
        }
      });
    })();

    return () => {
      unlistenAuthRequired?.();
    };
  }, [navigate, user]);

  useEffect(() => {
    try {
      const settings = readAppSettings();
      if (!settings.hotkey.trim()) return;
      const normalizedHotkey = normalizeHotkeyForDisplay(settings.hotkey);
      if (normalizedHotkey === "Ctrl+Alt") return;

      void invoke("set_global_shortcut", {
        shortcut: normalizeHotkeyForNative(normalizedHotkey),
      }).catch((error) => {
        console.warn("Failed to restore saved global shortcut on app launch:", error);
      });
    } catch (error) {
      console.warn("Failed to read saved shortcut during app bootstrap:", error);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage appLocale={appLocale} />} />
        <Route path="/privacy" element={<PrivacyPage appLocale={appLocale} />} />
        <Route path="/terms" element={<TermsPage appLocale={appLocale} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainPage appLocale={appLocale} onAppLocaleChange={setAppLocale} onRestartTutorial={handleTutorialReset} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainPage appLocale={appLocale} onAppLocaleChange={setAppLocale} onRestartTutorial={handleTutorialReset} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <MainPage appLocale={appLocale} onAppLocaleChange={setAppLocale} onRestartTutorial={handleTutorialReset} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan/checkout"
          element={
            <ProtectedRoute>
              <PlanCheckoutPage appLocale={appLocale} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <WelcomeCreditsCelebration
        appLocale={appLocale}
        credits={welcomeCredits}
        onClose={() => setWelcomeCredits(null)}
      />
      {user && isOnboardingOpen ? (
        <OnboardingModal initialLocale={appLocale} onComplete={handleOnboardingComplete} />
      ) : null}
      {user && isPracticeOpen ? (
        <TutorialPracticeModal
          initialLocale={appLocale}
          onComplete={handlePracticeComplete}
          onSkip={handlePracticeSkip}
        />
      ) : null}
    </>
  );
>>>>>>> 76c0a9ef47068d3322c0f3d617003f87660d788a
}
