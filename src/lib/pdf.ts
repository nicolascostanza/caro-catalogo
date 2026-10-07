import { jsPDF } from 'jspdf'
import type { Business, PdfImage, Product, Project } from '../types'
import { money } from './format'
import { blobToDataUrl, loadImageFromUrl } from './imageUtils'
import playfair400Url from '../assets/fonts/playfair-400.ttf?url'
import playfair700Url from '../assets/fonts/playfair-700.ttf?url'
import inter400Url from '../assets/fonts/inter-400.ttf?url'
import inter600Url from '../assets/fonts/inter-600.ttf?url'

type RGB = [number, number, number]

const COLORS = {
  bg: [245, 238, 228] as RGB,
  brown: [107, 74, 59] as RGB,
  taupe: [141, 119, 105] as RGB,
  line: [216, 199, 182] as RGB,
  dark: [48, 40, 36] as RGB,
  terra: [169, 101, 85] as RGB,
  white: [255, 255, 255] as RGB
}

// jsPDF usa origen arriba-izquierda: y crece hacia abajo.
const PAGE_W = 595.2756
const PAGE_H = 841.8898
const MARGIN = 42
const RIGHT = PAGE_W - MARGIN
const FOOTER_Y = 800

const F_PLAIN = 'Playfair'
const F_BOLD = 'PlayfairBold'
const F_TEXT = 'Inter'
const F_TEXT_BOLD = 'InterSemi'

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[])
  }
  return btoa(binary)
}

interface FontEntry {
  file: string
  name: string
  b64: string
}

let fontCache: FontEntry[] | null = null

async function loadFontData(): Promise<FontEntry[]> {
  if (fontCache) return fontCache
  const [p4, p7, i4, i6] = await Promise.all([
    fetch(playfair400Url).then((r) => r.arrayBuffer()),
    fetch(playfair700Url).then((r) => r.arrayBuffer()),
    fetch(inter400Url).then((r) => r.arrayBuffer()),
    fetch(inter600Url).then((r) => r.arrayBuffer())
  ])
  fontCache = [
    { file: 'playfair-400.ttf', name: F_PLAIN, b64: toBase64(p4) },
    { file: 'playfair-700.ttf', name: F_BOLD, b64: toBase64(p7) },
    { file: 'inter-400.ttf', name: F_TEXT, b64: toBase64(i4) },
    { file: 'inter-600.ttf', name: F_TEXT_BOLD, b64: toBase64(i6) }
  ]
  return fontCache
}

async function registerFonts(doc: jsPDF): Promise<void> {
  const fonts = await loadFontData()
  for (const f of fonts) {
    doc.addFileToVFS(f.file, f.b64)
    doc.addFont(f.file, f.name, 'normal')
  }
}

function font(doc: jsPDF, name: string, size: number, color: RGB): void {
  doc.setFont(name, 'normal')
  doc.setFontSize(size)
  doc.setTextColor(color[0], color[1], color[2])
}

function fillBg(doc: jsPDF): void {
  doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2])
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
}

function line(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, color: RGB, w = 1): void {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setLineWidth(w)
  doc.line(x1, y1, x2, y2)
}

function formatFromDataUrl(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
}

