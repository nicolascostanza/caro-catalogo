import type { ImageQuality, QualityIssue } from '../types'
import { loadImageFromFile } from './imageUtils'

const ANALYSIS_MAX = 480

function grayscale(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    g[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return g
}

function laplacianVariance(g: Float32Array, w: number, h: number): number {
  let sum = 0
  let sumSq = 0
  let count = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const lap = -4 * g[i] + g[i - w] + g[i + w] + g[i - 1] + g[i + 1]
      sum += lap
      sumSq += lap * lap
      count++
    }
  }
  if (count === 0) return 0
  const mean = sum / count
  return sumSq / count - mean * mean
}

function meanStd(g: Float32Array): { mean: number; std: number } {
  let sum = 0
  for (let i = 0; i < g.length; i++) sum += g[i]
  const mean = sum / g.length
  let acc = 0
  for (let i = 0; i < g.length; i++) {
    const d = g[i] - mean
    acc += d * d
  }
  return { mean, std: Math.sqrt(acc / g.length) }
}

export function qualityLabel(score: number): { label: string; tone: 'good' | 'ok' | 'warn' | 'bad' } {
  if (score >= 85) return { label: 'Excelente', tone: 'good' }
  if (score >= 70) return { label: 'Buena', tone: 'ok' }
  if (score >= 50) return { label: 'Aceptable', tone: 'warn' }
  return { label: 'Mejorable', tone: 'bad' }
}

export async function analyzeImage(file: Blob): Promise<ImageQuality> {
  const img = await loadImageFromFile(file)
  const width = img.naturalWidth
  const height = img.naturalHeight
  const sizeKB = Math.round(file.size / 1024)

  const scale = Math.min(1, ANALYSIS_MAX / Math.max(width, height))
  const aw = Math.max(8, Math.round(width * scale))
  const ah = Math.max(8, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = aw
  canvas.height = ah
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(img, 0, 0, aw, ah)
  const data = ctx.getImageData(0, 0, aw, ah).data

  const g = grayscale(data, aw, ah)
  const blur = laplacianVariance(g, aw, ah)
  const { mean: brightness, std: contrast } = meanStd(g)

  const issues: QualityIssue[] = []
  const minSide = Math.min(width, height)
  const maxSide = Math.max(width, height)

  if (minSide < 700) {
    issues.push({ code: 'res_low', label: 'Resolución baja para imprimir', severity: 'bad' })
  } else if (minSide < 1000 || maxSide < 1200) {
    issues.push({ code: 'res_mid', label: 'Resolución justa, se vería mejor más grande', severity: 'warn' })
  }

  if (blur < 100) {
    issues.push({ code: 'blur_bad', label: 'La foto se ve desenfocada o borrosa', severity: 'bad' })
  } else if (blur < 200) {
    issues.push({ code: 'blur_warn', label: 'Nitidez mejorable', severity: 'warn' })
  }

  if (brightness < 40) {
    issues.push({ code: 'dark', label: 'La foto está muy oscura', severity: 'bad' })
  } else if (brightness < 60) {
    issues.push({ code: 'dark_warn', label: 'La foto está algo oscura', severity: 'warn' })
  } else if (brightness > 232) {
    issues.push({ code: 'bright', label: 'La foto está sobreexpuesta', severity: 'bad' })
  } else if (brightness > 214) {
    issues.push({ code: 'bright_warn', label: 'La foto está muy clara', severity: 'warn' })
  }

  if (contrast < 22) {
    issues.push({ code: 'contrast', label: 'Poco contraste, se ve lavada', severity: 'warn' })
  }

  if (sizeKB < 60 && width * height > 1_000_000) {
    issues.push({ code: 'compress', label: 'Parece comprimida de más (posible pérdida de detalle)', severity: 'warn' })
  }

  let score = 100
  for (const issue of issues) score -= issue.severity === 'bad' ? 25 : 10
  score = Math.max(0, Math.min(100, score))

  return {
    width,
    height,
    sizeKB,
    blur: Math.round(blur),
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    score,
    issues
  }
}
