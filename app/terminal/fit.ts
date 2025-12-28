import type { Terminal } from "@xterm/xterm"
import type { PtyProcess } from "@/terminal/pty"

export interface FitResult {
  cols: number
  rows: number
}

export function fitToContainer(
  terminal: Terminal,
  pty: PtyProcess | null,
  containerEl: HTMLElement,
): FitResult | null {
  const core = (terminal as any)._core
  const dims = core?._renderService?.dimensions
  if (!dims?.css?.cell.width || !dims?.css?.cell.height) return null

  const rect = containerEl.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const cols = Math.max(2, Math.floor(rect.width / dims.css.cell.width))
  let rows = Math.max(1, Math.floor(rect.height / dims.css.cell.height))

  terminal.resize(cols, rows)
  pty?.resize(cols, rows)

  return { cols, rows }
}
