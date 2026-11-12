/**
 * Admin-editable CLM application form.
 *
 * Stored in `clm_form_config` (draft + published). Admins can relabel,
 * reorder, show/hide and require/optional questions, change dropdown
 * options, add their own questions, set an open/close window and edit
 * the welcome text. "Core" questions map onto the existing columns of
 * `clm_applications`; their type and column are fixed here. A few are
 * locked (always shown and required) because the system depends on them.
 * Custom questions are stored in `clm_applications.custom_answers`.
 *
 * Shared by the public form (client), the submit action (server-side
 * validation) and the admin form editor.
 */

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'radio' | 'yesno'

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email', label: 'Email address' },
  { value: 'tel', label: 'Phone number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple choice' },
  { value: 'yesno', label: 'Yes / No' },
]

export interface FieldConfig {
  key: string
  type: FieldType
  label: string
  helper: string
  placeholder: string
  required: boolean
  enabled: boolean
  options: string[]
}

export type StepKey = 'personal' | 'spiritual' | 'leadership' | 'vision' | 'references'

export interface StepConfig {
  key: StepKey
  title: string
  short: string
  intro: string
  enabled: boolean
  fields: FieldConfig[]
}

export interface FormConfig {
  version: 1
  settings: { applications_open: boolean; opens_at: string | null; closes_at: string | null; closed_message: string }
  welcome: { title: string; intro: string }
  course_step: { title: string; intro: string }
  steps: StepConfig[]
}

export type Answers = Record<string, string | boolean | null>

// ── Core questions ──────────────────────────────────────────────

interface CoreFieldDef {
  step: StepKey
  type: FieldType
  column: string
  /** Always shown and required. */
  locked?: boolean
  /** Options can't be changed (database only accepts these values). */
  fixedOptions?: string[]
  showIf?: { key: string; equals: string | boolean }
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  autoComplete?: string
  maxLength?: number
  format?: 'id_number'
}

export const CORE_FIELDS: Record<string, CoreFieldDef> = {
  fullName:      { step: 'personal', type: 'text', column: 'full_name', locked: true, autoComplete: 'name', maxLength: 200 },
  idNumber:      { step: 'personal', type: 'text', column: 'id_number', locked: true, inputMode: 'numeric', maxLength: 30, format: 'id_number' },
  gender:        { step: 'personal', type: 'radio', column: 'gender', fixedOptions: ['Male', 'Female'] },
  maritalStatus: { step: 'personal', type: 'select', column: 'marital_status' },
  whatsapp:      { step: 'personal', type: 'tel', column: 'whatsapp', inputMode: 'tel', autoComplete: 'tel' },
  phone:         { step: 'personal', type: 'tel', column: 'phone', locked: true, inputMode: 'tel', autoComplete: 'tel' },
  address:       { step: 'personal', type: 'textarea', column: 'physical_address', maxLength: 500 },
  country:       { step: 'personal', type: 'text', column: 'country', autoComplete: 'country-name', maxLength: 100 },

  acceptedDate:   { step: 'spiritual', type: 'text', column: 'accepted_christ_date', maxLength: 200 },
  baptized:       { step: 'spiritual', type: 'yesno', column: 'baptized' },
  attendsChurch:  { step: 'spiritual', type: 'yesno', column: 'attends_church' },
  churchName:     { step: 'spiritual', type: 'text', column: 'church_name', locked: true, maxLength: 200 },
  denomination:   { step: 'spiritual', type: 'text', column: 'church_denomination', maxLength: 200 },
  pastorName:     { step: 'spiritual', type: 'text', column: 'pastor_name', maxLength: 200 },
  servesMinistry: { step: 'spiritual', type: 'yesno', column: 'serves_ministry' },
  ministryDetail: { step: 'spiritual', type: 'textarea', column: 'ministry_detail', maxLength: 3000, showIf: { key: 'servesMinistry', equals: true } },

  whyJoin:              { step: 'leadership', type: 'textarea', column: 'reason_joining', maxLength: 10000 },
  leadershipExperience: { step: 'leadership', type: 'textarea', column: 'leadership_experience', maxLength: 10000 },
  spiritualGifts:       { step: 'leadership', type: 'textarea', column: 'spiritual_gifts', maxLength: 10000 },
  growthAreas:          { step: 'leadership', type: 'textarea', column: 'growth_areas', maxLength: 10000 },

  calledToLead:       { step: 'vision', type: 'yesno', column: 'called_to_leadership' },
  callingExplanation: { step: 'vision', type: 'textarea', column: 'leadership_vision_explanation', maxLength: 10000 },
  longTermVision:     { step: 'vision', type: 'textarea', column: 'long_term_vision', maxLength: 10000 },

  referenceName:         { step: 'references', type: 'text', column: 'reference_name', maxLength: 200 },
  referencePhone:        { step: 'references', type: 'tel', column: 'reference_phone', inputMode: 'tel' },
  referenceRelationship: { step: 'references', type: 'text', column: 'reference_relationship', maxLength: 200 },
  signature:             { step: 'references', type: 'text', column: 'signature', locked: true, maxLength: 200 },
  signatureDate:         { step: 'references', type: 'date', column: 'signature_date', locked: true },
}

