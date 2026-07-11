const releaseDesktopAuthRedirectUrl = "whispertype://auth/callback";
const devAuthRedirectUrl = "whispertype://auth/callback";

const configuredAuthRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL?.replace(/\/$/, "");

if (!import.meta.env.DEV && !configuredAuthRedirectUrl) {
  throw new Error("release_auth_redirect_url_required");
}

export const authRedirectUrl =
  configuredAuthRedirectUrl || devAuthRedirectUrl;

export const desktopAuthRedirectUrl = releaseDesktopAuthRedirectUrl;
