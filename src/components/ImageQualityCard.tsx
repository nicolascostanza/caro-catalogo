import { useState } from 'react'
import type { ImageQuality } from '../types'
import { qualityLabel } from '../lib/imageQuality'
import { buildImprovementPrompt } from '../lib/prompts'
import { Badge, Button } from './ui'

export function ImageQualityCard({
  productName,
  quality
}: {
  productName: string
  quality: ImageQuality | null
}) {
  const [copied, setCopied] = useState(false)
  if (!quality) return null
  const { label, tone } = qualityLabel(quality.score)

  const copyPrompt = async () => {
    const prompt = buildImprovementPrompt(productName, quality)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copiá el texto y pegalo en tu IA:', prompt)
    }
  }

  return (
    <div className="rounded-2xl border border-nude-200 bg-nude-50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Calidad de la foto</span>
          <Badge tone={tone}>{label} · {quality.score}/100</Badge>
        </div>
        <span className="text-xs text-nude-400">
          {quality.width}×{quality.height}px · {quality.sizeKB} KB
        </span>
      </div>

      {quality.issues.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {quality.issues.map((issue) => (
            <li key={issue.code} className="flex items-start gap-2 text-xs text-nude-600">
              <span className={issue.severity === 'bad' ? 'text-red-500' : 'text-amber-500'}>●</span>
              <span>{issue.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-emerald-700">Se ve nítida, bien iluminada y con buena resolución. ¡Lista!</p>
      )}

      {quality.issues.length > 0 ? (
        <div className="mt-3 rounded-xl bg-white/70 p-3">
          <p className="text-xs text-nude-600">
            Para mejorarla, copiá este texto y enviálo junto con la foto a una IA (ChatGPT, Gemini, etc.). Después volvé a
            subir la imagen mejorada.
          </p>
          <Button variant="secondary" className="mt-2 w-full sm:w-auto" onClick={copyPrompt}>
            {copied ? '¡Copiado!' : 'Copiar texto para la IA'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
