import type { WebglAddon } from "@xterm/addon-webgl"
import type { Terminal } from "@xterm/xterm"
import { DEFAULT_BG, DEFAULT_FG } from "@/terminal/constants"

export interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
  cursorAccent: string
  selectionBackground: string

  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string

  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

class ThemeManager {
  private root: HTMLElement

  constructor() {
    this.root = document.body || document.documentElement
  }

  private getRgbFromVar(varName: string): [number, number, number] | null {
    try {
      const styles = getComputedStyle(this.root)
      const value = styles.getPropertyValue(varName).trim()
      if (!value) return null

      const parts = value.split(/[,\s]+/).map((p) => Number.parseInt(p.trim(), 10))
      if (parts.length >= 3 && parts.every((p) => !Number.isNaN(p))) {
        return [parts[0] / 255, parts[1] / 255, parts[2] / 255]
      }

      const hex = value.replace("#", "")
      if (hex.length === 6) {
        const r = Number.parseInt(hex.substring(0, 2), 16) / 255
        const g = Number.parseInt(hex.substring(2, 4), 16) / 255
        const b = Number.parseInt(hex.substring(4, 6), 16) / 255
        return [r, g, b]
      }

      return null
    } catch {
      return null
    }
  }

  private getColorFromVar(varName: string, fallback: string): string {
    try {
      const styles = getComputedStyle(this.root)

      const rgb = this.getRgbFromVar(`${varName}-rgb`)
      if (rgb) {
        const [r, g, b] = rgb
        return this.rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
      }

      const value = styles.getPropertyValue(varName).trim()
      if (value) return value

      return fallback
    } catch {
      return fallback
    }
  }

  // https://www.w3.org/WAI/GL/wiki/Relative_luminance
  private calculateLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map((val) => {
      return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private calculateContrastRatio(
    rgb1: [number, number, number],
    rgb2: [number, number, number],
  ): number {
    const l1 = this.calculateLuminance(rgb1)
    const l2 = this.calculateLuminance(rgb2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
  }

  private adjustColorForContrast(
    colorRgb: [number, number, number],
    bgRgb: [number, number, number],
    targetRatio = 4.5,
  ): string {
    const currentRatio = this.calculateContrastRatio(colorRgb, bgRgb)

    if (currentRatio >= targetRatio) {
      const [r, g, b] = colorRgb
      return this.rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
    }

    const bgLuminance = this.calculateLuminance(bgRgb)
    const shouldLighten = bgLuminance < 0.5

    let [r, g, b] = colorRgb
    let factor = shouldLighten ? 1.5 : 0.5
    let step = shouldLighten ? 0.5 : 0.25
    let iterations = 0
    const maxIterations = 20

    while (iterations < maxIterations) {
      const adjusted: [number, number, number] = shouldLighten
        ? [Math.min(1, r * factor), Math.min(1, g * factor), Math.min(1, b * factor)]
        : [r * factor, g * factor, b * factor]

      const ratio = this.calculateContrastRatio(adjusted, bgRgb)

      if (Math.abs(ratio - targetRatio) < 0.1) {
        return this.rgbToHex(
          Math.round(adjusted[0] * 255),
          Math.round(adjusted[1] * 255),
          Math.round(adjusted[2] * 255),
        )
      }

      if (ratio < targetRatio) {
        factor = shouldLighten ? factor + step : factor - step
      } else {
        factor = shouldLighten ? factor - step : factor + step
      }

      step *= 0.5
      iterations++
    }

    if (shouldLighten) {
      return "#ffffff"
    }
    return "#000000"
  }

  private getContrastColor(
    varName: string,
    fallback: string,
    bgRgb: [number, number, number],
  ): string {
    const rgb = this.getRgbFromVar(`${varName}-rgb`)
    if (rgb) {
      return this.adjustColorForContrast(rgb, bgRgb)
    }

    const hex = fallback.replace("#", "")
    if (hex.length === 6) {
      const r = Number.parseInt(hex.substring(0, 2), 16) / 255
      const g = Number.parseInt(hex.substring(2, 4), 16) / 255
      const b = Number.parseInt(hex.substring(4, 6), 16) / 255
      return this.adjustColorForContrast([r, g, b], bgRgb)
    }

    return fallback
  }

  getTheme(): TerminalTheme {
    try {
      const background = this.getColorFromVar("--background-primary", DEFAULT_BG)
      const foreground = this.getColorFromVar("--text-normal", DEFAULT_FG)
      const cursor = this.getColorFromVar("--text-accent", foreground)

      const bgRgb = this.getRgbFromVar("--background-primary-rgb") || [0.12, 0.12, 0.12]

      const red = this.getContrastColor("--color-red", "#ff5555", bgRgb)
      const orange = this.getContrastColor("--color-orange", "#ffb86c", bgRgb)
      const yellow = this.getContrastColor("--color-yellow", "#f1fa8c", bgRgb)
      const green = this.getContrastColor("--color-green", "#50fa7b", bgRgb)
      const cyan = this.getContrastColor("--color-cyan", "#8be9fd", bgRgb)
      const blue = this.getContrastColor("--color-blue", "#6272a4", bgRgb)
      const purple = this.getContrastColor("--color-purple", "#bd93f9", bgRgb)
      const pink = this.getContrastColor("--color-pink", "#ff79c6", bgRgb)

      const mono100 = this.getColorFromVar("--mono-rgb-100", "#282a36")
      const mono200 = this.getColorFromVar("--mono-rgb-200", "#44475a")
      const mono255 = this.getColorFromVar("--text-faint", "#f8f8f2")

      const selectionBg = this.getColorFromVar("--text-selection", "rgba(68, 71, 90, 0.5)")

      return {
        background,
        foreground,
        cursor,
        cursorAccent: background,
        selectionBackground: selectionBg,

        black: mono100,
        red,
        green,
        yellow,
        blue,
        magenta: purple,
        cyan,
        white: foreground,

        brightBlack: mono200,
        brightRed: red,
        brightGreen: green,
        brightYellow: orange,
        brightBlue: blue,
        brightMagenta: pink,
        brightCyan: cyan,
        brightWhite: mono255,
      }
    } catch (error) {
      return this.getFallbackTheme()
    }
  }

  private getFallbackTheme(): TerminalTheme {
    return {
      background: DEFAULT_BG,
      foreground: DEFAULT_FG,
      cursor: DEFAULT_FG,
      cursorAccent: DEFAULT_BG,
      selectionBackground: "rgba(68, 71, 90, 0.5)",
      black: "#282a36",
      red: "#ff5555",
      green: "#50fa7b",
      yellow: "#ffb86c",
      blue: "#6272a4",
      magenta: "#bd93f9",
      cyan: "#8be9fd",
      white: "#f8f8f2",
      brightBlack: "#44475a",
      brightRed: "#ff6e6e",
      brightGreen: "#69ff94",
      brightYellow: "#f1fa8c",
      brightBlue: "#7b8ec7",
      brightMagenta: "#ff79c6",
      brightCyan: "#a4ffff",
      brightWhite: "#ffffff",
    }
  }
}

export function getObsidianTheme(): TerminalTheme {
  const manager = new ThemeManager()
  return manager.getTheme()
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