function fitContain(
  imgW: number,
  imgH: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(boxW / imgW, boxH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  return { x: boxX + (boxW - w) / 2, y: boxY + (boxH - h) / 2, w, h }
}

function drawImageInBox(
  doc: jsPDF,
  image: PdfImage | undefined,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
): void {
  if (!image) return
  const fit = fitContain(image.width, image.height, boxX, boxY, boxW, boxH)
  doc.addImage(image.dataUrl, formatFromDataUrl(image.dataUrl), fit.x, fit.y, fit.w, fit.h, undefined, 'FAST')
}

function drawInstagramIcon(doc: jsPDF, x: number, y: number, size: number, color: RGB): void {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setLineWidth(1.1)
  doc.roundedRect(x, y, size, size, size * 0.28, size * 0.28, 'S')
  const cx = x + size / 2
  const cy = y + size / 2
  doc.circle(cx, cy, size * 0.22, 'S')
  doc.setFillColor(color[0], color[1], color[2])
  doc.circle(x + size * 0.74, y + size * 0.26, size * 0.055, 'F')
}

function drawFooter(doc: jsPDF, business: Business): void {
  drawInstagramIcon(doc, MARGIN, FOOTER_Y - 9, 12, COLORS.brown)
  font(doc, F_TEXT_BOLD, 9.2, COLORS.dark)
  doc.text(business.instagram || '', MARGIN + 18, FOOTER_Y)
  font(doc, F_TEXT, 7.7, COLORS.taupe)
  doc.text(business.footerNote || '', RIGHT, FOOTER_Y, { align: 'right' })
}

function drawHeader(doc: jsPDF, business: Business): void {
  font(doc, F_BOLD, 22, COLORS.brown)
  doc.text(business.name || '', MARGIN, 58)
  font(doc, F_TEXT, 7.8, COLORS.taupe)
  doc.text(business.subtitle || '', MARGIN + 2, 74)
  line(doc, MARGIN, 88, RIGHT, 88, COLORS.line, 1)
}

function wrapAndDraw(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[]
  const used = Math.min(lines.length, maxLines)
  for (let i = 0; i < used; i++) {
    let value = lines[i]
    if (i === used - 1 && lines.length > maxLines) value = value.replace(/\s+\S*$/, '') + '...'
    doc.text(value, x, y + i * lineHeight)
  }
  return used
}

function drawCoverPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, letter: string): void {
  doc.setFillColor(239, 231, 220)
  doc.roundedRect(x, y, w, h, 8, 8, 'F')
  doc.setDrawColor(216, 199, 182)
  doc.setLineWidth(0.8)
  doc.roundedRect(x + 7, y + 7, w - 14, h - 14, 6, 6, 'S')
  const size = Math.min(w, h) * 0.3
  font(doc, F_BOLD, size, [203, 184, 165] as RGB)
  doc.text(letter, x + w / 2, y + h / 2 + size * 0.34, { align: 'center' })
}

function drawCover(doc: jsPDF, project: Project, images: Record<string, PdfImage>): void {
  fillBg(doc)
  const { business } = project

  font(doc, F_BOLD, 34, COLORS.brown)
  doc.text(business.name || '', PAGE_W / 2, 70, { align: 'center' })
  line(doc, PAGE_W / 2 - 96, 88, PAGE_W / 2 + 96, 88, COLORS.line, 1.2)

  font(doc, F_TEXT, 9, COLORS.taupe)
  doc.text('CATÁLOGO MAYORISTA', PAGE_W / 2, 108, { align: 'center', charSpace: 2 })

  font(doc, F_BOLD, 21, COLORS.dark)
  doc.text(business.tagline || '', PAGE_W / 2, 146, { align: 'center' })

  font(doc, F_TEXT_BOLD, 8, COLORS.terra)
  doc.text(`VENTA A PARTIR DE ${business.minUnits} UNIDADES`, PAGE_W / 2, 170, {
    align: 'center',
    charSpace: 1.5
  })

  const coverProducts = project.coverIds
    .map((id) => project.products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p && p.imageId))
    .slice(0, 4)
  const letter = (business.name || 'C').trim().charAt(0).toUpperCase() || 'C'

  const gridTop = 198
  const gap = 12
  const cellW = (RIGHT - MARGIN - gap) / 2
  const cellH = 268
  const positions = [
    [MARGIN, gridTop],
    [MARGIN + cellW + gap, gridTop],
    [MARGIN, gridTop + cellH + gap],
    [MARGIN + cellW + gap, gridTop + cellH + gap]
  ]
  positions.forEach(([x, y], i) => {
    const product = coverProducts[i]
    if (product?.imageId) {
      doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2])
      doc.roundedRect(x, y, cellW, cellH, 8, 8, 'F')
      drawImageInBox(doc, images[product.imageId], x + 8, y + 8, cellW - 16, cellH - 16)
    } else {
      drawCoverPlaceholder(doc, x, y, cellW, cellH, letter)
    }
  })

  drawFooter(doc, business)
}

