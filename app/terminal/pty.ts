import type { Terminal } from "@xterm/xterm"
import * as os from "os"
import * as path from "path"

export interface PtyProcess {
  write(data: string): void
  resize(cols: number, rows: number): void
  kill(signal?: string): void
  onData(callback: (data: string) => void): { dispose: () => void }
  onExit(callback: (e: { exitCode: number; signal?: number }) => void): void
}

export interface PtyOptions {
  cols: number
  rows: number
  cwd: string
  pluginDir: string
}

export class NodePtyNotFoundError extends Error {
  constructor(message?: string) {
    super(message ?? "node-pty is not installed")
    this.name = "NodePtyNotFoundError"
  }
}

export function isNodePtyAvailable(pluginDir: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-pty must be required dynamically from the plugin directory.
    require(path.join(pluginDir, "node_modules", "node-pty"))
    return true
  } catch {
    return false
  }
}

let nodePty: unknown = null

function loadNodePty(pluginDir: string): unknown {
  if (nodePty) return nodePty

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-pty must be required dynamically from the plugin directory.
    nodePty = require(path.join(pluginDir, "node_modules", "node-pty"))
  } catch (err: unknown) {
    const isModuleNotFound =
      err && typeof err === "object" && (err as { code?: string }).code === "MODULE_NOT_FOUND"

    if (isModuleNotFound) {
      throw new NodePtyNotFoundError("node-pty is not installed in this plugin.")
    }

    throw new NodePtyNotFoundError(
      `failed to load node-pty : ${(err as Error)?.message ?? String(err)}`,
    )
  }

  return nodePty
}

export function spawnPty(opts: PtyOptions): PtyProcess {
  const pty = loadNodePty(opts.pluginDir) as {
    spawn: (shell: string, args: string[], opts: object) => PtyProcess
  }
  const shell = os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/bash"

  return pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: opts.cols,
    rows: opts.rows,
    cwd: opts.cwd,
    env: {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      LANG: process.env.LANG || "en_US.UTF-8",
    },
  })
}

export function killPty(pty: PtyProcess | null): void {
  if (!pty) return
  try {
    pty.kill("SIGKILL")
  } catch {
    // Ignore errors when killing the PTY
  }
}

export function connectPtyToTerminal(pty: PtyProcess, terminal: Terminal): { dispose: () => void } {
  return pty.onData((data) => {
    terminal.write(data)
  })
}
