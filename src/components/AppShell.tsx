import { useEffect, useState, type ReactNode } from "react";
import { CreditCard, Home, History, LogOut, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { getAppCopy, type AppLocale } from "@/lib/appLocale";

type AppShellProps = {
  appLocale: AppLocale;
  eyebrow?: string;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  navItems?: Array<{ id: string; label: string }>;
  activeNavId?: string;
  onNavItemClick?: (id: string) => void;
  children: ReactNode;
};

function getPlanPresentation(locale: AppLocale, plan: "free" | "plus") {
  if (plan === "plus") return { name: "WhisperType Plus", badge: "Plus" };
  return { name: locale === "ja" ? "フリー" : "Free", badge: "Free" };
}

function getSignOutDialogCopy(locale: AppLocale) {
  if (locale === "ja") {
    return {
      title: "サインアウトしますか？",
      description: "このアプリからサインアウトします。",
      confirm: "サインアウト",
      cancel: "キャンセル",
      error: "サインアウトできませんでした。接続を確認してもう一度お試しください。",
    };
  }

  if (locale === "es") {
    return {
      title: "¿Cerrar sesión?",
      description: "Se cerrará tu sesión en esta app.",
      confirm: "Cerrar sesión",
      cancel: "Cancelar",
      error: "No se pudo cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.",
    };
  }

  return {
    title: "Sign out?",
    description: "You will be signed out of this app.",
    confirm: "Sign out",
    cancel: "Cancel",
    error: "Sign-out could not be completed. Check your connection and try again.",
  };
}

export function AppShell({
  appLocale,
  eyebrow,
  title,
  description,
  headerActions,
  navItems,
  activeNavId,
  onNavItemClick,
  children,
}: AppShellProps) {
  const { profile, user, signOut } = useAuth();
  const copy = getAppCopy(appLocale);
  const signOutDialogCopy = getSignOutDialogCopy(appLocale);
  const currentPlan = getPlanPresentation(appLocale, profile?.plan ?? "free");
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const getNavIcon = (id: string) => {
    if (id === "settings") return SlidersHorizontal;
    if (id === "plan") return CreditCard;
    if (id === "history") return History;
    return Home;
  };

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [profile?.avatarUrl]);

  const handleConfirmSignOut = async () => {
    try {
      setIsSigningOut(true);
      setSignOutError(null);
      await signOut();
      setIsSignOutDialogOpen(false);
    } catch {
      setSignOutError(signOutDialogCopy.error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[#fafafa] text-slate-900 dark:bg-[#0f1115] dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.9),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.55),transparent_24%),radial-gradient(circle_at_50%_110%,rgba(226,232,240,0.7),transparent_28%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.06),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(96,165,250,0.12),transparent_24%),radial-gradient(circle_at_50%_110%,rgba(148,163,184,0.1),transparent_30%)]" />
      {isSignOutDialogOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/28 px-4 backdrop-blur-[3px]">
          <div className="w-full max-w-md rounded-[28px] border border-black/8 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#121316]/96">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{signOutDialogCopy.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{signOutDialogCopy.description}</p>
            {signOutError ? <p className="mt-3 text-sm leading-6 text-rose-600 dark:text-rose-300">{signOutError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSignOutError(null);
                  setIsSignOutDialogOpen(false);
                }}
                disabled={isSigningOut}
                className="rounded-2xl"
              >
                {signOutDialogCopy.cancel}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void handleConfirmSignOut();
                }}
                disabled={isSigningOut}
                className="rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                {isSigningOut ? `${signOutDialogCopy.confirm}...` : signOutDialogCopy.confirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative flex h-screen">
        <aside className="relative flex h-screen w-[264px] shrink-0 flex-col border-r border-white/40 bg-white/72 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.35)]">
          <div className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-1 text-left">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-sm dark:border-white/10 dark:bg-[#17181b]">
              <img src="/app-icon.png" alt="WhisperType" className="h-8 w-8 rounded-xl object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">WhisperType</p>
            </div>
          </div>

          {navItems && onNavItemClick ? (
            <nav className="space-y-2">
              {navItems.map((item) => {
                const active = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavItemClick(item.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-black text-white shadow-sm dark:bg-white dark:text-black"
                        : "text-slate-600 hover:bg-black/[0.035] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.04] dark:hover:text-white",
                    ].join(" ")}
                  >
                    {(() => {
                      const Icon = getNavIcon(item.id);
                      return <Icon className="h-4 w-4 shrink-0" />;
                    })()}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : null}

          <div className="mt-auto space-y-3 border-t border-white/35 pt-4 dark:border-white/10">
            <div className="rounded-[20px] border border-white/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82),rgba(255,247,250,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(24,25,29,0.98),rgba(20,21,24,0.92),rgba(34,22,41,0.96))]">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentPlan.name}</p>
                </div>
                <span className="rounded-full border border-pink-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,240,247,0.98),rgba(255,247,224,0.98))] px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm dark:border-pink-300/15 dark:bg-[linear-gradient(135deg,rgba(38,29,44,0.98),rgba(55,28,51,0.98),rgba(54,38,22,0.98))] dark:text-slate-100">
                  {currentPlan.badge}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavItemClick?.("plan")}
                className="h-10 w-full justify-between rounded-2xl border-black/8 bg-white/76 text-slate-700 shadow-sm hover:bg-black/[0.04] dark:border-white/10 dark:bg-[#151619]/88 dark:text-slate-200 dark:hover:bg-white/[0.05]"
              >
                <span>{copy.planDetails}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{currentPlan.badge}</span>
              </Button>
            </div>

            <div className="rounded-[22px] border border-white/35 bg-white/82 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#151619]/92">
              <div className="mb-3 flex items-center gap-3">
                {profile?.avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile?.name || user?.email || "Profile"}
                    className="h-10 w-10 rounded-full border border-black/6 object-cover shadow-sm dark:border-white/10"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-[linear-gradient(135deg,#0f172a,#111827)] text-sm font-semibold text-white shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,#f5f5f5,#d4d4d8)] dark:text-slate-900">
                    {(profile?.name || user?.email || "W").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{profile?.name || copy.signedIn}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || profile?.email || copy.noEmail}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSignOutDialogOpen(true)}
                className="w-full justify-start rounded-2xl border-black/8 bg-transparent text-slate-700 hover:bg-black/[0.04] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.05]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {copy.signOut}
              </Button>
            </div>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-y-auto px-8 py-7 scroll-smooth">
          <div className="pointer-events-none absolute inset-x-10 top-8 h-40 rounded-[40px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.78),transparent_32%),radial-gradient(circle_at_80%_40%,rgba(191,219,254,0.35),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0.08))] blur-3xl dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_80%_40%,rgba(99,102,241,0.16),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))]" />
          <div className="mx-auto max-w-6xl">
            {headerActions || eyebrow || title || description ? (
              <header className="mb-6 flex items-start justify-between gap-6">
                <div className="space-y-2">
                  {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{eyebrow}</p> : null}
                  {title ? <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{title}</h1> : null}
                  {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
                </div>
                {headerActions ? <div className="flex shrink-0 items-center">{headerActions}</div> : null}
              </header>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}






