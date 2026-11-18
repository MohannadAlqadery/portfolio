import type { MDXComponents } from 'mdx/types'
import { Link } from '@/components/ui/Link'
import { CodeBlock, Heading, Takeaways } from './NoteElements'

const linkClass =
  'text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:text-signal hover:decoration-signal'

/** Element mapping for note bodies. Styling lives here so MDX files stay plain Markdown. */
export const mdxComponents: MDXComponents = {
  Takeaways,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  p: (props) => <p className="my-5 leading-relaxed text-fg-muted" {...props} />,
  a: ({ href = '', children, ...props }) => {
    const external = /^https?:\/\//.test(href)
    // Links to other pages on this site navigate in-app (still real <a href> for crawlers).
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={linkClass}>
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className={linkClass}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
        {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    )
  },
  strong: (props) => <strong className="font-medium text-fg" {...props} />,
  ul: (props) => (
    <ul className="my-5 list-disc space-y-2 pl-5 text-fg-muted marker:text-signal" {...props} />
  ),
  ol: (props) => (
    <ol
      className="my-5 list-decimal space-y-2 pl-6 text-fg-muted marker:font-mono marker:text-xs marker:text-signal"
      {...props}
    />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-6 border-l-2 border-sev-medium/60 pl-4 text-fg-muted" {...props} />
  ),
  hr: () => <hr className="my-12 border-0 border-t border-line" />,
  table: (props) => (
    // Scrolls sideways on narrow screens, so it must be reachable and named for keyboard users
    // (WCAG 2.1.1 / axe scrollable-region-focusable). That is the documented exception to the rule below.
    <section
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label="Table (scrolls horizontally)"
      className="my-7 overflow-x-auto rounded-md border border-line focus-visible:outline-offset-2"
    >
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm" {...props} />
    </section>
  ),
  thead: (props) => <thead className="bg-raised" {...props} />,
  th: (props) => (
    <th className="border-b border-line px-4 py-2.5 label font-normal text-fg-subtle" {...props} />
  ),
  td: (props) => (
    <td className="border-b border-line px-4 py-2.5 align-top text-fg-muted" {...props} />
  ),
  pre: CodeBlock,
  code: ({ className, ...props }) =>
    // Code inside a highlighted block keeps Shiki's markup; only inline code gets the chip style.
    className?.includes('language-') ? (
      <code className={className} {...props} />
    ) : (
      <code
        className="rounded-sm border border-line bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
        {...props}
      />
    ),
}