export const STEP_ORDER: StepKey[] = ['personal', 'spiritual', 'leadership', 'vision', 'references']
/** Steps holding locked questions can't be switched off. */
export const REQUIRED_STEPS: StepKey[] = ['personal', 'spiritual', 'references']

function f(key: string, label: string, opts: Partial<FieldConfig> = {}): FieldConfig {
  return {
    key, type: CORE_FIELDS[key]?.type ?? 'text', label, helper: '', placeholder: '',
    required: true, enabled: true, options: CORE_FIELDS[key]?.fixedOptions ?? [], ...opts,
  }
}

/** The form exactly as it was before it became editable. */
export const DEFAULT_FORM_CONFIG: FormConfig = {
  version: 1,
  settings: {
    applications_open: true,
    opens_at: null,
    closes_at: null,
    closed_message: 'Applications are currently closed. Please check back later or contact us for help.',
  },
  welcome: {
    title: 'Welcome! Let’s begin your application',
    intro: 'We will ask a few simple questions about you and your faith. Take your time, there is no rush.',
  },
  course_step: {
    title: 'Choose a course',
    intro: 'You can apply for one of our courses, or apply for membership of the movement only.',
  },
  steps: [
    {
      key: 'personal', title: 'Personal Information', short: 'About you', intro: '', enabled: true,
      fields: [
        f('fullName', 'Full name', { helper: 'Enter your name exactly as it appears on your ID.', placeholder: 'Grace Mokoena' }),
        f('idNumber', 'ID number', { helper: 'Your national identity number.', placeholder: '7203125081081' }),
        f('gender', 'Gender'),
        f('maritalStatus', 'Marital status', { options: ['Single', 'Married', 'Widowed', 'Divorced'] }),
        f('whatsapp', 'WhatsApp number', { helper: 'We will contact you via WhatsApp.', placeholder: '082 445 1290' }),
        f('phone', 'Phone / Home number', { helper: 'Your landline or alternative contact number.', placeholder: '015 295 3300' }),
        f('address', 'Physical address', { helper: 'Where do you live? Include your town or city.', placeholder: '14 Church Street, Polokwane' }),
        f('country', 'Country', { placeholder: 'South Africa' }),
      ],
    },
    {
      key: 'spiritual', title: 'Spiritual Background', short: 'Your faith', intro: '', enabled: true,
      fields: [
        f('acceptedDate', 'When did you accept Jesus?', { helper: 'A year or a season is fine.', placeholder: '1998 or Easter 2010' }),
        f('baptized', 'Have you been baptized?'),
        f('attendsChurch', 'Do you attend church?'),
        f('churchName', 'Church name', { placeholder: 'Grace Family Church' }),
        f('denomination', 'Denomination', { placeholder: 'Pentecostal, Baptist, Methodist...' }),
        f('pastorName', 'Pastor’s name', { placeholder: 'Pastor Samuel Nkosi' }),
        f('servesMinistry', 'Do you serve in a ministry?'),
        f('ministryDetail', 'Tell us how you serve', { helper: 'Which ministry and what do you do?', placeholder: 'I lead the women’s prayer group and help with outreach.' }),
      ],
    },
    {
      key: 'leadership', title: 'Leadership', short: 'Leadership', intro: '', enabled: true,
      fields: [
        f('whyJoin', 'Why do you want to join CLM?', { helper: 'Share what is on your heart. There are no wrong answers.' }),
        f('leadershipExperience', 'Your leadership experience', { helper: 'Any way you have led or served others.' }),
        f('spiritualGifts', 'Your spiritual gifts', { helper: 'What are you naturally good at in serving God?' }),
        f('growthAreas', 'Areas you want to grow in', { helper: 'What would you like to become better at?' }),
      ],
    },
    {
      key: 'vision', title: 'Vision & Calling', short: 'Your vision', intro: '', enabled: true,
      fields: [
        f('calledToLead', 'Do you believe God has called you into leadership?'),
        f('callingExplanation', 'Please explain your answer', { helper: 'Tell us a little about why you chose that answer.' }),
        f('longTermVision', 'What is your long-term vision?', { helper: 'Where do you hope to be serving in the future?' }),
      ],
    },
    {
      key: 'references', title: 'References & Signature', short: 'References', intro: '', enabled: true,
      fields: [
        f('referenceName', 'Church leader’s name', { helper: 'Someone who knows you well and can vouch for you.', placeholder: 'Pastor Samuel Nkosi' }),
        f('referencePhone', 'Their phone number', { placeholder: '083 221 5567' }),
        f('referenceRelationship', 'Your relationship to them', { placeholder: 'Senior Pastor, Mentor, Elder...' }),
        f('signature', 'Digital signature', { helper: 'Type your full name to sign this application.', placeholder: 'Grace Mokoena' }),
        f('signatureDate', 'Date'),
      ],
    },
  ],
}

