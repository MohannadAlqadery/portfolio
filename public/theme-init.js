// Applies the saved colour theme before first paint, so light-mode visitors never see a dark flash.
// Loaded as a tiny blocking external script (not inline) so the CSP stays `script-src 'self'`.
// Keep in sync with src/lib/theme.ts (storage key, attribute, theme colours).
;(function () {
  var theme = 'dark'
  try {
    if (localStorage.getItem('theme') === 'light') theme = 'light'
  } catch {
    // Storage blocked (private mode, disabled cookies): fall back to the default.
  }
  var root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f4f2' : '#0a0a0a')
})()
