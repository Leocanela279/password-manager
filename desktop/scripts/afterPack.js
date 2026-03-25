const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

module.exports = async (context) => {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const productName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${productName}.app`);
  const executablePath = path.join(appPath, "Contents", "MacOS", productName);

  try {
    await fs.access(appPath);
  } catch {
    return;
  }

  try {
    await execFileAsync("codesign", ["--remove-signature", executablePath]);
  } catch (error) {
    if (error.code !== 1) {
      throw error;
    }
  }

  await execFileAsync("codesign", [
    "--force",
    "--deep",
    "--options",
    "runtime",
    "--sign",
    "-",
    appPath,
  ]);

  console.log(`Applied ad-hoc macOS signature to ${appPath}`);
};
