import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'terra'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-nude-600 text-white hover:bg-nude-700 shadow-soft',
  secondary: 'bg-white text-nude-600 border border-nude-300 hover:bg-nude-50',
  ghost: 'bg-transparent text-nude-600 hover:bg-nude-200/60',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  terra: 'bg-terracotta text-white hover:brightness-95 shadow-soft'
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-nude-500">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-nude-400">{hint}</span> : null}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-nude-300 bg-white px-3.5 py-2.5 text-sm text-nude-800 placeholder:text-nude-400 outline-none transition focus:border-nude-500 focus:ring-2 focus:ring-nude-300/60'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-[90px] resize-y ${props.className ?? ''}`} />
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-nude-200 bg-white/80 p-4 shadow-card sm:p-5 ${className}`}>{children}</div>
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-nude-900/40 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-nude-50 shadow-soft sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-nude-200 px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-nude-700">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-nude-500 transition hover:bg-nude-200"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-nude-200 bg-white/70 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  )
}

export function Badge({
  tone = 'neutral',
  children
}: {
  tone?: 'good' | 'ok' | 'warn' | 'bad' | 'neutral'
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ok: 'bg-lime-50 text-lime-700 border-lime-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    bad: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-nude-100 text-nude-600 border-nude-200'
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Toast({ message, tone = 'neutral' }: { message: string; tone?: 'neutral' | 'good' | 'bad' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-nude-800 text-white',
    good: 'bg-emerald-600 text-white',
    bad: 'bg-red-600 text-white'
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium shadow-soft ${tones[tone]}`}>
        {message}
      </div>
    </div>
  )
}
