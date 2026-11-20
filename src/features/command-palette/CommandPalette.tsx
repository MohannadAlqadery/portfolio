import { Command } from 'cmdk'
import { ArrowUp, AtSign, Copy, CornerDownLeft, FileText, Hash, NotebookPen } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LinkedinIcon } from '@/components/icons/BrandIcons'
import { Kbd } from '@/components/ui/Kbd'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { notePath, notes } from '@/features/notes/notes'
import { copyToClipboard, getEmail } from '@/lib/email'
import { navigate } from '@/lib/router'
import { goHome, goToSection } from '@/lib/scroll'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

function Item({
  value,
  keywords,
  icon,
  hint,
  onSelect,
  children,
}: {
  value: string
  keywords?: string[]
  icon: ReactNode
  hint?: ReactNode
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords ?? []}
      onSelect={onSelect}
      className="flex h-10 cursor-pointer items-center gap-3 rounded-sm px-3 text-sm text-fg-muted transition-colors duration-150 select-none data-[selected=true]:bg-raised data-[selected=true]:text-fg"
    >
      <span aria-hidden="true" className="text-fg-subtle [&_svg]:size-4">
        {icon}
      </span>
      <span className="flex-1 truncate">{children}</span>
      {hint ? <span className="label text-fg-subtle">{hint}</span> : null}
    </Command.Item>
  )
}

const groupClass =
  'px-2 pb-2 [&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-fg-subtle'

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [status, setStatus] = useState<string | null>(null)

  const run = (action: () => void) => {
    onOpenChange(false)
    // Let the dialog close and return focus before scrolling/moving focus.
    window.setTimeout(action, 0)
  }

  const copyEmail = async () => {
    const ok = await copyToClipboard(getEmail())
    setStatus(ok ? 'Email copied to clipboard' : 'Could not copy. Try the contact section.')
    window.setTimeout(() => onOpenChange(false), ok ? 700 : 1800)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setStatus(null)
      }}
      label="Command palette"
      loop
      // Enter and exit animations keyed to Radix's data-state (it waits for the exit to finish).
      overlayClassName="fixed inset-0 z-50 bg-canvas/70 backdrop-blur-[2px] data-[state=closed]:animate-backdrop-out data-[state=open]:animate-backdrop-in"
      contentClassName="fixed inset-x-4 top-[max(12vh,calc(env(safe-area-inset-top)+1rem))] z-50 mx-auto max-w-lg origin-top overflow-hidden rounded-md border border-line-strong bg-surface shadow-2xl shadow-black/60 will-change-[transform,opacity] data-[state=closed]:animate-panel-out data-[state=open]:animate-panel-in sm:inset-x-0"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span aria-hidden="true" className="font-mono text-sm text-signal">
          &gt;
        </span>
        <Command.Input
          placeholder="Jump to a section, open a note, or run a command"
          className="h-12 flex-1 bg-transparent font-mono text-sm text-fg outline-none placeholder:text-fg-subtle"
        />
        <Kbd>Esc</Kbd>
      </div>

      {/* cmdk measures its content into --cmdk-list-height, so the list glides as results filter. */}
      <Command.List className="h-[min(var(--cmdk-list-height),min(60vh,24rem))] overflow-y-auto overscroll-contain transition-[height] duration-200 ease-[var(--ease-out-expo)] motion-reduce:transition-none">
        <Command.Empty className="px-5 py-8 font-mono text-sm text-fg-subtle">
          No match. Try “contact” or “toolkit”.
        </Command.Empty>

        <Command.Group heading="Navigate" className={groupClass}>
          {sections.map((section, i) => (
            <Item
              key={section.id}
              value={`go ${section.label}`}
              keywords={[section.id]}
              icon={<Hash />}
              hint={pad(i + 1)}
              onSelect={() => run(() => goToSection(section.id))}
            >
              {section.label}
            </Item>
          ))}
          <Item
            value="back to top home"
            keywords={['home', 'top']}
            icon={<ArrowUp />}
            onSelect={() => run(goHome)}
          >
            Back to top
          </Item>
        </Command.Group>

        <Command.Group heading="Field notes" className={groupClass}>
          <Item
            value="all field notes"
            keywords={['notes', 'blog', 'writing']}
            icon={<NotebookPen />}
            onSelect={() => run(() => navigate('/notes'))}
          >
            All field notes
          </Item>
          {notes.map((note) => (
            <Item
              key={note.slug}
              value={`note ${note.title}`}
              keywords={note.tags}
              icon={<FileText />}
              hint={note.cert}
              onSelect={() => run(() => navigate(notePath(note.slug)))}
            >
              {note.title}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading="Contact" className={groupClass}>
          <Item
            value="copy email"
            keywords={['mail', 'contact']}
            icon={<Copy />}
            onSelect={() => void copyEmail()}
          >
            Copy email address
          </Item>
          <Item
            value="send email"
            keywords={['mail', 'contact']}
            icon={<AtSign />}
            onSelect={() => run(() => window.location.assign(`mailto:${getEmail()}`))}
          >
            Write an email
          </Item>
          <Item
            value="linkedin"
            keywords={['social', 'profile']}
            icon={<LinkedinIcon />}
            hint="↗"
            onSelect={() =>
              run(() => window.open(site.links.linkedin, '_blank', 'noopener,noreferrer'))
            }
          >
            LinkedIn
          </Item>
        </Command.Group>
      </Command.List>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 label text-fg-subtle">
        <output aria-live="polite" className="truncate text-signal">
          {status}
        </output>
        <span className="flex shrink-0 items-center gap-1.5">
          <CornerDownLeft aria-hidden="true" className="size-3" /> select
          <span aria-hidden="true" className="mx-1">
            ·
          </span>
          ↑↓ move
        </span>
      </div>
    </Command.Dialog>
  )
}
