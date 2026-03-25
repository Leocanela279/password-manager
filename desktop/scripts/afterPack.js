const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const SIGNABLE_EXTENSIONS = new Set([".app", ".framework", ".dylib", ".node", ".xpc"]);

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walk(targetPath) {
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);
    results.push(entryPath);
    if (entry.isDirectory()) {
      results.push(...(await walk(entryPath)));
    }
  }

  return results;
}

async function removeSignature(targetPath) {
  try {
    await execFileAsync("codesign", ["--remove-signature", targetPath]);
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    if (
      error.code !== 1 &&
      !output.includes("code object is not signed at all") &&
      !output.includes("is already unsigned")
    ) {
      throw error;
    }
  }
}

async function sign(targetPath) {
  await execFileAsync("codesign", ["--force", "--sign", "-", targetPath]);
}

module.exports = async (context) => {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const productName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${productName}.app`);

  if (!(await pathExists(appPath))) {
    return;
  }

  const allPaths = await walk(appPath);
  const nestedTargets = allPaths
    .filter((entryPath) => {
      const extension = path.extname(entryPath);
      return SIGNABLE_EXTENSIONS.has(extension);
    })
    .sort((left, right) => right.split(path.sep).length - left.split(path.sep).length);

  for (const targetPath of nestedTargets) {
    await removeSignature(targetPath);
  }

  const nativeModulesPath = path.join(appPath, "Contents", "Resources", "app.asar.unpacked");
  if (await pathExists(nativeModulesPath)) {
    const unpackedPaths = await walk(nativeModulesPath);
    for (const targetPath of unpackedPaths.filter((entryPath) => SIGNABLE_EXTENSIONS.has(path.extname(entryPath)))) {
      await removeSignature(targetPath);
      await sign(targetPath);
    }
  }

  for (const targetPath of nestedTargets) {
    await sign(targetPath);
  }

  await removeSignature(appPath);
  await sign(appPath);

  console.log(`Applied ad-hoc macOS signature to ${appPath}`);
};
