import { Check, Copy, Link2 } from 'lucide-react'
import {
  Children,
  isValidElement,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { copyToClipboard } from '@/lib/email'
import { slugify } from './slugify'

/** Plain text of a React subtree, used for heading ids. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

const LANGUAGE_LABELS: Record<string, string> = {
  kql: 'KQL',
  spl: 'SPL',
  bash: 'Bash',
  powershell: 'PowerShell',
  yaml: 'YAML',
  text: 'Text',
}

function languageOf(children: ReactNode): string | undefined {
  const child = Children.toArray(children)[0]
  if (!isValidElement<{ className?: string }>(child)) return undefined
  return /language-(\S+)/.exec(child.props.className ?? '')?.[1]
}

/** Highlighted code block (tokens from Shiki at build time) with a language label and copy button. */
export function CodeBlock({
  children,
  className,
  style,
  ...props
}: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const language = languageOf(children)

  const onCopy = async () => {
    const text = ref.current?.innerText ?? ''
    if (await copyToClipboard(text)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="my-7 overflow-hidden rounded-md border border-line bg-surface">
      <div className="flex h-9 items-center justify-between border-b border-line px-4 label text-fg-subtle">
        <span>{language ? (LANGUAGE_LABELS[language] ?? language) : 'Code'}</span>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-3 text-signal" />
          ) : (
            <Copy aria-hidden="true" className="size-3" />
          )}
          <span className={copied ? 'text-signal' : undefined}>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        ref={ref}
        {...props}
        // Shiki sets background/colour via CSS variables; keep them, but the block owns the layout.
        style={style}
        className={`${className ?? ''} overflow-x-auto p-4 font-mono text-[0.8125rem] leading-6`}
      >
        {children}
      </pre>
    </div>
  )
}

/** "Key takeaways" box used at the top of a note: `<Takeaways>` + a Markdown list in MDX. */
export function Takeaways({ children }: { children?: ReactNode }) {
  return (
    <aside
      aria-label="Key takeaways"
      className="my-8 rounded-md border border-signal/30 bg-signal-wash/50 px-5 pt-4 pb-1 [&_ul]:my-3"
    >
      <p className="label text-signal">Key takeaways</p>
      {children}
    </aside>
  )
}

/** Section heading with a stable id and a hover/focus anchor link. */
export function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const id = slugify(textOf(children))
  const Tag = level === 2 ? 'h2' : 'h3'
  return (
    <Tag
      id={id}
      className={
        level === 2
          ? 'group mt-14 mb-4 scroll-mt-[calc(5rem+env(safe-area-inset-top))] font-display text-3xl leading-tight text-fg md:text-4xl'
          : 'group mt-10 mb-3 scroll-mt-[calc(5rem+env(safe-area-inset-top))] text-lg font-medium text-fg'
      }
    >
      {children}
      <a
        href={`#${id}`}
        className="ml-2 inline-block align-middle text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Link2 aria-hidden="true" className="size-4" />
        <span className="sr-only">Link to this section</span>
      </a>
    </Tag>
  )
}
