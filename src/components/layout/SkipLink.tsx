/** First focusable element on the page; lets keyboard users bypass the header. */
export function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-3 left-3 z-50 -translate-y-16 rounded-sm bg-signal px-3 py-2 label text-canvas transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  )
}
