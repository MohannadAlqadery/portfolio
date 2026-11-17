import { Section } from '@/components/layout/Section'
import { Chip } from '@/components/ui/Chip'
import { Panel } from '@/components/ui/Panel'
import { education } from '@/content/education'
import { formatMonth } from '@/lib/dates'

const pad = (n: number) => n.toString().padStart(2, '0')

export function EducationSection() {
  return (
    <Section
      id="education"
      title={
        <>
          The <em className="text-fg-muted">groundwork</em>
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <Panel
          title="degree"
          meta={`${formatMonth(education.start)} → ${formatMonth(education.end)}`}
          className="self-start lg:col-span-6"
        >
          <h3 className="font-display text-3xl leading-tight text-fg md:text-4xl">
            {education.degree}
          </h3>
          <p className="mt-3 text-fg-muted">
            {education.school} · {education.location}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-fg-muted">{education.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip variant="signal" dot>
              Graduated
            </Chip>
            <Chip>{education.result}</Chip>
          </div>
        </Panel>

        <div className="lg:col-span-6">
          <h3 className="mb-4 label text-fg-subtle">Coursework</h3>
          <ol className="border-t border-line">
            {education.coursework.map((course, i) => (
              <li
                key={course.name}
                className="grid grid-cols-[2rem_1fr] items-baseline gap-x-2 border-b border-line py-4"
              >
                <span className="label text-fg-subtle">{pad(i + 1)}</span>
                <span className="text-lg text-fg">{course.name}</span>
                <span className="col-start-2 mt-1 text-sm leading-relaxed text-fg-muted">
                  {course.detail}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}
