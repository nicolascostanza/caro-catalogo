import { useCallback, useEffect, useRef, useState } from 'react'
import { useProject } from '../store/project'
import { collectPdfImages, generateCatalogPdf } from '../lib/pdf'
import { downloadBlob, shareBlob } from '../lib/backup'
import { Button, Card, Toast } from './ui'

function safeFilename(name: string): string {
  const base = (name || 'catalogo').trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
  return `catalogo-${base || 'mayorista'}.pdf`
}

export function PreviewStep() {
  const { project, imageUrls } = useProject()
  const [url, setUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  const build = useCallback(async () => {
    setGenerating(true)
    setError(null)
    try {
      const images = await collectPdfImages(project, imageUrls)
      const blob = await generateCatalogPdf(project, images)
      const next = URL.createObjectURL(blob)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = next
      setUrl(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setGenerating(false)
    }
  }, [project, imageUrls])

  useEffect(() => {
    const t = setTimeout(() => {
      void build()
    }, 500)
    return () => clearTimeout(t)
  }, [build])

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  const filename = safeFilename(project.business.name)

  const onDownload = async () => {
    if (!url) return
    const blob = await fetch(url).then((r) => r.blob())
    downloadBlob(blob, filename)
    setToast('PDF descargado')
    setTimeout(() => setToast(null), 2500)
  }

  const onShare = async () => {
    if (!url) return
    const blob = await fetch(url).then((r) => r.blob())
    const ok = await shareBlob(blob, filename, 'Catálogo mayorista')
    if (!ok) {
      downloadBlob(blob, filename)
      setToast('Descargado (tu navegador no permite compartir directo)')
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-nude-700">Vista previa y PDF</h2>
          <p className="mt-1 text-sm text-nude-500">Se actualiza sola cuando cambiás algo.</p>
        </div>
        <Button variant="secondary" onClick={() => void build()} disabled={generating} className="shrink-0">
          {generating ? 'Generando…' : 'Actualizar'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onDownload} disabled={!url || generating}>
          Descargar PDF
        </Button>
        <Button variant="terra" onClick={onShare} disabled={!url || generating}>
          Compartir
        </Button>
      </div>

      <Card className="p-2 sm:p-3">
        {error ? (
          <div className="flex min-h-[40vh] items-center justify-center p-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : url ? (
          <iframe title="Vista previa del catálogo" src={url} className="h-[70vh] w-full rounded-xl border border-nude-200" />
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-nude-400">
            {generating ? 'Generando vista previa…' : 'Sin vista previa'}
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-nude-400">
        Si en el celular no se ve la vista previa, tocá “Descargar PDF” y abrilo desde Archivos.
      </p>

      {toast ? <Toast message={toast} tone="good" /> : null}
    </div>
  )
}