function drawPriceBox(doc: jsPDF, product: Product, top: number): void {
  const x = MARGIN
  const w = RIGHT - MARGIN
  const h = 80
  doc.setFillColor(COLORS.brown[0], COLORS.brown[1], COLORS.brown[2])
  doc.roundedRect(x, top, w, h, 7, 7, 'F')

  const leftX = x + 18
  font(doc, F_TEXT_BOLD, 9, COLORS.white)
  doc.text('VENTA MAYORISTA', leftX, top + 30)
  font(doc, F_BOLD, 24, COLORS.white)
  doc.text(money(product.price), leftX, top + 62)

  const rx = RIGHT - 18
  font(doc, F_TEXT_BOLD, 8.5, COLORS.white)
  doc.text('PRECIO UNITARIO', rx, top + 26, { align: 'right' })
  font(doc, F_TEXT, 8.5, COLORS.white)
  doc.text(`Compra mínima: ${product.minUnits} unidades`, rx, top + 45, { align: 'right' })
  doc.text(`Bulto x${product.minUnits}: ${money(product.price * product.minUnits)}`, rx, top + 64, {
    align: 'right'
  })
}

function drawProductSingle(
  doc: jsPDF,
  product: Product,
  business: Business,
  image: PdfImage | undefined
): void {
  fillBg(doc)
  drawHeader(doc, business)

  font(doc, F_BOLD, 19, COLORS.dark)
  doc.text(product.name || 'Producto sin nombre', MARGIN, 124)
  font(doc, F_BOLD, 9, COLORS.terra)
  doc.text(product.line || '', MARGIN + 2, 142)

  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2])
  doc.roundedRect(MARGIN, 160, RIGHT - MARGIN, 350, 8, 8, 'F')
  if (image) {
    drawImageInBox(doc, image, MARGIN + 14, 174, RIGHT - MARGIN - 28, 322)
  } else {
    font(doc, F_TEXT, 9, COLORS.taupe)
    doc.text('Sin imagen cargada', PAGE_W / 2, 340, { align: 'center' })
  }

  drawPriceBox(doc, product, 536)

  font(doc, F_BOLD, 11, COLORS.dark)
  doc.text('Detalles', MARGIN, 650)
  const details = (product.details || '').trim()
  if (details) {
    const available = 785 - 668
    const sizes = [8.8, 8.4, 8, 7.6, 7.2]
    for (const size of sizes) {
      font(doc, F_TEXT, size, COLORS.taupe)
      const lineHeight = size * 1.2
      const lines = doc.splitTextToSize(details, RIGHT - MARGIN) as string[]
      if (lines.length * lineHeight <= available || size === sizes[sizes.length - 1]) {
        const maxLines = Math.max(1, Math.floor(available / lineHeight))
        wrapAndDraw(doc, details, MARGIN, 668, RIGHT - MARGIN, lineHeight, maxLines)
        break
      }
    }
  }

  drawFooter(doc, business)
}

function drawProductCard(
  doc: jsPDF,
  product: Product,
  image: PdfImage | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2])
  doc.roundedRect(x, y, w, h, 8, 8, 'F')

  const textH = 66
  const pad = 8
  if (image) {
    drawImageInBox(doc, image, x + pad, y + pad, w - pad * 2, h - textH - pad)
  } else {
    font(doc, F_TEXT, 8, COLORS.taupe)
    doc.text('Sin imagen', x + w / 2, y + (h - textH) / 2, { align: 'center' })
  }

  const baseY = y + h - textH + 18
  font(doc, F_BOLD, 13, COLORS.dark)
  doc.text(product.name || 'Producto', x + 12, baseY, { maxWidth: w - 24 })
  font(doc, F_TEXT, 8, COLORS.taupe)
  doc.text(product.line || '', x + 12, baseY + 14, { maxWidth: w - 24 })
  font(doc, F_BOLD, 15, COLORS.brown)
  doc.text(money(product.price), x + 12, baseY + 34)
  font(doc, F_TEXT, 7.5, COLORS.taupe)
  doc.text(`x${product.minUnits}: ${money(product.price * product.minUnits)}`, x + w - 12, baseY + 34, {
    align: 'right'
  })
}

