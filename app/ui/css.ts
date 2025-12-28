// @ts-expect-error - CSS import handled by Bun
import xtermCss from "@xterm/xterm/css/xterm.css"
import { DEFAULT_BG } from "@/terminal/constants"

let injected = false

export function injectTerminalCss(): void {
  if (injected) return
  injected = true

  const styleEl = document.createElement("style")
  styleEl.textContent =
    xtermCss +
    `
		.xterm-viewport {
			overflow-y: hidden !important;
			overflow-x: hidden !important;
		}
		.xterm-viewport::-webkit-scrollbar {
			display: none !important;
			width: 0 !important;
		}
		.terminal-wrapper, .terminal-wrapper .xterm, .terminal-wrapper .xterm-viewport {
			background-color: var(--background-primary, ${DEFAULT_BG}) !important;
		}
	`
  document.head.appendChild(styleEl)
}
