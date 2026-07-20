'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Home,
  Loader2,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { submitApplication } from '@/app/actions/application'
import {
  emptyForm,
  STEP_KEYS,
  STEP_META,
  validateStep,
  type ApplicationForm,
  type Errors,
  type StepKey,
} from './form-model'
import {
  LeadershipStep,
  PersonalStep,
  ReferencesStep,
  SpiritualStep,
  VisionStep,
} from './steps'
import { ReviewStep } from './review-step'

const DRAFT_KEY = 'clm-application-draft'

type Phase = 'welcome' | 'form' | 'submitted'
type SaveState = 'idle' | 'saving' | 'saved'

function hasContent(f: ApplicationForm) {
  return Object.entries(f).some(([k, v]) => {
    if (k === 'country') return false
    if (typeof v === 'boolean') return true
    return typeof v === 'string' && v.trim().length > 0
  })
}

export function ApplicationWizard() {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState<ApplicationForm>(emptyForm)
  const [errors, setErrors] = useState<Errors>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [draftFound, setDraftFound] = useState(false)
  const [appNumber, setAppNumber] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const hydrated = useRef(false)

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.form && hasContent(parsed.form)) {
          setForm({ ...emptyForm, ...parsed.form })
          setDraftFound(true)
        }
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true
  }, [])

  // Autosave (debounced)
  useEffect(() => {
    if (!hydrated.current || phase === 'submitted') return
    if (!hasContent(form)) return
    setSaveState('saving')
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, stepIndex, at: Date.now() }))
        setSaveState('saved')
      } catch {
        setSaveState('idle')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [form, stepIndex, phase])

  const set = useCallback(
    <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
      setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
    },
    [],
  )

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const stepKey = STEP_KEYS[stepIndex]

  const goNext = () => {
    if (stepKey !== 'review') {
      const errs = validateStep(stepKey, form)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        scrollTop()
        return
      }
    }
    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1))
    setErrors({})
    scrollTop()
  }

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0))
    setErrors({})
    scrollTop()
  }

  const editStep = (s: StepKey) => {
    setStepIndex(STEP_KEYS.indexOf(s))
    scrollTop()
  }

  const startFresh = () => {
    setForm(emptyForm)
    setDraftFound(false)
    localStorage.removeItem(DRAFT_KEY)
    setStepIndex(0)
    setPhase('form')
  }

  const submit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    const result = await submitApplication(form)
    setSubmitting(false)

    if (!result.success) {
      setSubmitError(result.error)
      return
    }

    setAppNumber(result.ref)
    localStorage.removeItem(DRAFT_KEY)
    setPhase('submitted')
    window.scrollTo({ top: 0 })
  }

  if (phase === 'welcome') {
    return (
      <WelcomeScreen
        draftFound={draftFound}
        onStart={() => (draftFound ? setPhase('form') : startFresh())}
        onResume={() => setPhase('form')}
        onFresh={startFresh}
      />
    )
  }

  if (phase === 'submitted') {
    return (
      <SubmittedScreen
        appNumber={appNumber}
        copied={copied}
        onCopy={() => {
          navigator.clipboard?.writeText(appNumber)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      />
    )
  }

  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-6">
      <ProgressIndicator stepIndex={stepIndex} onJump={editStep} />

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[color:var(--gold)]">
              Step {stepIndex + 1} of {STEP_KEYS.length}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {STEP_META[stepKey].title}
            </h1>
          </div>
          <SaveBadge state={saveState} />
        </div>

        {stepKey === 'personal' && <PersonalStep form={form} set={set} errors={errors} />}
        {stepKey === 'spiritual' && <SpiritualStep form={form} set={set} errors={errors} />}
        {stepKey === 'leadership' && <LeadershipStep form={form} set={set} errors={errors} />}
        {stepKey === 'vision' && <VisionStep form={form} set={set} errors={errors} />}
        {stepKey === 'references' && <ReferencesStep form={form} set={set} errors={errors} />}
        {stepKey === 'review' && <ReviewStep form={form} onEdit={editStep} />}

        {stepKey === 'review' && (
          <>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-success">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p className="text-base font-medium">
                Please check your answers. When you are ready, submit your application below.
              </p>
            </div>
            {submitError && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive">
                <AlertCircle className="mt-0.5 size-5 shrink-0" />
                <p className="text-base font-medium">{submitError}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {stepIndex > 0 ? (
          <Button
            variant="outline"
            onClick={goBack}
            className="h-14 gap-2 px-6 text-lg sm:w-auto"
          >
            <ArrowLeft className="size-5" /> Back
          </Button>
        ) : (
          <Link href="/">
            <Button variant="ghost" className="h-14 gap-2 px-4 text-lg">
              <Home className="size-5" /> Exit
            </Button>
          </Link>
        )}

        {stepKey === 'review' ? (
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-14 gap-2 px-8 text-lg font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="size-5" /> Submit application
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} className="h-14 gap-2 px-8 text-lg font-semibold">
            Continue <ArrowRight className="size-5" />
          </Button>
        )}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-base text-muted-foreground">
        <Save className="size-4" /> Your progress is saved automatically. You can safely close this
        page and come back later.
      </p>
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
      aria-live="polite"
    >
      {state === 'saving' ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Saving
        </>
      ) : (
        <>
          <Check className="size-4 text-success" /> Saved
        </>
      )}
    </span>
  )
}

function ProgressIndicator({
  stepIndex,
  onJump,
}: {
  stepIndex: number
  onJump: (s: StepKey) => void
}) {
  const pct = ((stepIndex + 1) / STEP_KEYS.length) * 100
  return (
    <div>
      <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="flex items-center justify-between gap-1">
        {STEP_KEYS.map((k, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <li key={k} className="flex flex-1 flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => (done ? onJump(k) : undefined)}
                disabled={!done}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'grid size-9 place-items-center rounded-full border-2 text-sm font-bold transition',
                  active && 'border-primary bg-primary text-primary-foreground',
                  done && 'border-success bg-success text-success-foreground hover:scale-105',
                  !active && !done && 'border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </button>
              <span
                className={cn(
                  'hidden text-center text-xs font-medium sm:block',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {STEP_META[k].short}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function WelcomeScreen({
  draftFound,
  onStart,
  onResume,
  onFresh,
}: {
  draftFound: boolean
  onStart: () => void
  onResume: () => void
  onFresh: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <img
        src="/images/welcome-illustration.png"
        alt="A friendly person completing a simple form on their phone"
        className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-card shadow-sm"
      />
      <h1 className="mt-8 font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
        Welcome! Let’s begin your application
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        We will ask a few simple questions about you and your faith. Take your time, there is no
        rush.
      </p>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
        <InfoRow icon={<Clock className="size-5" />} text="Takes about 15 minutes to complete" />
        <InfoRow icon={<Save className="size-5" />} text="Your answers save automatically as you go" />
        <InfoRow
          icon={<ShieldCheck className="size-5" />}
          text="Your information is private and kept safe"
        />
      </div>

      {draftFound ? (
        <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
          <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-base font-medium text-foreground">
            We found an application you started earlier. Would you like to continue?
          </div>
          <Button onClick={onResume} className="h-16 gap-2 text-xl font-semibold">
            <RotateCcw className="size-6" /> Resume my application
          </Button>
          <Button variant="ghost" onClick={onFresh} className="h-12 text-base">
            Start a new application instead
          </Button>
        </div>
      ) : (
        <Button onClick={onStart} className="mx-auto mt-8 h-16 gap-2 px-10 text-xl font-semibold">
          <Sparkles className="size-6" /> Start application
        </Button>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        By continuing you agree to our privacy notice. We only use your information to process your
        application.
      </p>
    </div>
  )
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-base font-medium text-foreground">{text}</span>
    </div>
  )
}

function SubmittedScreen({
  appNumber,
  copied,
  onCopy,
}: {
  appNumber: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <img
        src="/images/success-illustration.png"
        alt="Celebration with a large golden checkmark"
        className="mx-auto w-full max-w-xs animate-in fade-in zoom-in-95 duration-500"
      />
      <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
        Your application is in!
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
        Thank you for applying to the Christian Leadership Movement. We have received your
        application and sent a confirmation to your email.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-card p-6">
        <p className="text-base font-medium text-muted-foreground">Your application number</p>
        <p className="mt-2 font-heading text-2xl font-extrabold tracking-wide text-primary sm:text-3xl">
          {appNumber}
        </p>
        <Button variant="outline" onClick={onCopy} className="mt-4 h-12 gap-2 px-5 text-base">
          {copied ? <Check className="size-5 text-success" /> : <Copy className="size-5" />}
          {copied ? 'Copied' : 'Copy number'}
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          Please keep this number safe. You may need it to check your progress.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-md rounded-2xl bg-secondary/60 p-6 text-left">
        <h2 className="font-heading text-lg font-bold text-foreground">What happens next?</h2>
        <ol className="mt-3 space-y-3">
          {[
            'Our team reviews your application within 5 working days.',
            'We may contact your reference to confirm your details.',
            'You will receive an email with the outcome and next steps.',
          ].map((t, i) => (
            <li key={i} className="flex gap-3 text-base text-foreground">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <Link href="/" className="mt-8 inline-block">
        <Button variant="outline" className="h-14 gap-2 px-8 text-lg">
          <Home className="size-5" /> Back to home
        </Button>
      </Link>
    </div>
  )
}