function drawProductGrid(
  doc: jsPDF,
  project: Project,
  images: Record<string, PdfImage>,
  items: Product[]
): void {
  fillBg(doc)
  drawHeader(doc, project.business)
  const perPage = project.gridPerPage
  const top = 112
  const bottom = 770
  const gap = 16
  const areaH = bottom - top

  if (perPage === 2) {
    const w = RIGHT - MARGIN
    const h = (areaH - gap) / 2
    items.forEach((p, i) => {
      const y = top + i * (h + gap)
      drawProductCard(doc, p, p.imageId ? images[p.imageId] : undefined, MARGIN, y, w, h)
    })
  } else {
    const w = (RIGHT - MARGIN - gap) / 2
    const h = (areaH - gap) / 2
    items.forEach((p, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = MARGIN + col * (w + gap)
      const y = top + row * (h + gap)
      drawProductCard(doc, p, p.imageId ? images[p.imageId] : undefined, x, y, w, h)
    })
  }
  drawFooter(doc, project.business)
}

function drawBackCover(doc: jsPDF, business: Business): void {
  fillBg(doc)

  font(doc, F_BOLD, 30, COLORS.brown)
  doc.text(business.name || '', PAGE_W / 2, 118, { align: 'center' })

  font(doc, F_BOLD, 18, COLORS.dark)
  doc.text('Venta mayorista', PAGE_W / 2, 160, { align: 'center' })

  font(doc, F_TEXT_BOLD, 11, COLORS.terra)
  doc.text(`A partir de ${business.minUnits} unidades`, PAGE_W / 2, 184, { align: 'center' })

  font(doc, F_TEXT, 10, COLORS.taupe)
  const note = doc.splitTextToSize(business.backNote || '', 360) as string[]
  note.forEach((l, i) => doc.text(l, PAGE_W / 2, 212 + i * 14, { align: 'center' }))

  const boxX = MARGIN
  const boxY = 345
  const boxW = RIGHT - MARGIN
  const boxH = 290
  doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2])
  doc.roundedRect(boxX, boxY, boxW, boxH, 12, 12, 'F')

  font(doc, F_BOLD, 18, COLORS.brown)
  doc.text('Seguinos en Instagram', PAGE_W / 2, 420, { align: 'center' })

  const handle = business.instagram || ''
  font(doc, F_BOLD, 18, COLORS.brown)
  const textW = doc.getTextWidth(handle)
  const iconSize = 15
  const iconGap = 8
  const groupW = iconSize + iconGap + textW
  const startX = PAGE_W / 2 - groupW / 2
  drawInstagramIcon(doc, startX, 452, iconSize, COLORS.brown)
  doc.text(handle, startX + iconSize + iconGap, 466)

  font(doc, F_TEXT, 9, COLORS.taupe)
  const rubros = doc.splitTextToSize(business.rubros || '', 380) as string[]
  rubros.forEach((l, i) => doc.text(l, PAGE_W / 2, 512 + i * 14, { align: 'center' }))

  drawFooter(doc, business)
}

export async function collectPdfImages(
  project: Project,
  imageUrls: Record<string, string>
): Promise<Record<string, PdfImage>> {
  const map: Record<string, PdfImage> = {}
  for (const product of project.products) {
    const id = product.imageId
    if (!id || map[id] || !imageUrls[id]) continue
    try {
      const blob = await fetch(imageUrls[id]).then((r) => r.blob())
      const dataUrl = await blobToDataUrl(blob)
      const img = await loadImageFromUrl(dataUrl)
      map[id] = { dataUrl, width: img.naturalWidth, height: img.naturalHeight }
    } catch {
      // Ignoramos imágenes que no se puedan leer.
    }
  }
  return map
}

export async function generateCatalogPdf(
  project: Project,
  images: Record<string, PdfImage>
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  await registerFonts(doc)

  drawCover(doc, project, images)

  const products = project.products
  if (products.length > 0) {
    if (project.layout === 'grid') {
      const perPage = project.gridPerPage
      for (let i = 0; i < products.length; i += perPage) {
        doc.addPage()
        drawProductGrid(doc, project, images, products.slice(i, i + perPage))
      }
    } else {
      for (const product of products) {
        doc.addPage()
        drawProductSingle(doc, product, project.business, product.imageId ? images[product.imageId] : undefined)
      }
    }
  }

  doc.addPage()
  drawBackCover(doc, project.business)

  return doc.output('blob')
}


