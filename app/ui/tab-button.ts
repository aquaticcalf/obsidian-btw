import type { App, WorkspaceLeaf } from "obsidian"

export function getActiveLeafInContainer(
  app: App,
  tabContainer: HTMLElement,
): WorkspaceLeaf | null {
  let foundLeaf: WorkspaceLeaf | null = null

  app.workspace.iterateAllLeaves((leaf) => {
    if (foundLeaf) return

    const parent = leaf.parent as any
    if (!parent?.containerEl) return

    if (parent.containerEl === tabContainer || tabContainer.contains(parent.containerEl)) {
      if (parent.currentTab !== undefined && parent.children) {
        const currentLeaf = parent.children[parent.currentTab]
        if (currentLeaf === leaf) {
          foundLeaf = leaf
        }
      }
    }
  })

  return foundLeaf
}

export function patchNewTabButtons(
  app: App,
  patchedButtons: WeakSet<HTMLElement>,
  viewType: string,
  onTerminalTabClick: (parent: any) => void,
): void {
  const buttons = document.querySelectorAll(".workspace-tab-header-new-tab")

  for (const btn of Array.from(buttons)) {
    const button = btn as HTMLElement
    if (patchedButtons.has(button)) continue
    patchedButtons.add(button)

    button.addEventListener(
      "click",
      (e) => {
        const tabContainer = button.closest(".workspace-tabs")
        if (!tabContainer) return

        const activeLeaf = getActiveLeafInContainer(app, tabContainer as HTMLElement)

        if (activeLeaf && activeLeaf.view?.getViewType?.() === viewType) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()

          const parent = activeLeaf.parent
          if (parent) {
            onTerminalTabClick(parent)
          }
        }
      },
      { capture: true },
    )
  }
}
