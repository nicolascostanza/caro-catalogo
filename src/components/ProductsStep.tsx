import { useState } from 'react'
import { useProject } from '../store/project'
import { money } from '../lib/format'
import { qualityLabel } from '../lib/imageQuality'
import { Badge, Button, Card } from './ui'
import { ProductEditor } from './ProductEditor'

function QualityDot({ score }: { score: number }) {
  const { tone } = qualityLabel(score)
  const colors: Record<string, string> = {
    good: 'bg-emerald-500',
    ok: 'bg-lime-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500'
  }
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[tone]}`} />
}

export function ProductsStep() {
  const { project, addProduct, moveProduct, imageUrls, setLayout } = useProject()
  const [editing, setEditing] = useState<string | null>(null)
  const editingProduct = project.products.find((p) => p.id === editing) ?? null

  const handleAdd = () => {
    const id = addProduct()
    setEditing(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-nude-700">Productos</h2>
          <p className="mt-1 text-sm text-nude-500">Cargá las fotos y los datos. Se guardan solos.</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0">
          + Agregar
        </Button>
      </div>

      <Card className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Formato del catálogo</span>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setLayout('single')}
            className={`rounded-xl border p-3 text-left transition ${
              project.layout === 'single' ? 'border-nude-500 bg-nude-100' : 'border-nude-200 bg-white hover:bg-nude-50'
            }`}
          >
            <p className="text-sm font-semibold text-nude-700">Una página por producto</p>
            <p className="mt-0.5 text-xs text-nude-500">Como el ejemplo. Foto grande y prolija.</p>
          </button>
          <button
            onClick={() => setLayout('grid', project.gridPerPage)}
            className={`rounded-xl border p-3 text-left transition ${
              project.layout === 'grid' ? 'border-nude-500 bg-nude-100' : 'border-nude-200 bg-white hover:bg-nude-50'
            }`}
          >
            <p className="text-sm font-semibold text-nude-700">Varios por página</p>
            <p className="mt-0.5 text-xs text-nude-500">Catálogo más corto en grilla.</p>
          </button>
        </div>
        {project.layout === 'grid' ? (
          <div className="flex gap-2">
            {([2, 4] as const).map((n) => (
              <button
                key={n}
                onClick={() => setLayout('grid', n)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                  project.gridPerPage === n ? 'border-nude-500 bg-nude-100 text-nude-700' : 'border-nude-200 bg-white text-nude-500'
                }`}
              >
                {n} por página
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      {project.products.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-serif text-lg text-nude-600">Todavía no hay productos</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-nude-500">
            Tocá “Agregar” para cargar el primero: foto, nombre y precio.
          </p>
          <Button className="mt-4" onClick={handleAdd}>
            + Agregar el primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {project.products.map((p, i) => {
            const url = p.imageId ? imageUrls[p.imageId] : undefined
            return (
              <Card key={p.id} className="flex items-center gap-3 p-3">
                <button
                  onClick={() => setEditing(p.id)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-nude-200 bg-white"
                >
                  {url ? (
                    <img src={url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-nude-400">Sin foto</span>
                  )}
                </button>
                <button onClick={() => setEditing(p.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold text-nude-700">{p.name || 'Producto sin nombre'}</p>
                  <p className="truncate text-xs text-nude-500">{p.line || 'Sin línea'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-nude-600">{money(p.price)}</span>
                    {p.quality ? (
                      <span className="flex items-center gap-1 text-xs text-nude-400">
                        <QualityDot score={p.quality.score} /> calidad
                      </span>
                    ) : null}
                    {p.inCover ? <Badge tone="neutral">Tapa</Badge> : null}
                  </div>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveProduct(p.id, -1)}
                    disabled={i === 0}
                    className="rounded-lg border border-nude-200 px-2 py-0.5 text-nude-500 transition hover:bg-nude-100 disabled:opacity-30"
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveProduct(p.id, 1)}
                    disabled={i === project.products.length - 1}
                    className="rounded-lg border border-nude-200 px-2 py-0.5 text-nude-500 transition hover:bg-nude-100 disabled:opacity-30"
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editingProduct ? (
        <ProductEditor product={editingProduct} open onClose={() => setEditing(null)} />
      ) : null}

      {project.products.length > 0 ? (
        <p className="text-center text-xs text-nude-400">
          Tip: marcá “Mostrar en la tapa” en hasta 4 productos con foto.
        </p>
      ) : null}

      {project.products.length > 0 && project.products.filter((p) => p.inCover).length === 0 ? (
        <div className="rounded-xl bg-nude-100 px-3.5 py-2.5 text-center text-xs text-nude-500">
          No elegiste fotos para la tapa: se usarán las de los primeros productos con imagen.
        </div>
      ) : null}
    </div>
  )
}
