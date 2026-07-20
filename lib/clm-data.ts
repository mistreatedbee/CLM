export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'info-requested'

export type TimelineEvent = {
  id: string
  label: string
  detail?: string
  date: string
  type: 'submitted' | 'approved' | 'rejected' | 'note' | 'email' | 'info'
}

export type Application = {
  id: string
  ref: string
  fullName: string
  gender: 'Male' | 'Female'
  maritalStatus: string
  idNumber: string
  phone: string
  email: string
  address: string
  country: string
  age: number
  // spiritual
  acceptedDate: string
  baptized: boolean
  attendsChurch: boolean
  churchName: string
  denomination: string
  pastorName: string
  servesMinistry: boolean
  ministryDetail?: string
  // leadership
  whyJoin: string
  leadershipExperience: string
  spiritualGifts: string
  growthAreas: string
  // vision
  calledToLead: boolean
  callingExplanation: string
  longTermVision: string
  // references
  referenceName: string
  referencePhone: string
  referenceRelationship: string
  signature: string
  signatureDate: string
  // meta
  status: ApplicationStatus
  submittedAt: string
  reviewer: string | null
  timeline: TimelineEvent[]
  notes: { id: string; author: string; text: string; date: string }[]
}

export type Member = {
  id: string
  memberId: string
  fullName: string
  church: string
  phone: string
  leadershipLevel: 'Trainee' | 'Deacon' | 'Elder' | 'Leader'
  attendance: number
  trainingComplete: number
  certificates: string[]
  joinedAt: string
}

