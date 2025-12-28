import type { App } from "obsidian"
import path from "path"

export function getPluginDir(app: App): string {
  const rootPath = app.vault.getRoot().path
  return path.join(rootPath, app.vault.configDir, "plugins", "obsidian-btw")
}

export function getVaultPath(app: App): string {
  return app.vault.getRoot().path || process.env.HOME || "/"
}
