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
}
