const releaseAuthRedirectUrl = "whispertype://auth/callback";
const devAuthRedirectUrl = "http://localhost:1420/auth/callback";

const defaultAuthRedirectUrl = import.meta.env.DEV
  ? devAuthRedirectUrl
  : releaseAuthRedirectUrl;

export const authRedirectUrl =
  import.meta.env.VITE_AUTH_REDIRECT_URL?.replace(/\/$/, "") ||
  defaultAuthRedirectUrl;

export const desktopAuthRedirectUrl = releaseAuthRedirectUrl;
