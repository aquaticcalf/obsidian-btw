import { Plugin } from "obsidian"
import { TERMINAL_VIEW_TYPE, TerminalView } from "@/terminal"
import { patchNewTabButtons } from "@/ui/tab-button"

export default class ObsidianBTW extends Plugin {
  private patchedButtons = new WeakSet<HTMLElement>()

  async onload() {
    this.registerView(TERMINAL_VIEW_TYPE, (leaf) => new TerminalView(leaf))

    this.app.workspace.onLayoutReady(() => {
      this.openTerminal()
      this.patchButtons()
    })

    this.addCommand({
      id: "new-terminal",
      name: "New Terminal",
      callback: () => this.createTerminal(),
    })

    this.registerEvent(this.app.workspace.on("layout-change", () => this.patchButtons()))
  }

  private patchButtons(): void {
    patchNewTabButtons(this.app, this.patchedButtons, TERMINAL_VIEW_TYPE, (parent) =>
      this.createTerminalInSplit(parent),
    )
  }

  private async createTerminalInSplit(parent: any): Promise<void> {
    const leaf = this.app.workspace.createLeafInParent(parent, -1)
    await leaf.setViewState({ type: TERMINAL_VIEW_TYPE, active: true })
    this.app.workspace.revealLeaf(leaf)
  }

  private async createTerminal(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(TERMINAL_VIEW_TYPE)

    if (leaves.length > 0 && leaves[0].parent) {
      await this.createTerminalInSplit(leaves[0].parent)
      return
    }

    await this.openTerminal()
  }

  private async openTerminal(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(TERMINAL_VIEW_TYPE)

    if (leaves.length > 0) {
      this.app.workspace.revealLeaf(leaves[0])
      return
    }

    const leaf = this.app.workspace.getLeaf("split", "horizontal")
    if (leaf) {
      await leaf.setViewState({ type: TERMINAL_VIEW_TYPE, active: true })
      this.app.workspace.revealLeaf(leaf)
    }
  }
}
