import type { App, WorkspaceLeaf } from "obsidian"

export function getActiveLeafInContainer(
  app: App,
  tabContainer: HTMLElement,
): WorkspaceLeaf | null {
  let foundLeaf: WorkspaceLeaf | null = null

  app.workspace.iterateAllLeaves((leaf) => {
    if (foundLeaf) return

    type TabParent = {
      containerEl?: HTMLElement
      currentTab?: number
      children?: WorkspaceLeaf[]
    }

    const parent = leaf.parent as TabParent | null | undefined
    if (!parent?.containerEl) return

    if (parent.containerEl === tabContainer || tabContainer.contains(parent.containerEl)) {
      if (
        typeof parent.currentTab === "number" &&
        parent.children &&
        parent.children[parent.currentTab]
      ) {
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
  onTerminalTabClick: (parent: unknown) => void,
): { dispose: () => void } {
  const disposables: (() => void)[] = []
  const buttons = document.querySelectorAll(".workspace-tab-header-new-tab")

  for (const btn of Array.from(buttons)) {
    const button = btn as HTMLElement
    if (patchedButtons.has(button)) continue
    patchedButtons.add(button)

    const handler = (e: Event) => {
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
    }

    button.addEventListener("click", handler, { capture: true })
    disposables.push(() =>
      button.removeEventListener("click", handler, { capture: true as boolean }),
    )
  }

  return {
    dispose: () => {
      for (const dispose of disposables) {
        dispose()
      }
    },
  }
}
