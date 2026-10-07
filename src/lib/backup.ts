import type { Project } from '../types'
import { blobToDataUrl, dataUrlToBlob } from './imageUtils'

const APP_ID = 'caro-catalogo'

interface Backup {
  app: string
  version: number
  exportedAt: string
  project: Project
  images: Record<string, string>
}

export async function exportBackup(project: Project, imageUrls: Record<string, string>): Promise<Blob> {
  const images: Record<string, string> = {}
  for (const [id, url] of Object.entries(imageUrls)) {
    try {
      const blob = await fetch(url).then((r) => r.blob())
      images[id] = await blobToDataUrl(blob)
    } catch {
      // Ignoramos imágenes ilegibles.
    }
  }
  const data: Backup = {
    app: APP_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    images
  }
  return new Blob([JSON.stringify(data)], { type: 'application/json' })
}

export async function parseBackup(file: File): Promise<{ project: Project; images: Record<string, Blob> }> {
  const text = await file.text()
  let data: Backup
  try {
    data = JSON.parse(text) as Backup
  } catch {
    throw new Error('El archivo no es una copia válida.')
  }
  if (data.app !== APP_ID || !data.project) {
    throw new Error('El archivo no es una copia de este catálogo.')
  }
  const images: Record<string, Blob> = {}
  for (const [id, dataUrl] of Object.entries(data.images ?? {})) {
    try {
      images[id] = await dataUrlToBlob(dataUrl)
    } catch {
      // Ignoramos imágenes corruptas.
    }
  }
  return { project: data.project, images }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function shareBlob(blob: Blob, filename: string, title: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>
  }
  if (!nav.share) return false
  const file = new File([blob], filename, { type: blob.type })
  if (nav.canShare && !nav.canShare({ files: [file] })) return false
  try {
    await nav.share({ files: [file], title, text: title })
    return true
  } catch {
    return false
  }
}
