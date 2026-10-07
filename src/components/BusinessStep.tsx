import { useProject } from '../store/project'
import { Card, Field, Input, TextArea } from './ui'

export function BusinessStep() {
  const { project, updateBusiness } = useProject()
  const b = project.business

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-nude-700">Datos del negocio</h2>
        <p className="mt-1 text-sm text-nude-500">
          Esto aparece en la tapa, el encabezado y la contratapa del catálogo. Se guarda solo.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <Input value={b.name} onChange={(e) => updateBusiness({ name: e.target.value })} placeholder="AURA JAZMÍN" />
          </Field>
          <Field label="Instagram">
            <Input
              value={b.instagram}
              onChange={(e) => updateBusiness({ instagram: e.target.value })}
              placeholder="@tu_negocio"
            />
          </Field>
        </div>

        <Field label="Bajada del encabezado">
          <Input
            value={b.subtitle}
            onChange={(e) => updateBusiness({ subtitle: e.target.value })}
            placeholder="CATÁLOGO MAYORISTA · AROMAS PARA TU NEGOCIO"
          />
        </Field>

        <Field label="Frase de la tapa" hint="Va grande y centrada en la portada.">
          <Input
            value={b.tagline}
            onChange={(e) => updateBusiness({ tagline: e.target.value })}
            placeholder="Aromas que transforman espacios"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Compra mínima (unidades)">
            <Input
              type="number"
              min={1}
              value={b.minUnits}
              onChange={(e) => updateBusiness({ minUnits: Math.max(1, Number(e.target.value) || 1) })}
            />
          </Field>
          <Field label="Texto del pie de página">
            <Input value={b.footerNote} onChange={(e) => updateBusiness({ footerNote: e.target.value })} />
          </Field>
        </div>

        <Field label="Rubros" hint="Lista de categorías que se muestra en tapa y contratapa.">
          <TextArea value={b.rubros} onChange={(e) => updateBusiness({ rubros: e.target.value })} />
        </Field>

        <Field label="Mensaje de la contratapa">
          <TextArea value={b.backNote} onChange={(e) => updateBusiness({ backNote: e.target.value })} />
        </Field>
      </Card>
    </div>
  )
}
