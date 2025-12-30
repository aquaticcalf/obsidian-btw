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
  viewType: string,
  onTerminalTabClick: (parent: any) => void,
): { dispose: () => void } {
  const patchedButtons = new WeakSet<HTMLElement>()
  const disposables: (() => void)[] = []

  function patchButton(button: HTMLElement): void {
    if (patchedButtons.has(button)) return

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

  // Patch all existing buttons
  const existingButtons = document.querySelectorAll(".workspace-tab-header-new-tab")
  for (const btn of Array.from(existingButtons)) {
    patchButton(btn as HTMLElement)
  }

  // Set up MutationObserver to patch new buttons as they're added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const addedNodesArray = Array.from(mutation.addedNodes)
      for (let i = 0; i < addedNodesArray.length; i++) {
        const node = addedNodesArray[i]
        if (node instanceof HTMLElement) {
          // Check if the added node is a button
          if (node.matches(".workspace-tab-header-new-tab")) {
            patchButton(node)
          }
          // Check for buttons within the added subtree
          const nestedButtons = node.querySelectorAll?.(".workspace-tab-header-new-tab")
          if (nestedButtons) {
            const buttonsArray = Array.from(nestedButtons)
            for (let i = 0; i < buttonsArray.length; i++) {
              patchButton(buttonsArray[i] as HTMLElement)
            }
          }
        }
      }
    }
  })

  // Observe the entire document for new button elements
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  disposables.push(() => observer.disconnect())

  return {
    dispose: () => {
      for (const dispose of disposables) {
        dispose()
      }
    },
  }
}
