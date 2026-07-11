import { useEffect, useRef, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import { readAppLocale } from "@/lib/appLocale";
import { authRedirectUrl } from "@/lib/auth";
import { readStoredAuthSessionSnapshot } from "@/lib/authStorage";
import { supabase } from "@/lib/supabase";
import { getAuthFlowCopy } from "./authFlowCopy";
import { AuthContext, type UserProfile } from "./AuthContext";

async function syncCachedAccessToken(accessToken: string | null | undefined) {
  try {
    await invoke("set_cached_access_token", {
      token: accessToken && accessToken.trim() ? accessToken : null,
    });
  } catch (error) {
    console.warn("Failed to sync cached access token:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authFlowStatus, setAuthFlowStatus] = useState<string | null>(null);
  const profileRequestIdRef = useRef(0);
  const profileErrorRef = useRef<string | null>(null);
  const profileStatusRef = useRef("idle");
  const navigate = useNavigate();

  const withTimeout = async <T,>(
    label: string,
    promiseLike: PromiseLike<T>,
    timeoutMs = 8000,
  ): Promise<T> => {
    let timeoutId: number | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    }
  };

  type ProfileRow = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    daily_credits: number | null;
    bonus_credits: number | null;
    role: string | null;
    plan: string | null;
  };

  const mapProfile = (data: ProfileRow): UserProfile => ({
    id: data.id,
    email: data.email,
    name: data.name ?? "User",
    avatarUrl: data.avatar_url ?? "",
    credits: data.bonus_credits ?? 0,
    dailyCredits: data.daily_credits ?? 0,
    availableCredits: data.plan === "plus" ? null : (data.daily_credits ?? 0) + (data.bonus_credits ?? 0),
    role: data.role ?? "user",
    plan: data.plan === "plus" ? "plus" : "free",
  });

  const buildFallbackProfile = (currentUser: User): UserProfile => ({
    id: currentUser.id,
    email: currentUser.email ?? "",
    name:
      typeof currentUser.user_metadata?.name === "string" && currentUser.user_metadata.name.trim()
        ? currentUser.user_metadata.name.trim()
        : currentUser.email?.split("@")[0] || "User",
    avatarUrl:
      typeof currentUser.user_metadata?.avatar_url === "string" ? currentUser.user_metadata.avatar_url : "",
    credits: 0,
    dailyCredits: 50,
    availableCredits: 0,
    role: "user",
    plan: "free",
  });

  const isProfileRow = (
    value: unknown,
  ): value is ProfileRow => {
    if (!value || typeof value !== "object") {
      return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate.id === "string" && typeof candidate.email === "string";
  };

  const ensureProfile = async (currentUser: User): Promise<UserProfile | null> => {
    const fallbackName =
      typeof currentUser.user_metadata?.name === "string" && currentUser.user_metadata.name.trim()
        ? currentUser.user_metadata.name.trim()
        : currentUser.email?.split("@")[0] || "User";

    const fallbackAvatar =
      typeof currentUser.user_metadata?.avatar_url === "string" ? currentUser.user_metadata.avatar_url : "";

    try {
      profileStatusRef.current = "fetching profile";

      const { data: existingProfile, error: fetchError } = await withTimeout(
        "profiles select",
        supabase
          .from("profiles")
          .select("id, email, name, avatar_url, daily_credits, bonus_credits, role, plan")
          .eq("id", currentUser.id)
          .maybeSingle(),
      );

      if (!fetchError && existingProfile) {
        profileErrorRef.current = null;
        profileStatusRef.current = "profile found via select";
        return mapProfile(existingProfile);
      }

      if (fetchError) {
        console.error("AuthContext ensureProfile fetch error:", fetchError);
        profileStatusRef.current = `select error: ${fetchError.message}`;
      } else {
        profileStatusRef.current = "profile missing, calling ensure_profile";
      }

      const { data: ensuredProfile, error: ensureError } = await withTimeout(
        "ensure_profile rpc",
        supabase
          .rpc("ensure_profile", {
            user_id_param: currentUser.id,
            email_param: currentUser.email ?? "",
            name_param: fallbackName,
            avatar_url_param: fallbackAvatar,
          })
          .single(),
      );

      if (ensureError) {
        console.error("AuthContext ensureProfile rpc error:", ensureError);
        profileErrorRef.current = ensureError.message;
        profileStatusRef.current = `ensure_profile error: ${ensureError.message}`;
        return null;
      }

      if (!isProfileRow(ensuredProfile)) {
        console.error("AuthContext ensureProfile rpc returned empty data");
        profileErrorRef.current = "ensure_profile returned invalid row";
        profileStatusRef.current = "ensure_profile returned invalid row";
        return null;
      }

      profileErrorRef.current = null;
      profileStatusRef.current = "profile recovered via ensure_profile";
      return mapProfile(ensuredProfile);
    } catch (error) {
      console.error("AuthContext ensureProfile unexpected error:", error);
      profileErrorRef.current = error instanceof Error ? error.message : "Unknown profile error";
      profileStatusRef.current =
        error instanceof Error ? `unexpected error: ${error.message}` : "unexpected profile error";
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const nextProfile = await ensureProfileWithRetry(user);
    const baseProfile = nextProfile ?? buildFallbackProfile(user);

    try {
      const { data, error } = await supabase.rpc("get_transcription_context");
        const row = (Array.isArray(data) ? data[0] : data) as
          | {
            user_id: string;
            daily_credits: number | null;
            bonus_credits: number | null;
            available_credits: number | null;
            plan: string | null;
            is_unlimited: boolean | null;
          }
          | null;

      if (!error && row && row.user_id === user.id) {
        setProfile({
          ...baseProfile,
          credits: row.bonus_credits ?? baseProfile.credits,
          dailyCredits: row.daily_credits ?? baseProfile.dailyCredits,
          availableCredits: row.is_unlimited ? null : (row.available_credits ?? baseProfile.availableCredits),
          plan: row.plan === "plus" ? "plus" : baseProfile.plan,
        });
        return;
      }
    } catch (e) {
      console.warn("Failed to refresh transcription context:", e);
    }

    setProfile({
      ...baseProfile,
    });
  };

  const ensureProfileWithRetry = async (
    currentUser: User,
    maxAttempts = 3
  ): Promise<UserProfile | null> => {
    const requestId = ++profileRequestIdRef.current;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (attempt > 1) {
        profileStatusRef.current = `retrying profile fetch (${attempt}/${maxAttempts})`;
        await new Promise((resolve) => window.setTimeout(resolve, 600 * attempt));
      }

      const nextProfile = await ensureProfile(currentUser);
      if (requestId !== profileRequestIdRef.current) {
        return null;
      }

      if (nextProfile) {
        return nextProfile;
      }

      if (
        profileErrorRef.current &&
        !profileErrorRef.current.includes("timed out") &&
        !profileErrorRef.current.includes("returned")
      ) {
        break;
      }
    }

    return null;
  };

  useEffect(() => {
    let mounted = true;
    const loadingTimeout = window.setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 4000);

    const initAuth = async () => {
      try {
        let {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!initialSession) {
          const storedSession = await readStoredAuthSessionSnapshot();
          if (storedSession?.access_token && storedSession.refresh_token) {
            const { data: restoredData, error: restoreError } = await supabase.auth.setSession({
              access_token: storedSession.access_token,
              refresh_token: storedSession.refresh_token,
            });

            if (!restoreError && restoredData.session) {
              initialSession = restoredData.session;
            }
          }
        }

        if (!mounted) return;

        setSession(initialSession);
        void syncCachedAccessToken(initialSession?.access_token ?? null);
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);
        setIsLoading(false);

        if (initialUser) {
          setProfile(buildFallbackProfile(initialUser));
          profileStatusRef.current = "using session profile while syncing";
          void ensureProfileWithRetry(initialUser).then((nextProfile) => {
            if (!mounted || !nextProfile) return;
            setProfile(nextProfile);
          });
          void refreshProfile().catch((error) => {
            console.warn("Initial refreshProfile failed:", error);
          });
        } else {
          setProfile(null);
          profileErrorRef.current = null;
          profileStatusRef.current = "no authenticated user";
        }
      } catch (e) {
        console.error("AuthContext initAuth error:", e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const handleDesktopOAuthCallback = async (callbackUrl: string) => {
      const authCopy = getAuthFlowCopy(readAppLocale());

      try {
        const url = new URL(callbackUrl);
        const isDeepLinkCallback =
          url.protocol === "whispertype:" &&
          ((url.host === "auth" && url.pathname === "/callback") ||
            url.pathname === "/auth/callback");

        if (!isDeepLinkCallback) {
          return;
        }

        const browserError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (browserError) {
          setAuthFlowStatus(authCopy.callbackFailed);
          return;
        }

        const code = url.searchParams.get("code");
        if (!code) {
          setAuthFlowStatus(authCopy.callbackMissingCode);
          return;
        }

        setAuthFlowStatus(authCopy.exchangingCode);
        const exchangeResult = await withTimeout(
          "oauth code exchange",
          supabase.auth.exchangeCodeForSession(code),
          10000
        );

        if (exchangeResult.error) {
          throw exchangeResult.error;
        }

        void syncCachedAccessToken(exchangeResult.data.session?.access_token ?? null);
        setAuthFlowStatus(authCopy.signInComplete);
        navigate("/", { replace: true });
      } catch (error) {
        console.error("OAuth deep link exchange failed:", error);
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("pkce") || message.includes("code verifier")) {
          setAuthFlowStatus(authCopy.pkceFailed);
        } else {
          setAuthFlowStatus(authCopy.exchangeFailed);
        }
      }
    };

    let unlistenDeepLink: (() => void) | undefined;

    listen<{ urls?: string[] }>("deep-link-received", (event) => {
      const urls = event.payload.urls ?? [];
      urls.forEach((url) => {
        void handleDesktopOAuthCallback(url);
      });
    })
      .then((fn) => {
        unlistenDeepLink = fn;
      })
      .catch((error) => {
        console.error("Failed to subscribe to deep link events:", error);
      });

    invoke<string[]>("consume_pending_deep_links")
      .then((urls) => {
        urls.forEach((url) => {
          void handleDesktopOAuthCallback(url);
        });
      })
      .catch((error) => {
        console.error("Failed to read pending deep links:", error);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      void syncCachedAccessToken(currentSession?.access_token ?? null);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser) {
        setProfile(buildFallbackProfile(currentUser));
        profileStatusRef.current = "signed in, syncing profile";
        window.setTimeout(() => {
          void ensureProfileWithRetry(currentUser).then((nextProfile) => {
            if (!mounted || !nextProfile) return;
            setProfile(nextProfile);
          });
        }, 500);
      } else if (mounted) {
        setProfile(null);
        profileErrorRef.current = null;
        profileStatusRef.current = "signed out";
      }

      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimeout);
      unlistenDeepLink?.();
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const authCopy = getAuthFlowCopy(readAppLocale());

    try {
      setAuthFlowStatus(authCopy.preparing);
      setAuthFlowStatus(authCopy.openingBrowser);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data?.url) {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(data.url);
        setAuthFlowStatus(authCopy.waitingForBrowser);
        return;
      }

      throw new Error(authCopy.openBrowserFailed);
    } catch (e) {
      console.error("[Auth] SignIn error:", e);
      throw e;
    }
  };

  const signInWithEmailOtp = async (email: string) => {
    const authCopy = getAuthFlowCopy(readAppLocale());

    try {
      setAuthFlowStatus(authCopy.preparing);
      setAuthFlowStatus("Sending email sign-in link...");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: authRedirectUrl,
        },
      });

      if (error) throw error;

      setAuthFlowStatus("Check your inbox for the sign-in link.");
    } catch (e) {
      console.error("[Auth] Email OTP sign-in error:", e);
      throw e;
    }
  };

  const signOut = async () => {
    const authCopy = getAuthFlowCopy(readAppLocale());

    try {
      profileStatusRef.current = "signing out";
      setAuthFlowStatus(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      setSession(null);
      void syncCachedAccessToken(null);
      setUser(null);
      setProfile(null);
      profileErrorRef.current = null;
      profileStatusRef.current = "signed out";
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("AuthContext: signOut error:", e);
      profileStatusRef.current =
        e instanceof Error ? `sign out error: ${e.message}` : "sign out error";
      setAuthFlowStatus(authCopy.signOutFailed);
      throw e;
    }
  };

  const deleteAccountData = async () => {
    try {
      profileStatusRef.current = "deleting account data";
      setAuthFlowStatus(null);

      const { error } = await supabase.rpc("delete_own_account_data");
      if (error) {
        throw error;
      }

      await supabase.auth.signOut().catch((error) => {
        console.warn("Supabase sign-out after account deletion failed:", error);
      });

      await invoke("set_cached_access_token", { token: null }).catch((error) => {
        console.warn("Failed to clear cached access token after account deletion:", error);
      });

      setSession(null);
      setUser(null);
      setProfile(null);
      profileErrorRef.current = null;
      profileStatusRef.current = "account data deleted";
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("AuthContext: deleteAccountData error:", e);
      profileStatusRef.current =
        e instanceof Error ? `delete account data error: ${e.message}` : "delete account data error";
      throw e;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        hasAccessToken: Boolean(session?.access_token),
        authFlowStatus,
        refreshProfile,
        signInWithGoogle,
        signInWithEmailOtp,
        signOut,
        deleteAccountData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}







