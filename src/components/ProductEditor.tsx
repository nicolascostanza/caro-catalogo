import { useRef, useState } from 'react'
import type { Product } from '../types'
import { useProject } from '../store/project'
import { money } from '../lib/format'
import { ImageQualityCard } from './ImageQualityCard'
import { Button, Field, Input, Modal, TextArea } from './ui'

export function ProductEditor({
  product,
  open,
  onClose
}: {
  product: Product
  open: boolean
  onClose: () => void
}) {
  const { updateProduct, setProductImage, removeProduct, imageUrls, project, toggleCover } = useProject()
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const url = product.imageId ? imageUrls[product.imageId] : undefined

  const onPickFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      await setProductImage(product.id, file)
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async () => {
    setBusy(true)
    try {
      await setProductImage(product.id, null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product.name ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('¿Eliminar este producto?')) {
                removeProduct(product.id)
                onClose()
              }
            }}
          >
            Eliminar
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-nude-500">Foto del producto</span>
          <div className="flex gap-3">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-nude-200 bg-white">
              {url ? (
                <img src={url} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-xs text-nude-400">
                  Sin foto
                </div>
              )}
              {busy ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-nude-600">
                  Procesando…
                </div>
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void onPickFile(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
                {url ? 'Cambiar foto' : 'Subir foto'}
              </Button>
              {url ? (
                <Button variant="ghost" onClick={removeImage} disabled={busy}>
                  Quitar foto
                </Button>
              ) : null}
            </div>
          </div>
          <ImageQualityCard productName={product.name} quality={product.quality} />
        </div>

        <Field label="Nombre del producto">
          <Input
            value={product.name}
            onChange={(e) => updateProduct(product.id, { name: e.target.value })}
            placeholder="Sahumerio Tibetano – Slim"
          />
        </Field>

        <Field label="Línea / presentación">
          <Input
            value={product.line}
            onChange={(e) => updateProduct(product.id, { line: e.target.value })}
            placeholder="Línea Aromanza · Presentación Slim"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio unitario">
            <Input
              type="number"
              min={0}
              value={product.price || ''}
              onChange={(e) => updateProduct(product.id, { price: Math.max(0, Number(e.target.value) || 0) })}
              placeholder="1500"
            />
          </Field>
          <Field label="Compra mínima (unidades)">
            <Input
              type="number"
              min={1}
              value={product.minUnits}
              onChange={(e) =>
                updateProduct(product.id, { minUnits: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </Field>
        </div>

        {product.price > 0 ? (
          <div className="rounded-xl bg-nude-100 px-3.5 py-2.5 text-sm text-nude-600">
            Precio por bulto ({product.minUnits} u): <strong>{money(product.price * product.minUnits)}</strong>
          </div>
        ) : null}

        <Field label="Detalles" hint="Fragancias, medidas, colores, lo que quieras contar del producto.">
          <TextArea
            value={product.details}
            onChange={(e) => updateProduct(product.id, { details: e.target.value })}
            placeholder="Fragancias visibles: Gardenias, Energía Limpia, Frutos Rojos…"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-xl border border-nude-200 bg-white px-3.5 py-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-nude-600"
            disabled={!url}
            checked={project.coverIds.includes(product.id)}
            onChange={() => toggleCover(product.id)}
          />
          <span className="text-sm text-nude-700">
            Mostrar esta foto en la tapa
            {!url ? <span className="ml-1 text-nude-400">(cargá una foto primero)</span> : null}
          </span>
        </label>
      </div>
    </Modal>
  )
}
