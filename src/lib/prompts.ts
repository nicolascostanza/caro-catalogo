import type { ImageQuality } from '../types'

export function buildImprovementPrompt(productName: string, quality: ImageQuality | null): string {
  const producto = productName.trim() ? productName.trim() : 'este producto'
  const issues = quality?.issues ?? []

  const fixes: string[] = []
  if (issues.some((i) => i.code.startsWith('res'))) {
    fixes.push('Aumentá la resolución y recuperá el detalle perdido (que se vea nítido al ampliar).')
  }
  if (issues.some((i) => i.code.startsWith('blur'))) {
    fixes.push('Mejorá el enfoque y la nitidez, especialmente en la etiqueta y los bordes del producto.')
  }
  if (issues.some((i) => i.code.startsWith('dark'))) {
    fixes.push('Iluminá la escena: subí la luz de forma pareja y aclaraste las zonas oscuras sin perder color.')
  }
  if (issues.some((i) => i.code.startsWith('bright'))) {
    fixes.push('Bajá un poco la exposición para recuperar detalle en las zonas quemadas o muy blancas.')
  }
  if (issues.some((i) => i.code === 'contrast')) {
    fixes.push('Aumentá levemente el contraste y la saturación para que el producto resalte.')
  }
  if (fixes.length === 0) {
    fixes.push('Mejorá la nitidez y la iluminación manteniendo el aspecto natural de la foto.')
  }

  return [
    `Mejorá la calidad de esta foto de producto para un catálogo mayorista profesional de aromas y velas.`,
    ``,
    `Producto: ${producto}.`,
    `Qué quiero:`,
    ...fixes.map((f) => `- ${f}`),
    `- Fondo limpio y neutro (beige claro o blanco), iluminación suave y pareja, sin sombras duras.`,
    `- Colores fieles al original, sin texto, logos ni marcas de agua agregados.`,
    `- Encuadre vertical 3:4 con el producto centrado, listo para un catálogo elegante.`,
    ``,
    `Importante: mantené el producto IDÉNTICO (forma, color, envase y etiqueta tal como está). No inventes ni cambies el diseño del producto. Devolvé solo la imagen mejorada.`
  ].join('\n')
}
