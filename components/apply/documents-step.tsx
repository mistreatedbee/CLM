'use client'

import { AlertCircle, FileText, Loader2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Errors, FormConfig, UploadedDoc } from '@/lib/form-config'
import { YesNo } from './form-fields'

export function DocumentsStep({
  config, docs, uploading, uploadError, errors, declaration, onDeclaration, onUpload, onRemove,
}: {
  config: FormConfig
  docs: UploadedDoc[]
  uploading: string | null
  uploadError: string | null
  errors: Errors
  declaration: boolean | null
  onDeclaration: (v: boolean) => void
  onUpload: (type: string, file: File) => void
  onRemove: (doc: UploadedDoc) => void
}) {
  const requested = config.documents.filter((d) => d.enabled)
  return (
    <div className="flex flex-col gap-7">
      {requested.length > 0 && (
        <div className="flex flex-col gap-4">
          {config.documents_intro && <p className="text-lg text-muted-foreground">{config.documents_intro}</p>}
          {uploadError && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-base font-medium text-destructive">
              <AlertCircle className="size-5 shrink-0" /> {uploadError}
            </p>
          )}
          {requested.map((req) => {
            const uploaded = docs.find((d) => d.type === req.type)
            const busy = uploading === req.type
            const err = errors[`doc_${req.type}`]
            return (
              <div key={req.type} className={cn('rounded-2xl border-2 p-5', err ? 'border-destructive' : 'border-border')}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {req.label}{req.required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
                    </p>
                    {req.hint && <p className="text-base text-muted-foreground">{req.hint}</p>}
                    {err && <p role="alert" className="mt-1 text-base font-medium text-destructive">{err}</p>}
                  </div>
                  {uploaded ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-base font-medium text-success">
                        <FileText className="size-4" /> {uploaded.name}
                      </span>
                      <button type="button" onClick={() => onRemove(uploaded)} aria-label={`Remove ${uploaded.name}`}
                        className="rounded p-1 text-muted-foreground hover:text-destructive">
                        <X className="size-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" disabled={busy}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(req.type, f); e.target.value = '' }} />
                      <span className={cn('flex h-12 items-center gap-2 rounded-xl border-2 border-dashed border-primary/40 px-4 text-base font-semibold text-primary hover:bg-primary/5', busy && 'opacity-50')}>
                        {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                        {busy ? 'Uploading…' : 'Choose file'}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {config.declaration.enabled && (
        <div className="rounded-2xl border-2 border-dashed border-input bg-muted/40 p-6">
          <p className="font-heading text-xl font-bold text-foreground">Declaration</p>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{config.declaration.text}</p>
          <div className="mt-4">
            <YesNo label={config.declaration.accept_label} value={declaration} onChange={onDeclaration} error={errors.declaration} required />
          </div>
        </div>
      )}
    </div>
  )
}