export const applications: Application[] = [
  {
    id: 'a1',
    ref: 'CLM-2026-004821',
    fullName: 'Grace Mokoena',
    gender: 'Female',
    maritalStatus: 'Married',
    idNumber: '7203125****081',
    phone: '+27 82 445 1290',
    email: 'grace.mokoena@example.com',
    address: '14 Church Street, Polokwane',
    country: 'South Africa',
    age: 53,
    acceptedDate: '1998',
    baptized: true,
    attendsChurch: true,
    churchName: 'Grace Family Church',
    denomination: 'Pentecostal',
    pastorName: 'Pastor Samuel Nkosi',
    servesMinistry: true,
    ministryDetail: 'I lead the women’s prayer group and help with community outreach.',
    whyJoin:
      'I feel called to serve my community and grow as a leader who can guide young believers.',
    leadershipExperience: 'Led the women’s ministry for 8 years and coordinated food drives.',
    spiritualGifts: 'Teaching, encouragement, and hospitality.',
    growthAreas: 'Public speaking and mentoring at scale.',
    calledToLead: true,
    callingExplanation:
      'During a season of prayer I felt a clear conviction to shepherd others toward Christ.',
    longTermVision: 'To plant a discipleship school for women in rural areas.',
    referenceName: 'Pastor Samuel Nkosi',
    referencePhone: '+27 83 221 5567',
    referenceRelationship: 'Senior Pastor',
    signature: 'Grace Mokoena',
    signatureDate: '2026-07-14',
    status: 'pending',
    submittedAt: '2026-07-14T09:24:00Z',
    reviewer: null,
    timeline: [
      {
        id: 't1',
        label: 'Application submitted',
        date: '2026-07-14T09:24:00Z',
        type: 'submitted',
      },
      {
        id: 't2',
        label: 'Confirmation email sent',
        detail: 'Submission confirmation delivered to grace.mokoena@example.com',
        date: '2026-07-14T09:25:00Z',
        type: 'email',
      },
    ],
    notes: [],
  },
  {
    id: 'a2',
    ref: 'CLM-2026-004820',
    fullName: 'Thabo Sithole',
    gender: 'Male',
    maritalStatus: 'Single',
    idNumber: '9508145****082',
    phone: '+27 71 998 3321',
    email: 'thabo.sithole@example.com',
    address: '5 Mandela Avenue, Nelspruit',
    country: 'South Africa',
    age: 30,
    acceptedDate: '2015',
    baptized: true,
    attendsChurch: true,
    churchName: 'Living Word Assembly',
    denomination: 'Baptist',
    pastorName: 'Pastor Joyce Dlamini',
    servesMinistry: true,
    ministryDetail: 'I run the youth worship team.',
    whyJoin: 'To be equipped to disciple the next generation of young leaders.',
    leadershipExperience: 'Youth worship leader for 4 years.',
    spiritualGifts: 'Leadership, worship, and exhortation.',
    growthAreas: 'Administration and conflict resolution.',
    calledToLead: true,
    callingExplanation: 'I have consistently been placed in positions to guide my peers.',
    longTermVision: 'To lead a national youth revival movement.',
    referenceName: 'Pastor Joyce Dlamini',
    referencePhone: '+27 82 771 0098',
    referenceRelationship: 'Youth Pastor',
    signature: 'Thabo Sithole',
    signatureDate: '2026-07-13',
    status: 'approved',
    submittedAt: '2026-07-13T15:02:00Z',
    reviewer: 'Rev. Daniel Khumalo',
    timeline: [
      { id: 't1', label: 'Application submitted', date: '2026-07-13T15:02:00Z', type: 'submitted' },
      {
        id: 't2',
        label: 'Assigned to Rev. Daniel Khumalo',
        date: '2026-07-13T16:40:00Z',
        type: 'note',
      },
      {
        id: 't3',
        label: 'Application approved',
        detail: 'Strong references and clear calling.',
        date: '2026-07-15T11:10:00Z',
        type: 'approved',
      },
    ],
    notes: [
      {
        id: 'n1',
        author: 'Rev. Daniel Khumalo',
        text: 'Excellent candidate, references confirmed. Recommending fast-track.',
        date: '2026-07-15T10:55:00Z',
      },
    ],
  },
  {
    id: 'a3',
    ref: 'CLM-2026-004818',
    fullName: 'Naledi Dube',
    gender: 'Female',
    maritalStatus: 'Married',
    idNumber: '8811025****083',
    phone: '+27 60 553 2210',
    email: 'naledi.dube@example.com',
    address: '22 Hope Road, Durban',
    country: 'South Africa',
    age: 37,
    acceptedDate: '2009',
    baptized: true,
    attendsChurch: true,
    churchName: 'Cornerstone Chapel',
    denomination: 'Methodist',
    pastorName: 'Rev. Peter Zulu',
    servesMinistry: false,
    whyJoin: 'I want to start serving in a structured leadership programme.',
    leadershipExperience: 'Small group host for 2 years.',
    spiritualGifts: 'Mercy and giving.',
    growthAreas: 'Confidence in teaching.',
    calledToLead: false,
    callingExplanation: 'Still discerning, but open and willing to be trained.',
    longTermVision: 'To support church administration and pastoral care.',
    referenceName: 'Rev. Peter Zulu',
    referencePhone: '+27 84 112 8890',
    referenceRelationship: 'Pastor',
    signature: 'Naledi Dube',
    signatureDate: '2026-07-12',
    status: 'info-requested',
    submittedAt: '2026-07-12T08:15:00Z',
    reviewer: 'Sister Mary Botha',
    timeline: [
      { id: 't1', label: 'Application submitted', date: '2026-07-12T08:15:00Z', type: 'submitted' },
      {
        id: 't2',
        label: 'More information requested',
        detail: 'Requested an additional character reference.',
        date: '2026-07-13T09:30:00Z',
        type: 'info',
      },
    ],
    notes: [],
  },
  {
    id: 'a4',
    ref: 'CLM-2026-004815',
    fullName: 'Sipho Ndlovu',
    gender: 'Male',
    maritalStatus: 'Married',
    idNumber: '6605125****084',
    phone: '+27 79 004 7781',
    email: 'sipho.ndlovu@example.com',
    address: '9 Freedom Lane, Bloemfontein',
    country: 'South Africa',
    age: 59,
    acceptedDate: '1985',
    baptized: true,
    attendsChurch: true,
    churchName: 'Mount Zion Ministries',
    denomination: 'Apostolic',
    pastorName: 'Apostle John Mahlangu',
    servesMinistry: true,
    ministryDetail: 'Church elder and men’s fellowship coordinator.',
    whyJoin: 'To formalise decades of ministry with recognised leadership training.',
    leadershipExperience: 'Elder for 15 years.',
    spiritualGifts: 'Wisdom, leadership, and shepherding.',
    growthAreas: 'Digital tools and modern outreach.',
    calledToLead: true,
    callingExplanation: 'A lifelong calling confirmed by many years of faithful service.',
    longTermVision: 'To mentor young pastors across the province.',
    referenceName: 'Apostle John Mahlangu',
    referencePhone: '+27 82 665 1122',
    referenceRelationship: 'Presiding Apostle',
    signature: 'Sipho Ndlovu',
    signatureDate: '2026-07-10',
    status: 'rejected',
    submittedAt: '2026-07-10T13:47:00Z',
    reviewer: 'Rev. Daniel Khumalo',
    timeline: [
      { id: 't1', label: 'Application submitted', date: '2026-07-10T13:47:00Z', type: 'submitted' },
      {
        id: 't2',
        label: 'Application declined',
        detail: 'Referred to regional programme instead.',
        date: '2026-07-11T14:20:00Z',
        type: 'rejected',
      },
    ],
    notes: [],
  },
  {
    id: 'a5',
    ref: 'CLM-2026-004812',
    fullName: 'Lerato Phiri',
    gender: 'Female',
    maritalStatus: 'Single',
    idNumber: '0001125****085',
    phone: '+27 63 887 2231',
    email: 'lerato.phiri@example.com',
    address: '3 Unity Street, Pretoria',
    country: 'South Africa',
    age: 25,
    acceptedDate: '2019',
    baptized: false,
    attendsChurch: true,
    churchName: 'New Life Centre',
    denomination: 'Charismatic',
    pastorName: 'Pastor Grace Molefe',
    servesMinistry: true,
    ministryDetail: 'Children’s ministry volunteer.',
    whyJoin: 'To deepen my faith and learn how to lead with excellence.',
    leadershipExperience: 'Volunteer coordinator for kids’ church.',
    spiritualGifts: 'Teaching and helps.',
    growthAreas: 'Theology foundations.',
    calledToLead: true,
    callingExplanation: 'I love guiding children and want to grow into broader leadership.',
    longTermVision: 'To build a children’s discipleship curriculum.',
    referenceName: 'Pastor Grace Molefe',
    referencePhone: '+27 81 220 9987',
    referenceRelationship: 'Pastor',
    signature: 'Lerato Phiri',
    signatureDate: '2026-07-16',
    status: 'pending',
    submittedAt: '2026-07-16T07:05:00Z',
    reviewer: null,
    timeline: [
      { id: 't1', label: 'Application submitted', date: '2026-07-16T07:05:00Z', type: 'submitted' },
    ],
    notes: [],
  },
]

