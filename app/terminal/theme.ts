import type { WebglAddon } from "@xterm/addon-webgl"
import type { Terminal } from "@xterm/xterm"
import { DEFAULT_BG, DEFAULT_FG } from "@/terminal/constants"

export interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
}

export function getObsidianTheme(): TerminalTheme {
  try {
    const root = document.body || document.documentElement
    const styles = getComputedStyle(root)
    const background = styles.getPropertyValue("--background-primary").trim() || DEFAULT_BG
    const foreground = styles.getPropertyValue("--text-normal").trim() || DEFAULT_FG
    const cursor = styles.getPropertyValue("--text-accent").trim() || foreground

    return { background, foreground, cursor }
  } catch {
    return {
      background: DEFAULT_BG,
      foreground: DEFAULT_FG,
      cursor: DEFAULT_FG,
    }
  }
}

export function applyTheme(
  terminal: Terminal,
  theme: TerminalTheme,
  webglAddon: WebglAddon | null,
  WebglAddonClass: typeof WebglAddon,
): WebglAddon | null {
  try {
    const opts = terminal.options as any
    const existingTheme = (opts.theme ?? {}) as any
    opts.theme = { ...existingTheme, ...theme }
  } catch (e) {
    console.warn("[obsidian-btw] failed to update terminal theme : ", e)
  }

  let newWebglAddon: WebglAddon | null = null
  if (webglAddon) {
    try {
      webglAddon.dispose()
    } catch {}
  }

  try {
    newWebglAddon = new WebglAddonClass()
    terminal.loadAddon(newWebglAddon)
  } catch {
    newWebglAddon = null
  }

  try {
    terminal.refresh(0, terminal.rows - 1)
  } catch (e) {
    console.warn("[obsidian-btw] terminal refresh failed : ", e)
  }

  return newWebglAddon
}
