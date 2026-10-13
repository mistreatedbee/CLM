'use client'

import { Check, Clock, Monitor, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, studyModeLabel, type PublicCourse } from '@/lib/courses'

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition',
        active
          ? 'border-primary bg-primary/5'
          : 'border-input bg-background hover:border-primary/50 hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2',
          active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
        )}
      >
        {active && <Check className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </button>
  )
}

export function CourseStep({
  courses,
  value,
  onChange,
}: {
  courses: PublicCourse[]
  value: string
  onChange: (courseId: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg leading-relaxed text-muted-foreground">
        You can apply for one of our courses, or apply for membership of the movement only.
      </p>

      <div role="radiogroup" aria-label="Course" className="flex flex-col gap-3">
        {courses.map((c) => (
          <Option key={c.id} active={value === c.id} onClick={() => onChange(c.id)}>
            <p className="text-lg font-semibold text-foreground">{c.name}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base text-muted-foreground">
              {c.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {c.duration}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Monitor className="size-4" /> {studyModeLabel(c.study_mode)}
              </span>
            </p>
            {c.description && (
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.description}</p>
            )}
            <p className="mt-2 text-base text-foreground">
              {c.price ? (
                <>
                  Registration fee: <strong>{formatMoney(c.price.registration_fee, c.price.currency)}</strong>
                  {' · '}Course: <strong>{formatMoney(c.price.course_fee, c.price.currency)}</strong>
                </>
              ) : (
                <span className="text-muted-foreground">Fees to be confirmed</span>
              )}
            </p>
          </Option>
        ))}

        <Option active={value === ''} onClick={() => onChange('')}>
          <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="size-5 text-primary" /> Membership only
          </p>
          <p className="mt-1 text-base text-muted-foreground">
            Join the movement without enrolling in a course right now.
          </p>
        </Option>
      </div>

      {courses.length === 0 && (
        <p className="text-base text-muted-foreground">
          No courses are open for applications at the moment.
        </p>
      )}
    </div>
  )
}
