export type QualitySeverity = 'warn' | 'bad'

export interface QualityIssue {
  code: string
  label: string
  severity: QualitySeverity
}

export interface ImageQuality {
  width: number
  height: number
  sizeKB: number
  blur: number
  brightness: number
  contrast: number
  score: number
  issues: QualityIssue[]
}

export interface Business {
  name: string
  subtitle: string
  tagline: string
  minUnits: number
  instagram: string
  rubros: string
  footerNote: string
  backNote: string
}

export interface Product {
  id: string
  name: string
  line: string
  price: number
  minUnits: number
  details: string
  imageId: string | null
  quality: ImageQuality | null
  inCover: boolean
}

export type PdfLayout = 'single' | 'grid'

export interface Project {
  version: number
  business: Business
  products: Product[]
  layout: PdfLayout
  gridPerPage: 2 | 4
  updatedAt: number
}

export interface PdfImage {
  dataUrl: string
  width: number
  height: number
}
