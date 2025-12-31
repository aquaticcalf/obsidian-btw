// @ts-expect-error - CSS import handled by Bun
import xtermCss from "@xterm/xterm/css/xterm.css"
import { DEFAULT_BG } from "@/terminal/constants"

let injected = false

export function injectTerminalCss(): void {
  if (injected) return
  injected = true

  // CSS is provided via imported stylesheet and main styles.css
  void xtermCss
  void DEFAULT_BG
}
