import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { NOT_FOUND_TITLE } from '@/features/notes/meta'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFoundPage() {
  useDocumentMeta(NOT_FOUND_TITLE)

  return (
    <Container className="flex min-h-[70svh] flex-col justify-center py-24">
      <p className="label text-fg-subtle">
        <span className="text-sev-medium">404</span> · No matching record
      </p>
      <h1 className="mt-5 font-display text-display text-fg">
        Signal <em className="text-fg-muted">lost</em>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-fg-muted">
        This page doesn’t exist, or it moved. The query returned zero rows.
      </p>
      <div className="mt-10 flex flex-wrap gap-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 label text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft aria-hidden="true" className="size-3" />
          Back to the homepage
        </Link>
        <Link to="/notes" className="label text-fg-muted transition-colors hover:text-fg">
          Browse field notes
        </Link>
      </div>
    </Container>
  )
}
