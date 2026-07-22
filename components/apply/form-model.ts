export const COURSES: { group: string; options: string[] }[] = [
  {
    group: 'UP-Endorsed Courses',
    options: [
      'Pastoral Care Training (Narrative Community-Based)',
      'Starting and Sustaining Community Projects',
      'Crisis and Trauma Support',
      'Early Childhood Development',
      'Peace Building',
      'From Victims to Agents',
      'Narrative Group Counselling (offered by Prof Roelf Schoeman – Centre for Faith and Community)',
    ],
  },
  {
    group: 'Other Courses',
    options: [
      'Moderator (SAQA US 117759)',
      'Assessor (SAQA US 115753)',
      'Facilitator (SAQA US 117871)',
      'Narrative Group Counselling (offered by Apostle Kenny Mokgope)',
      'Praise and Worship Programme',
      'Diploma in Theology',
      'Ordination',
    ],
  },
]

export type ApplicationForm = {
  // Personal
  course: string
  fullName: string
  idNumber: string
  gender: string
  maritalStatus: string
  whatsapp: string
  phone: string
  address: string
  country: string
  // Spiritual
  acceptedDate: string
  baptized: boolean | null
  attendsChurch: boolean | null
  churchName: string
  denomination: string
  pastorName: string
  servesMinistry: boolean | null
  ministryDetail: string
  // Leadership
  whyJoin: string
  leadershipExperience: string
  spiritualGifts: string
  growthAreas: string
  // Vision
  calledToLead: boolean | null
  callingExplanation: string
  longTermVision: string
  // References
  referenceName: string
  referencePhone: string
  referenceRelationship: string
  signature: string
  signatureDate: string
}

export const emptyForm: ApplicationForm = {
  course: '',
  fullName: '',
  idNumber: '',
  gender: '',
  maritalStatus: '',
  whatsapp: '',
  phone: '',
  address: '',
  country: 'South Africa',
  acceptedDate: '',
  baptized: null,
  attendsChurch: null,
  churchName: '',
  denomination: '',
  pastorName: '',
  servesMinistry: null,
  ministryDetail: '',
  whyJoin: '',
  leadershipExperience: '',
  spiritualGifts: '',
  growthAreas: '',
  calledToLead: null,
  callingExplanation: '',
  longTermVision: '',
  referenceName: '',
  referencePhone: '',
  referenceRelationship: '',
  signature: '',
  signatureDate: '',
}

export type Errors = Partial<Record<keyof ApplicationForm, string>>

export const STEP_KEYS = [
  'personal',
  'spiritual',
  'leadership',
  'vision',
  'references',
  'review',
] as const

export type StepKey = (typeof STEP_KEYS)[number]

export const STEP_META: Record<StepKey, { title: string; short: string }> = {
  personal: { title: 'Personal Information', short: 'About you' },
  spiritual: { title: 'Spiritual Background', short: 'Your faith' },
  leadership: { title: 'Leadership', short: 'Leadership' },
  vision: { title: 'Vision & Calling', short: 'Your vision' },
  references: { title: 'References & Signature', short: 'References' },
  review: { title: 'Review & Submit', short: 'Review' },
}

export function validateStep(step: StepKey, f: ApplicationForm): Errors {
  const e: Errors = {}
  const req = (k: keyof ApplicationForm, msg = 'This field is required') => {
    if (!String(f[k] ?? '').trim()) e[k] = msg
  }

  if (step === 'personal') {
    if (!f.course) e.course = 'Please select a course'
    req('fullName', 'Please enter your full name')
    if (!f.idNumber.trim()) e.idNumber = 'Please enter your ID number'
    else if (f.idNumber.replace(/\s/g, '').length < 6)
      e.idNumber = 'Please enter a valid ID number'
    if (!f.gender) e.gender = 'Please choose an option'
    if (!f.maritalStatus) e.maritalStatus = 'Please choose an option'
    if (!f.whatsapp.trim()) e.whatsapp = 'Please enter your WhatsApp number'
    else if (f.whatsapp.replace(/\D/g, '').length < 9) e.whatsapp = 'Please enter a valid WhatsApp number'
    if (!f.phone.trim()) e.phone = 'Please enter your phone / home number'
    else if (f.phone.replace(/\D/g, '').length < 9) e.phone = 'Please enter a valid phone number'
    req('address', 'Please enter your address')
    req('country', 'Please enter your country')
  }

  if (step === 'spiritual') {
    req('acceptedDate', 'Please share when you accepted Jesus')
    if (f.baptized === null) e.baptized = 'Please choose Yes or No'
    if (f.attendsChurch === null) e.attendsChurch = 'Please choose Yes or No'
    req('churchName', 'Please enter your church name')
    req('denomination', 'Please enter your denomination')
    req('pastorName', 'Please enter your pastor’s name')
    if (f.servesMinistry === null) e.servesMinistry = 'Please choose Yes or No'
    if (f.servesMinistry && !f.ministryDetail.trim())
      e.ministryDetail = 'Please tell us how you serve'
  }

  if (step === 'leadership') {
    req('whyJoin', 'Please tell us why you want to join')
    req('leadershipExperience', 'Please share your experience')
    req('spiritualGifts', 'Please share your gifts')
    req('growthAreas', 'Please share your areas of growth')
  }

  if (step === 'vision') {
    if (f.calledToLead === null) e.calledToLead = 'Please choose Yes or No'
    req('callingExplanation', 'Please explain your answer')
    req('longTermVision', 'Please share your long-term vision')
  }

  if (step === 'references') {
    req('referenceName', 'Please enter a reference name')
    if (!f.referencePhone.trim()) e.referencePhone = 'Please enter a phone number'
    else if (f.referencePhone.replace(/\D/g, '').length < 9)
      e.referencePhone = 'Please enter a valid phone number'
    req('referenceRelationship', 'Please describe the relationship')
    req('signature', 'Please type your full name to sign')
    req('signatureDate', 'Please enter the date')
  }

  return e
}
