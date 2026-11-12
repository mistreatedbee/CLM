'use client'

import { CORE_FIELDS, fieldMaxLength, type FieldConfig } from '@/lib/form-config'
import { RadioCards, SelectField, TextArea, TextField, YesNo } from './form-fields'

/** Renders any configured question with the existing form controls. */
export function FieldRenderer({
  field, value, onChange, error,
}: {
  field: FieldConfig
  value: string | boolean | null
  onChange: (v: string | boolean | null) => void
  error?: string
}) {
  const core = CORE_FIELDS[field.key]
  const text = typeof value === 'string' ? value : ''
  const common = { label: field.label, helper: field.helper || undefined, error, required: field.required }

  switch (field.type) {
    case 'textarea':
      return <TextArea id={field.key} {...common} example={field.placeholder || undefined} rows={core?.maxLength && core.maxLength > 3000 ? 5 : 3} value={text} onChange={onChange} />
    case 'select':
      return <SelectField id={field.key} {...common} value={text} onChange={onChange} options={field.options} />
    case 'radio':
      return <RadioCards {...common} value={text} onChange={onChange} options={field.options} />
    case 'yesno':
      return <YesNo {...common} value={typeof value === 'boolean' ? value : null} onChange={onChange} />
    default:
      return (
        <>
          <TextField
            id={field.key}
            {...common}
            example={field.placeholder || undefined}
            type={field.type}
            inputMode={core?.inputMode ?? (field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : undefined)}
            autoComplete={core?.autoComplete}
            value={text}
            onChange={(v) => onChange(v.slice(0, fieldMaxLength(field)))}
          />
          {field.key === 'signature' && text && (
            <p className="-mt-4 font-[cursive] text-3xl text-primary" aria-hidden="true">{text}</p>
          )}
        </>
      )
  }
}
