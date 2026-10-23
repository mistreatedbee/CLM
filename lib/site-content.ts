/**
 * Public website text, editable in Admin > Website content.
 * Stored as one JSON document in `clm_site_content`; anything missing
 * falls back to these defaults (the text the site shipped with).
 */

export interface SiteContent {
  announcement: { enabled: boolean; text: string; link_label: string; link_url: string }
  hero: {
    badge: string
    title_main: string
    title_accent: string
    tagline: string
    description: string
    button_label: string
    small_print: string
  }
  courses_section: { enabled: boolean; title: string; subtitle: string }
  why_join: { enabled: boolean; title: string; intro: string; items: { title: string; text: string }[] }
  contact: {
    footer_blurb: string
    phone: string
    email: string
    website: string
    address: string
    office_hours: string[]
  }
  apply: { help_phone: string; submitted_message: string; next_steps: string[] }
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcement: { enabled: false, text: '', link_label: '', link_url: '' },
  hero: {
    badge: 'Applications are open for 2026',
    title_main: 'Christian Leadership',
    title_accent: 'Movement',
    tagline: 'Transforming Leaders, Transforming the Nations',
    description:
      'Join a movement of Christ-centred leaders equipped to serve, disciple, and bring lasting change to every community in South Africa and beyond.',
    button_label: 'Start your application',
    small_print: 'Free to apply · Takes about 15 minutes · Saves automatically',
  },
  courses_section: {
    enabled: true,
    title: 'Online ministry courses',
    subtitle: 'Answer the call. Grow in purpose. Serve with excellence.',
  },
  why_join: {
    enabled: true,
    title: 'Why join the movement?',
    intro:
      'Whether you are just starting out or have served for years, CLM meets you where you are and helps you go further.',
    items: [
      { title: 'World-class training', text: 'Structured courses on servant leadership, discipleship, and pastoral care developed over decades of ministry.' },
      { title: 'A caring community', text: 'Join a family of believers across South Africa who support, pray for, and walk alongside one another.' },
      { title: 'Real impact', text: 'Lead outreach programmes that bring lasting change into homes, churches, and communities around you.' },
      { title: 'Grow spiritually', text: 'Deepen your walk with God through mentorship, accountability, and purposeful discipleship.' },
    ],
  },
  contact: {
    footer_blurb:
      'Transforming Leaders, Transforming the Nations. Raising servant leaders to impact every community for Christ.',
    phone: '073 204 7642',
    email: 'kenstraining04@gmail.com',
    website: 'https://www.christianleadershipmovement.co.za',
    address: 'House No. 1717, Dwarsloop Phase 2, South Africa',
    office_hours: ['Mon – Fri: 08:00 – 17:00', 'Sat: 09:00 – 13:00', 'Sun: Closed'],
  },
  apply: {
    help_phone: '073 204 7642',
    // The previous text claimed an email confirmation was sent; CLM doesn't send emails.
    submitted_message:
      'Thank you for applying to the Christian Leadership Movement. We have received your application.',
    next_steps: [
      'Our team reviews your application within 5 working days.',
      'We may contact your reference to confirm your details.',
      'We will contact you with the outcome and next steps.',
    ],
  },
}

function text(v: unknown, max: number, fallback: string): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

function bool(v: unknown, fallback: boolean) {
  return typeof v === 'boolean' ? v : fallback
}

function list(v: unknown, maxItems: number, maxLen: number, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback
  return v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems)
}

/** Only allow links to this site or to http(s)/tel/mailto addresses. */
export function safeLink(url: string): string {
  const u = url.trim()
  if (!u) return ''
  if (u.startsWith('/') && !u.startsWith('//')) return u
  if (/^(https?:\/\/|tel:|mailto:)/i.test(u)) return u
  return ''
}

export function normalizeSiteContent(input: unknown): SiteContent {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, any>
  const d = DEFAULT_SITE_CONTENT
  const a = raw.announcement ?? {}
  const h = raw.hero ?? {}
  const cs = raw.courses_section ?? {}
  const w = raw.why_join ?? {}
  const c = raw.contact ?? {}
  const ap = raw.apply ?? {}

  const items = Array.isArray(w.items)
    ? w.items
        .filter((i: any) => i && typeof i === 'object')
        .map((i: any) => ({ title: text(i.title, 120, '').trim(), text: text(i.text, 600, '').trim() }))
        .filter((i: { title: string }) => i.title)
        .slice(0, 8)
    : d.why_join.items

  return {
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: text(a.text, 300, d.announcement.text),
      link_label: text(a.link_label, 60, d.announcement.link_label),
      link_url: safeLink(text(a.link_url, 500, d.announcement.link_url)),
    },
    hero: {
      badge: text(h.badge, 120, d.hero.badge),
      title_main: text(h.title_main, 80, d.hero.title_main),
      title_accent: text(h.title_accent, 80, d.hero.title_accent),
      tagline: text(h.tagline, 200, d.hero.tagline),
      description: text(h.description, 1000, d.hero.description),
      button_label: text(h.button_label, 60, d.hero.button_label).trim() || d.hero.button_label,
      small_print: text(h.small_print, 200, d.hero.small_print),
    },
    courses_section: {
      enabled: bool(cs.enabled, d.courses_section.enabled),
      title: text(cs.title, 160, d.courses_section.title),
      subtitle: text(cs.subtitle, 400, d.courses_section.subtitle),
    },
    why_join: {
      enabled: bool(w.enabled, d.why_join.enabled),
      title: text(w.title, 160, d.why_join.title),
      intro: text(w.intro, 1000, d.why_join.intro),
      items,
    },
    contact: {
      footer_blurb: text(c.footer_blurb, 400, d.contact.footer_blurb),
      phone: text(c.phone, 40, d.contact.phone),
      email: text(c.email, 200, d.contact.email),
      website: safeLink(text(c.website, 300, d.contact.website)),
      address: text(c.address, 300, d.contact.address),
      office_hours: list(c.office_hours, 7, 80, d.contact.office_hours),
    },
    apply: {
      help_phone: text(ap.help_phone, 40, d.apply.help_phone),
      submitted_message: text(ap.submitted_message, 1000, d.apply.submitted_message).trim() || d.apply.submitted_message,
      next_steps: list(ap.next_steps, 8, 300, d.apply.next_steps),
    },
  }
}

export function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

/** "https://www.example.co.za/" → "example.co.za" */
export function displayUrl(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}
