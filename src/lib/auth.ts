const releaseAuthRedirectUrl = "whispertype://auth/callback";
const devAuthRedirectUrl = "whispertype://auth/callback";

const defaultAuthRedirectUrl = import.meta.env.DEV
  ? devAuthRedirectUrl
  : releaseAuthRedirectUrl;

export const authRedirectUrl =
  import.meta.env.VITE_AUTH_REDIRECT_URL?.replace(/\/$/, "") ||
  defaultAuthRedirectUrl;

export const desktopAuthRedirectUrl = releaseAuthRedirectUrl;
