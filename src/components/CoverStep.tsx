import { useState } from 'react'
import { useProject } from '../store/project'
import { Card } from './ui'

export function CoverStep() {
  const { project, toggleCover, setCoverOrder, moveCover, imageUrls } = useProject()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const withImage = project.products.filter((p) => p.imageId)
  const orderedSelected = project.coverIds
    .map((id) => withImage.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const available = withImage.filter((p) => !project.coverIds.includes(p.id))

  const reorder = (from: number, to: number) => {
    if (from === to) return
    const ids = orderedSelected.map((p) => p.id)
    const [item] = ids.splice(from, 1)
    ids.splice(to, 0, item)
    setCoverOrder(ids)
  }

  const add = (id: string) => {
    if (project.coverIds.length >= 4) {
      alert('Podés elegir hasta 4 fotos para la tapa.')
      return
    }
    toggleCover(id)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-nude-700">Tapa</h2>
        <p className="mt-1 text-sm text-nude-500">
          Elegí hasta 4 fotos para la portada y ordenalas a tu gusto. Si no elegís ninguna, te mostramos una tapa de reserva.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">
              En la tapa · {orderedSelected.length}/4
            </span>
            <p className="mt-0.5 text-xs text-nude-400">Arrastrá para cambiar el orden.</p>
          </div>

          {orderedSelected.length === 0 ? (
            <div className="rounded-xl border border-dashed border-nude-300 bg-nude-50 px-4 py-6 text-center text-sm text-nude-500">
              Todavía no hay fotos elegidas. Tocá una foto de abajo para sumarla.
            </div>
          ) : (
            <div className="space-y-2">
              {orderedSelected.map((p, i) => {
                const url = p.imageId ? imageUrls[p.imageId] : undefined
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setOverIndex(i)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dragIndex !== null) reorder(dragIndex, i)
                      setDragIndex(null)
                      setOverIndex(null)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setOverIndex(null)
                    }}
                    className={`flex items-center gap-3 rounded-xl border bg-white p-2 transition ${
                      overIndex === i && dragIndex !== null ? 'border-nude-500 ring-2 ring-nude-300/60' : 'border-nude-200'
                    } ${dragIndex === i ? 'opacity-60' : ''}`}
                  >
                    <span className="cursor-grab select-none text-nude-300" aria-hidden>
                      ⠿
                    </span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nude-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-nude-200 bg-white">
                      {url ? <img src={url} alt={p.name} className="h-full w-full object-contain" /> : null}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm text-nude-700">{p.name || 'Sin nombre'}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCover(p.id, -1)}
                        disabled={i === 0}
                        className="rounded-lg border border-nude-200 px-2 py-0.5 text-nude-500 transition hover:bg-nude-100 disabled:opacity-30"
                        aria-label="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCover(p.id, 1)}
                        disabled={i === orderedSelected.length - 1}
                        className="rounded-lg border border-nude-200 px-2 py-0.5 text-nude-500 transition hover:bg-nude-100 disabled:opacity-30"
                        aria-label="Mover abajo"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => toggleCover(p.id)}
                        className="rounded-lg border border-nude-200 px-2 py-0.5 text-nude-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Quitar de la tapa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="border-t border-nude-200 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Disponibles</span>
            {available.length === 0 ? (
              <p className="mt-2 text-xs text-nude-400">
                {withImage.length === 0
                  ? 'Cargá fotos en la sección Productos para elegir las de la tapa.'
                  : 'Todas las fotos con imagen ya están en la tapa.'}
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                {available.map((p) => {
                  const url = p.imageId ? imageUrls[p.imageId] : undefined
                  return (
                    <button
                      key={p.id}
                      onClick={() => add(p.id)}
                      className="group relative aspect-square overflow-hidden rounded-xl border-2 border-nude-200 bg-white transition hover:border-nude-400"
                    >
                      {url ? <img src={url} alt={p.name} className="h-full w-full object-contain" /> : null}
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[11px] font-bold text-nude-500">
                        +
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Así se ve la tapa</span>
          <div className="rounded-xl bg-nude-100 p-4">
            <div className="text-center">
              <p className="font-serif text-xl font-bold text-nude-600">{project.business.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-nude-500">Catálogo mayorista</p>
              <p className="mt-2 font-serif text-base font-bold text-nude-800">{project.business.tagline}</p>
              <p className="mt-1 text-[10px] font-semibold tracking-wide text-terracotta">
                VENTA A PARTIR DE {project.business.minUnits} UNIDADES
              </p>
            </div>
            {orderedSelected.length > 0 ? (
              <div className="mt-3 flex min-h-[13.5rem] flex-wrap content-center justify-center gap-2">
                {orderedSelected.map((p) => {
                  const url = p.imageId ? imageUrls[p.imageId] : undefined
                  return (
                    <div key={p.id} className="aspect-[4/3] w-[calc(50%-0.25rem)] overflow-hidden rounded-lg bg-white">
                      {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between text-[9px] text-nude-500">
              <span>{project.business.instagram}</span>
              <span className="truncate pl-2 text-right">{project.business.footerNote}</span>
            </div>
          </div>
          {orderedSelected.length === 0 ? (
            <p className="text-center text-xs text-nude-400">
              Sin fotos la tapa queda limpia, solo con el fondo. Elegí fotos para completarla.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
