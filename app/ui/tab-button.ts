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
): { dispose: () => void } {
  const disposables: (() => void)[] = []
  const buttons = document.querySelectorAll(".workspace-tab-header-new-tab")

  console.log("[tab-button] patchNewTabButtons called")
  console.log("[tab-button] Found buttons:", buttons.length)

  for (const btn of Array.from(buttons)) {
    const button = btn as HTMLElement
    if (patchedButtons.has(button)) {
      console.log("[tab-button] Button already patched, skipping:", button)
      continue
    }
    console.log("[tab-button] Patching new button:", button)
    patchedButtons.add(button)

    const handler = (e: Event) => {
      console.log("[tab-button] Click handler fired on button:", button)
      console.log("[tab-button] Event target:", e.target)
      console.log("[tab-button] Current target:", e.currentTarget)

      const tabContainer = button.closest(".workspace-tabs")
      console.log("[tab-button] Tab container found:", !!tabContainer)

      if (!tabContainer) return

      const activeLeaf = getActiveLeafInContainer(app, tabContainer as HTMLElement)
      console.log("[tab-button] Active leaf found:", !!activeLeaf)
      console.log("[tab-button] Active leaf view type:", activeLeaf?.view?.getViewType?.())
      console.log("[tab-button] Target view type:", viewType)
      console.log(
        "[tab-button] Match:",
        activeLeaf && activeLeaf.view?.getViewType?.() === viewType,
      )

      if (activeLeaf && activeLeaf.view?.getViewType?.() === viewType) {
        console.log("[tab-button] Handling click - creating terminal split")
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        const parent = activeLeaf.parent
        if (parent) {
          onTerminalTabClick(parent)
        }
      } else {
        console.log("[tab-button] Not handling click - not in terminal view")
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
