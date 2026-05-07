const required = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_TRANSCRIBE_URL",
  "VITE_AUTH_REDIRECT_URL",
  "WHISPERTYPE_PLUS_STORE_ID",
  "WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST",
];

const placeholderPatterns = [
  /your_/i,
  /localhost/i,
  /retirecurl\.app/i,
  /example\.com/i,
  /YOUR_PARTNER_CENTER_STORE_ID/i,
];

const failures = [];

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    failures.push(`${key} is required`);
    continue;
  }

  if (placeholderPatterns.some((pattern) => pattern.test(value))) {
    failures.push(`${key} still looks like a placeholder: ${value}`);
  }
}

try {
  const transcribeHost = new URL(process.env.VITE_TRANSCRIBE_URL || "").host;
  const allowedHosts = (process.env.WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!allowedHosts.includes(transcribeHost)) {
    failures.push(`WHISPERTYPE_TRANSCRIBE_HOST_ALLOWLIST must include ${transcribeHost}`);
  }
} catch {
  // URL validity is reported above.
}

for (const key of ["VITE_SUPABASE_URL", "VITE_TRANSCRIBE_URL", "VITE_AUTH_REDIRECT_URL"]) {
  const value = process.env[key]?.trim();
  if (!value) continue;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      failures.push(`${key} must use https for release: ${value}`);
    }
  } catch {
    failures.push(`${key} must be a valid URL: ${value}`);
  }
}

if (failures.length > 0) {
  console.error("Release environment validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Release environment validation passed.");
