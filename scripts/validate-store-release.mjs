import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(root, "package.json");
const tauriConfigPath = resolve(root, "src-tauri", "tauri.conf.json");
const storeConfigPath = resolve(root, "src-tauri", "tauri.microsoftstore.conf.json");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const packageJson = readJson(packageJsonPath);
const tauriConfig = readJson(tauriConfigPath);
const storeConfig = readJson(storeConfigPath);

const failures = [];
const semverPattern = /^\d+\.\d+\.\d+$/;

if (!semverPattern.test(packageJson.version || "")) {
  failures.push(`package.json version must use x.y.z format: ${packageJson.version || "(missing)"}`);
}

if (!semverPattern.test(tauriConfig.version || "")) {
  failures.push(`src-tauri/tauri.conf.json version must use x.y.z format: ${tauriConfig.version || "(missing)"}`);
}

if (packageJson.version !== tauriConfig.version) {
  failures.push(
    `package.json version (${packageJson.version}) must match src-tauri/tauri.conf.json version (${tauriConfig.version})`,
  );
}

if (!tauriConfig.productName?.trim()) {
  failures.push("src-tauri/tauri.conf.json productName is required");
}

if (!tauriConfig.identifier?.trim()) {
  failures.push("src-tauri/tauri.conf.json identifier is required");
}

if (storeConfig.bundle?.windows?.webviewInstallMode?.type !== "offlineInstaller") {
  failures.push("Store builds must use bundle.windows.webviewInstallMode.type = offlineInstaller");
}

if (tauriConfig.bundle?.targets !== "nsis") {
  failures.push("Default bundle target should remain nsis; Store-specific settings belong in tauri.microsoftstore.conf.json");
}

if (failures.length > 0) {
  console.error("Store release validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Store release validation passed for ${tauriConfig.productName} ${tauriConfig.version}.`);
