import { WebglAddon } from "@xterm/addon-webgl"
import { Terminal } from "@xterm/xterm"
import { ItemView, type WorkspaceLeaf, Modal, Notice, type App } from "obsidian"
import * as path from "path"
import { injectTerminalCss } from "@/ui/css"
import { getPluginDir, getVaultPath } from "@/utils/paths"
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  DEFAULT_SCROLLBACK,
  TERMINAL_VIEW_TYPE,
} from "@/terminal/constants"
import { fitToContainer } from "@/terminal/fit"
import {
  connectPtyToTerminal,
  killPty,
  type PtyProcess,
  spawnPty,
  NodePtyNotFoundError,
  isNodePtyAvailable,
} from "@/terminal/pty"
import { applyTheme, getObsidianTheme } from "@/terminal/theme"

export class TerminalView extends ItemView {
  private terminal: Terminal | null = null
  private pty: PtyProcess | null = null
  private webglAddon: WebglAddon | null = null
  private ptyDataDisposable: { dispose: () => void } | null = null
  private resizeObserver: ResizeObserver | null = null
  private themeObserver: MutationObserver | null = null
  private currentTitle = "Terminal"
  private checkInterval: any = null

  navigation = false

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return TERMINAL_VIEW_TYPE
  }

  getDisplayText(): string {
    return this.currentTitle || "Terminal"
  }

  getIcon(): string {
    return "terminal"
  }

  async onOpen() {
    injectTerminalCss()
    this.setupContainer()
    this.createTerminal()
    this.spawnShell()
    this.registerEvents()
  }

  async onClose() {
    this.dispose()
  }

  private setupContainer(): void {
    const container = this.contentEl
    container.empty()
    container.addClass("obsidian-btw-terminal-container")

    const parent = container.parentElement
    if (parent) {
      parent.addClass("workspace-leaf-content")
    }

    container.createDiv({ cls: "obsidian-btw-terminal-spacer" })

    const rowDiv = container.createDiv({ cls: "obsidian-btw-terminal-row" })
    rowDiv.createDiv({ cls: "obsidian-btw-terminal-left-spacer" })

    rowDiv.createDiv({ cls: "terminal-wrapper" })
  }

  private createTerminal(): void {
    const terminalDiv = this.contentEl.querySelector(".terminal-wrapper") as HTMLElement
    if (!terminalDiv) return

    if ("ResizeObserver" in window) {
      if (!this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.fit()
        })
      }
      this.resizeObserver.observe(terminalDiv)
    }

    const theme = getObsidianTheme()
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT,
      theme: theme as any,
      allowProposedApi: true,
      scrollback: DEFAULT_SCROLLBACK,
      overviewRulerWidth: 0,
    })

    this.terminal.open(terminalDiv)
    this.setupTitleHandler()

    requestAnimationFrame(() => {
      this.fit()
      setTimeout(() => this.loadWebgl(), 0)
    })
  }

  private setupTitleHandler(): void {
    if (!this.terminal) return

    this.terminal.onTitleChange((title: string) => {
      const raw = (title ?? "").trim()
      if (!raw) {
        this.currentTitle = "Terminal"
      } else {
        const hasAt = raw.includes("@")
        const parts = raw.split(/\s+/)

        if (hasAt && parts.length >= 2) {
          this.currentTitle = "Terminal"
        } else {
          this.currentTitle = parts[0] || raw || "Terminal"
        }
      }

      const headerEl = (this.leaf as any).tabHeaderInnerTitleEl as HTMLElement | undefined
      if (headerEl) {
        headerEl.setText(this.currentTitle)
      }
    })
  }

  private loadWebgl(): void {
    if (!this.terminal) return
    try {
      this.webglAddon = new WebglAddon()
      this.terminal.loadAddon(this.webglAddon)
    } catch {
      this.webglAddon = null
    }
  }

  private spawnShell(): void {
    if (!this.terminal) return

    if (!this.pty) this.terminal.clear()

    try {
      this.pty = spawnPty({
        cols: this.terminal.cols || 80,
        rows: this.terminal.rows || 24,
        cwd: getVaultPath(this.app),
        pluginDir: getPluginDir(this.app),
      })

      this.ptyDataDisposable = connectPtyToTerminal(this.pty, this.terminal)

      this.pty.onExit(({ exitCode, signal }) => {
        const msg = `\r\n[process exited${exitCode !== 0 ? ` with code ${exitCode}` : ""}${signal ? `, signal ${signal}` : ""}]\r\n`
        this.terminal?.write(msg)
        this.pty = null
      })

      this.terminal.onData((data) => this.pty?.write(data))
      this.terminal.onBinary((data) => this.pty?.write(data))
    } catch (err) {
      if (err instanceof NodePtyNotFoundError) {
        this.terminal.write("\r\n[node-pty is not installed – opened setup helper]\r\n")
        new NodePtySetupModal(this.app).open()
      } else {
        this.terminal.write(`failed to spawn terminal: ${err}\r\n`)
        console.error(err)
      }
    }

    if (this.checkInterval) clearInterval(this.checkInterval)
    this.checkInterval = setInterval(() => {
      if (isNodePtyAvailable(getPluginDir(this.app)) && !this.pty) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
        this.spawnShell()
      }
    }, 500)
  }

  private registerEvents(): void {
    this.registerEvent(this.app.workspace.on("resize", () => this.fit()))

    this.registerEvent(this.app.workspace.on("css-change", () => this.applyTheme()))

    this.setupThemeObserver()
  }

  private setupThemeObserver(): void {
    if (this.themeObserver) return

    const targetNode = document.body

    const callback = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          const attrName = mutation.attributeName
          if (attrName === "class" || attrName === "style") {
            this.applyTheme()
            break
          }
        }
      }
    }

    this.themeObserver = new MutationObserver(callback)
    this.themeObserver.observe(targetNode, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
  }

  private fit(): void {
    if (!this.terminal) return
    const wrapper = this.contentEl.querySelector(".terminal-wrapper") as HTMLElement
    if (wrapper) {
      fitToContainer(this.terminal, this.pty, wrapper)
    }
  }

  private applyTheme(): void {
    if (!this.terminal) return
    const theme = getObsidianTheme()
    this.webglAddon = applyTheme(this.terminal, theme, this.webglAddon, WebglAddon)

    const wrapper = this.contentEl.querySelector(".terminal-wrapper") as HTMLElement
    if (wrapper) {
      wrapper.style.backgroundColor = theme.background
    }
  }

  private dispose(): void {
    if (this.resizeObserver) {
      try {
        this.resizeObserver.disconnect()
      } catch {}
      this.resizeObserver = null
    }

    if (this.themeObserver) {
      try {
        this.themeObserver.disconnect()
      } catch {}
      this.themeObserver = null
    }

    if (this.ptyDataDisposable) {
      try {
        this.ptyDataDisposable.dispose()
      } catch {}
      this.ptyDataDisposable = null
    }

    killPty(this.pty)
    this.pty = null

    if (this.webglAddon) {
      try {
        this.webglAddon.dispose()
      } catch {}
      this.webglAddon = null
    }

    if (this.terminal) {
      try {
        this.terminal.dispose()
      } catch {}
      this.terminal = null
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

class NodePtySetupModal extends Modal {
  private installCmd = ""
  private checkInterval: any = null

  constructor(app: App) {
    super(app)
    const pluginDir = getPluginDir(app)
    const electronVersion = (process.versions as any)?.electron
    const versionPart = electronVersion ? ` --version=${electronVersion}` : ""
    this.installCmd = `cd "${pluginDir}" && npm install -y node-pty && npx --yes electron-rebuild -f -w node-pty${versionPart}`
  }

  onOpen(): void {
    const { contentEl } = this
    contentEl.empty()

    contentEl
      .createEl("h2", { text: "terminal setup is incomplete" })
      .addClass("node-pty-setup-title")

    contentEl.createEl("p", {
      text: "this terminal view needs the native node-pty module. install it in the plugin folder to enable the terminal.",
    })

    contentEl.createEl("code", { text: this.installCmd, cls: "node-pty-setup-code" })

    const buttons = contentEl.createDiv({ cls: "node-pty-setup-buttons" })

    const copyBtn = buttons.createEl("button", { text: "copy command" })
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(this.installCmd)
        new Notice("install command copied to clipboard")
      } catch {
        new Notice("failed to use clipboard. copy the command manually.")
      }
    }

    const whyBtn = buttons.createEl("button", { text: "why?" })

    const whyEl = contentEl.createDiv({ cls: "node-pty-setup-why" })

    whyEl.createEl("p", {
      text: "node-pty is a native library that gives the terminal real shell i/o. without it, obsidian can't talk to your system shell in a proper pseudo-terminal, so this plugin disables the terminal instead of crashing.",
    })
    whyEl.createEl("p", {
      text: "install node-pty once in the plugin directory and rebuild the native module. after restarting obsidian, the terminal will work.",
    })

    whyBtn.onclick = () => {
      if (whyEl.hasClass("show")) {
        whyEl.removeClass("show")
      } else {
        whyEl.addClass("show")
      }
    }

    this.checkInterval = setInterval(() => {
      const pluginDir = getPluginDir(this.app)
      const ptyPath = path.join(pluginDir, "node_modules", "node-pty")
      try {
        require(ptyPath)
        new Notice("node-pty installed. please restart obsidian to use the terminal.")
        this.close()
      } catch {}
    }, 500)
  }

  onClose(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.contentEl.empty()
  }
}