// ── Normalisation ───────────────────────────────────────────────

const CUSTOM_KEY = /^custom_[a-z0-9_]{1,40}$/

function str(v: unknown, max: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}
function bool(v: unknown, fallback: boolean) {
  return typeof v === 'boolean' ? v : fallback
}
function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
function stringList(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    if (typeof item !== 'string') continue
    const s = item.trim().slice(0, maxLen)
    if (s && !out.includes(s)) out.push(s)
    if (out.length >= maxItems) break
  }
  return out
}

function normalizeField(raw: Record<string, unknown>, fallback: FieldConfig | undefined): FieldConfig | null {
  const key = typeof raw.key === 'string' ? raw.key : ''
  const core = CORE_FIELDS[key]
  if (!core && !CUSTOM_KEY.test(key)) return null
  const type: FieldType = core ? core.type : FIELD_TYPES.some((t) => t.value === raw.type) ? (raw.type as FieldType) : 'text'
  const field: FieldConfig = {
    key,
    type,
    label: str(raw.label, 300).trim() || fallback?.label || key,
    helper: str(raw.helper, 1000, fallback?.helper ?? ''),
    placeholder: str(raw.placeholder, 200, fallback?.placeholder ?? ''),
    required: bool(raw.required, fallback?.required ?? false),
    enabled: bool(raw.enabled, fallback?.enabled ?? true),
    options: type === 'select' || type === 'radio' ? stringList(raw.options, 100, 200) : [],
  }
  if ((type === 'select' || type === 'radio') && field.options.length === 0) field.options = fallback?.options ?? []
  if (core?.fixedOptions) field.options = core.fixedOptions
  if (core?.locked) { field.required = true; field.enabled = true }
  return field
}

export function normalizeConfig(input: unknown): FormConfig {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, any>
  const d = DEFAULT_FORM_CONFIG
  const rawSteps: Record<string, any>[] = Array.isArray(raw.steps) ? raw.steps : []
  const seen = new Set<string>()

  const steps: StepConfig[] = STEP_ORDER.map((stepKey) => {
    const def = d.steps.find((s) => s.key === stepKey)!
    const rs = rawSteps.find((s) => s && s.key === stepKey) ?? {}
    const rawFields: Record<string, unknown>[] = Array.isArray(rs.fields) ? rs.fields : def.fields
    const fields: FieldConfig[] = []
    for (const rf of rawFields) {
      if (!rf || typeof rf !== 'object') continue
      const key = (rf as { key?: unknown }).key
      if (typeof key !== 'string' || seen.has(key)) continue
      const core = CORE_FIELDS[key]
      if (core && core.step !== stepKey) continue
      const field = normalizeField(rf, def.fields.find((x) => x.key === key))
      if (!field) continue
      seen.add(key)
      fields.push(field)
    }
    for (const df of def.fields) {
      if (!seen.has(df.key)) { seen.add(df.key); fields.push({ ...df }) }
    }
    return {
      key: stepKey,
      title: str(rs.title, 120).trim() || def.title,
      short: str(rs.short, 40).trim() || def.short,
      intro: str(rs.intro, 1000, def.intro),
      enabled: REQUIRED_STEPS.includes(stepKey) ? true : bool(rs.enabled, def.enabled),
      fields,
    }
  })

  const s = raw.settings ?? {}
  const opens = isoOrNull(s.opens_at)
  const closes = isoOrNull(s.closes_at)
  return {
    version: 1,
    settings: {
      applications_open: bool(s.applications_open, d.settings.applications_open),
      opens_at: opens,
      closes_at: closes && opens && closes <= opens ? null : closes,
      closed_message: str(s.closed_message, 1000).trim() || d.settings.closed_message,
    },
    welcome: {
      title: str(raw.welcome?.title, 200).trim() || d.welcome.title,
      intro: str(raw.welcome?.intro, 1000, d.welcome.intro),
    },
    course_step: {
      title: str(raw.course_step?.title, 120).trim() || d.course_step.title,
      intro: str(raw.course_step?.intro, 1000, d.course_step.intro),
    },
    steps,
  }
}

