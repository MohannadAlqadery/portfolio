/** Label for the platform's command modifier: "⌘" on Apple devices, "Ctrl" elsewhere. */
export function modKeyLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl'
}

/** Best-effort Apple platform detection, only used to label the shortcut key. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}
