import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import MainPage from "@/pages/MainPage";
import { readAppLocale, type AppLocale } from "@/lib/appLocale";
import { readAppSettings, writeAppSettings } from "@/lib/appSettings";
import OnboardingModal from "@/components/OnboardingModal";
import TutorialPracticeModal from "@/components/TutorialPracticeModal";
import { invoke } from "@tauri-apps/api/core";
import { normalizeHotkeyForDisplay, normalizeHotkeyForNative } from "@/lib/hotkeys";
import { setGroqApiKey } from "@/services/transcription";

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(() => readAppLocale());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [pendingPracticeOpen, setPendingPracticeOpen] = useState(false);

  useEffect(() => {
    const settings = readAppSettings();
    if (!settings.onboardingCompleted) {
      setIsOnboardingOpen(true);
    }
    if (!settings.tutorialCompleted && settings.onboardingCompleted) {
      setPendingPracticeOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!pendingPracticeOpen || isOnboardingOpen) return;
    setIsPracticeOpen(true);
    setPendingPracticeOpen(false);
  }, [pendingPracticeOpen, isOnboardingOpen]);

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

  const handleOnboardingComplete = (result: {
    appLocale: AppLocale;
    language: Parameters<typeof writeAppSettings>[0]["language"];
    model: Parameters<typeof writeAppSettings>[0]["model"];
    prompt: string;
    groqApiKey: string;
  }) => {
    void setGroqApiKey(result.groqApiKey).catch((error) => {
      console.warn("Failed to save Groq API key from onboarding:", error);
    });
    writeAppSettings({
      appLocale: result.appLocale,
      language: result.language,
      model: result.model,
      prompt: result.prompt,
      onboardingCompleted: true,
    });
    setLocale(result.appLocale);
    setIsOnboardingOpen(false);
    setPendingPracticeOpen(true);
  };

  const handlePracticeComplete = () => {
    writeAppSettings({ tutorialCompleted: true });
    setIsPracticeOpen(false);
  };

  const handlePracticeSkip = () => {
    setIsPracticeOpen(false);
  };

  return (
    <>
      <Routes>
        <Route path="*" element={<MainPage appLocale={locale} onAppLocaleChange={setLocale} />} />
      </Routes>
      {isOnboardingOpen ? (
        <OnboardingModal initialLocale={locale} onComplete={handleOnboardingComplete} />
      ) : null}
      {isPracticeOpen ? (
        <TutorialPracticeModal
          initialLocale={locale}
          onComplete={handlePracticeComplete}
          onSkip={handlePracticeSkip}
        />
      ) : null}
    </>
  );
}