export function applicationsOpen(config: FormConfig, now = new Date()) {
  const s = config.settings
  if (!s.applications_open) return false
  if (s.opens_at && new Date(s.opens_at) > now) return false
  if (s.closes_at && new Date(s.closes_at) <= now) return false
  return true
}

// ── Validation ──────────────────────────────────────────────────

export function enabledSteps(config: FormConfig) {
  return config.steps.filter((s) => s.enabled)
}

export function isFieldVisible(field: FieldConfig, answers: Answers) {
  if (!field.enabled) return false
  const cond = CORE_FIELDS[field.key]?.showIf
  return !cond || answers[cond.key] === cond.equals
}

export function fieldMaxLength(field: FieldConfig) {
  return CORE_FIELDS[field.key]?.maxLength ?? (field.type === 'textarea' ? 5000 : 300)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function empty(v: unknown) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

export function validateField(field: FieldConfig, value: unknown): string | undefined {
  if (empty(value)) {
    if (!field.required) return undefined
    if (field.type === 'yesno') return 'Please choose Yes or No'
    if (field.type === 'select' || field.type === 'radio') return 'Please choose an option'
    return 'This field is required'
  }
  if (field.type === 'yesno') return typeof value === 'boolean' ? undefined : 'Please choose Yes or No'
  if (typeof value !== 'string') return 'Please enter a valid answer'
  const v = value.trim()
  if (v.length > fieldMaxLength(field)) return `Please keep this under ${fieldMaxLength(field)} characters`
  if ((field.type === 'select' || field.type === 'radio') && !field.options.includes(v)) return 'Please choose one of the options'
  if (field.type === 'tel') {
    const digits = v.replace(/\D/g, '')
    if (digits.length < 9 || digits.length > 15) return 'Please enter a valid phone number'
  }
  if (field.type === 'email' && !EMAIL_RE.test(v)) return 'Please enter a valid email address'
  if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(new Date(v).getTime()))) return 'Please enter a valid date'
  if (CORE_FIELDS[field.key]?.format === 'id_number' && v.replace(/\s/g, '').length < 6) return 'Please enter a valid ID number'
  return undefined
}

export type Errors = Record<string, string | undefined>

export function validateStep(step: StepConfig, answers: Answers): Errors {
  const errors: Errors = {}
  for (const field of step.fields) {
    if (!isFieldVisible(field, answers)) continue
    const err = validateField(field, answers[field.key])
    if (err) errors[field.key] = err
  }
  return errors
}

export function validateAll(config: FormConfig, answers: Answers): Errors {
  const errors: Errors = {}
  for (const step of enabledSteps(config)) Object.assign(errors, validateStep(step, answers))
  return errors
}

// ── Mapping to the database ─────────────────────────────────────

/** Column values for `clm_applications` plus custom answers. Hidden questions are stored as null. */
export function answersToRow(config: FormConfig, answers: Answers) {
  const row: Record<string, string | boolean | null> = {}
  const custom: Record<string, string | boolean | null> = {}
  for (const def of Object.values(CORE_FIELDS)) row[def.column] = null
  for (const step of enabledSteps(config)) {
    for (const field of step.fields) {
      if (!isFieldVisible(field, answers)) continue
      const raw = answers[field.key]
      const value = typeof raw === 'string' ? raw.trim() || null : raw ?? null
      const core = CORE_FIELDS[field.key]
      if (core) row[core.column] = value
      else custom[field.key] = value
    }
  }
  return { row, custom }
}

export function makeCustomKey(label: string, existing: string[]) {
  const base = 'custom_' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) || 'question')
  let key = base
  let i = 2
  while (existing.includes(key)) key = `${base}_${i++}`
  return key
}

/** Labels for every question, for showing stored answers. */
export function fieldLabels(config: FormConfig) {
  const out: Record<string, string> = {}
  for (const step of config.steps) for (const field of step.fields) out[field.key] = field.label
  return out
}
