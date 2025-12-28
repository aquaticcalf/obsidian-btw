import type { App } from "obsidian"

export function getPluginDir(app: App): string {
  const adapter = app.vault.adapter as any
  return `${adapter.basePath}/${app.vault.configDir}/plugins/obsidian-btw`
}

export function getVaultPath(app: App): string {
  return (app.vault.adapter as any).basePath || process.env.HOME || "/"
}
