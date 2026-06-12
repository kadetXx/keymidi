/**
 * Explicit notarization hook for electron-builder (replaces mac.notarize: true).
 * Logs progress to CI/local stdout; enable more detail with DEBUG=electron-notarize*
 */
const fs = require("fs");
const path = require("path");
const { notarize } = require("@electron/notarize");

const HEARTBEAT_MS = 60_000;

exports.default = async function afterSign(context) {
  const { appOutDir, electronPlatformName, packager } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }
  if (process.env.SKIP_NOTARIZE === "1" || process.env.SKIP_NOTARIZE === "true") {
    console.log("[notarize] skipped (SKIP_NOTARIZE)");
    return;
  }

  const appPath = path.join(appOutDir, `${packager.appInfo.productFilename}.app`);
  const appleApiKey = process.env.APPLE_API_KEY;
  const appleApiKeyId = process.env.APPLE_API_KEY_ID;
  const appleApiIssuer = process.env.APPLE_API_ISSUER;

  console.log("[notarize] app:", appPath);
  console.log("[notarize] key id:", appleApiKeyId);
  console.log("[notarize] issuer:", appleApiIssuer);
  console.log(
    "[notarize] key file:",
    appleApiKey,
    fs.existsSync(appleApiKey || "") ? "(exists)" : "(missing)"
  );

  if (!appleApiKey || !appleApiKeyId || !appleApiIssuer) {
    throw new Error(
      "Missing APPLE_API_KEY, APPLE_API_KEY_ID, or APPLE_API_ISSUER for notarization"
    );
  }
  if (!fs.existsSync(appleApiKey)) {
    throw new Error(`APPLE_API_KEY file not found: ${appleApiKey}`);
  }

  const started = Date.now();
  const heartbeat = setInterval(() => {
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(`[notarize] still waiting on Apple… ${elapsed}s elapsed`);
  }, HEARTBEAT_MS);

  try {
    console.log("[notarize] submitting to Apple (zip + notarytool --wait)…");
    await notarize({
      appPath,
      appleApiKey,
      appleApiKeyId,
      appleApiIssuer,
    });
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(`[notarize] accepted and stapled in ${elapsed}s`);
  } catch (err) {
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.error(`[notarize] failed after ${elapsed}s`);
    throw err;
  } finally {
    clearInterval(heartbeat);
  }
};
