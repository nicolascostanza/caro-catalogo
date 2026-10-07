import { useProject } from '../store/project'
import { Card } from './ui'

export function CoverStep() {
  const { project, updateProduct, imageUrls } = useProject()
  const withImage = project.products.filter((p) => p.imageId)
  const selected = withImage.filter((p) => p.inCover).slice(0, 4)

  const toggle = (id: string) => {
    const product = project.products.find((p) => p.id === id)
    if (!product) return
    if (!product.inCover && selected.length >= 4) {
      alert('Podés elegir hasta 4 fotos para la tapa.')
      return
    }
    updateProduct(id, { inCover: !product.inCover })
  }

  const previewIds = selected.length > 0 ? selected.map((p) => p.id) : withImage.slice(0, 4).map((p) => p.id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-nude-700">Tapa</h2>
        <p className="mt-1 text-sm text-nude-500">Elegí hasta 4 fotos para la portada. Si no elegís, usamos las primeras.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Fotos disponibles</span>
          {withImage.length === 0 ? (
            <p className="py-6 text-center text-sm text-nude-400">
              Cargá fotos en la sección Productos para elegir las de la tapa.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {withImage.map((p) => {
                const url = p.imageId ? imageUrls[p.imageId] : undefined
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white transition ${
                      p.inCover ? 'border-nude-600' : 'border-nude-200'
                    }`}
                  >
                    {url ? <img src={url} alt={p.name} className="h-full w-full object-contain" /> : null}
                    <span
                      className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        p.inCover ? 'bg-nude-600 text-white' : 'bg-white/80 text-nude-400'
                      }`}
                    >
                      {p.inCover ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => {
                const id = previewIds[i]
                const url = id ? imageUrls[id] : undefined
                return (
                  <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg bg-white">
                    {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : null}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] text-nude-500">
              <span>{project.business.instagram}</span>
              <span className="truncate pl-2 text-right">{project.business.footerNote}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
