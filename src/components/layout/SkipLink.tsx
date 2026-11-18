/** First focusable element on the page; lets keyboard users bypass the header. */
export function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-[calc(env(safe-area-inset-top)+0.75rem)] left-[max(0.75rem,env(safe-area-inset-left))] z-50 -translate-y-16 rounded-sm bg-signal px-3 py-2 label text-canvas transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  )
}
