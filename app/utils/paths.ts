import type { App, FileSystemAdapter } from "obsidian"
import path from "path"

export function getPluginDir(app: App): string {
  const adapter = app.vault.adapter as FileSystemAdapter
  const basePath = adapter.getFullPath("")
  return path.join(basePath, app.vault.configDir, "plugins", "obsidian-btw")
}

export function getVaultPath(app: App): string {
  const adapter = app.vault.adapter as FileSystemAdapter
  return adapter.getFullPath("") || process.env.HOME || "/"
}