export const members: Member[] = [
  {
    id: 'm1',
    memberId: 'CLM-2026-000001',
    fullName: 'Thabo Sithole',
    church: 'Living Word Assembly',
    phone: '+27 71 998 3321',
    leadershipLevel: 'Trainee',
    attendance: 92,
    trainingComplete: 40,
    certificates: ['Foundations of Faith'],
    joinedAt: '2026-07-15',
  },
  {
    id: 'm2',
    memberId: 'CLM-2026-000002',
    fullName: 'Miriam Adeyemi',
    church: 'Grace Family Church',
    phone: '+27 82 331 0091',
    leadershipLevel: 'Deacon',
    attendance: 88,
    trainingComplete: 75,
    certificates: ['Foundations of Faith', 'Servant Leadership'],
    joinedAt: '2026-05-02',
  },
  {
    id: 'm3',
    memberId: 'CLM-2026-000003',
    fullName: 'Emmanuel Okafor',
    church: 'Cornerstone Chapel',
    phone: '+27 60 774 2213',
    leadershipLevel: 'Elder',
    attendance: 96,
    trainingComplete: 100,
    certificates: ['Foundations of Faith', 'Servant Leadership', 'Pastoral Care'],
    joinedAt: '2025-11-18',
  },
  {
    id: 'm4',
    memberId: 'CLM-2026-000004',
    fullName: 'Rebecca Ntuli',
    church: 'New Life Centre',
    phone: '+27 63 001 8892',
    leadershipLevel: 'Leader',
    attendance: 99,
    trainingComplete: 100,
    certificates: [
      'Foundations of Faith',
      'Servant Leadership',
      'Pastoral Care',
      'Church Planting',
    ],
    joinedAt: '2025-08-09',
  },
]

export const stats = {
  pending: 34,
  approved: 128,
  rejected: 12,
  today: 7,
  totalMembers: 486,
}

export const applicationsByMonth = [
  { month: 'Jan', applications: 24, approved: 18 },
  { month: 'Feb', applications: 31, approved: 22 },
  { month: 'Mar', applications: 42, approved: 30 },
  { month: 'Apr', applications: 38, approved: 27 },
  { month: 'May', applications: 55, approved: 41 },
  { month: 'Jun', applications: 61, approved: 48 },
  { month: 'Jul', applications: 49, approved: 34 },
]

export const churchDistribution = [
  { name: 'Grace Family Church', value: 96 },
  { name: 'Living Word Assembly', value: 74 },
  { name: 'Cornerstone Chapel', value: 63 },
  { name: 'New Life Centre', value: 58 },
  { name: 'Mount Zion Ministries', value: 41 },
]

export const ageDistribution = [
  { range: '18-25', value: 84 },
  { range: '26-35', value: 142 },
  { range: '36-45', value: 118 },
  { range: '46-59', value: 96 },
  { range: '60+', value: 46 },
]

export const genderDistribution = [
  { name: 'Female', value: 268 },
  { name: 'Male', value: 218 },
]

export const recentActivity = [
  {
    id: 'r1',
    name: 'Lerato Phiri',
    action: 'submitted a new application',
    time: '12 minutes ago',
    type: 'submitted' as const,
  },
  {
    id: 'r2',
    name: 'Thabo Sithole',
    action: 'was approved by Rev. Daniel Khumalo',
    time: '1 hour ago',
    type: 'approved' as const,
  },
  {
    id: 'r3',
    name: 'Naledi Dube',
    action: 'was asked for more information',
    time: '3 hours ago',
    type: 'info' as const,
  },
  {
    id: 'r4',
    name: 'System',
    action: 'sent 4 reminder emails to pending applicants',
    time: 'Yesterday',
    type: 'email' as const,
  },
  {
    id: 'r5',
    name: 'Sipho Ndlovu',
    action: 'application was declined',
    time: 'Yesterday',
    type: 'rejected' as const,
  },
]

export function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'info-requested':
      return 'Info Requested'
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
