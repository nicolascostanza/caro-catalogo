export function money(value: number): string {
  const n = Number.isFinite(value) ? value : 0
  return '$' + Math.round(n).toLocaleString('es-AR')
}

export function uid(prefix = 'p'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function clampText(text: string, max: number): string {
  const t = (text ?? '').trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t
}
