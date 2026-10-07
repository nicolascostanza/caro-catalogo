import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Business, Product, Project } from '../types'
import { uid } from '../lib/format'
import { analyzeImage } from '../lib/imageQuality'
import { processImage } from '../lib/imageUtils'
import * as db from './db'

const PROJECT_VERSION = 1

export function defaultBusiness(): Business {
  return {
    name: 'AURA JAZMÍN',
    subtitle: 'CATÁLOGO MAYORISTA · AROMAS PARA TU NEGOCIO',
    tagline: 'Aromas que transforman espacios',
    minUnits: 12,
    instagram: '@aura_jazmin_',
    rubros:
      'Sahumerios · Perfumes textiles · Difusores · Aromatizantes · Hornitos · Velas · Esencias · Humificadores · Repuestos y más',
    footerNote: 'Venta mayorista · desde 12 unidades',
    backNote: 'Consultá disponibilidad, combinaciones y próximos ingresos.'
  }
}

export function defaultProject(): Project {
  return {
    version: PROJECT_VERSION,
    business: defaultBusiness(),
    products: [],
    layout: 'single',
    gridPerPage: 2,
    updatedAt: Date.now()
  }
}

export function emptyProduct(minUnits: number): Product {
  return {
    id: uid(),
    name: '',
    line: '',
    price: 0,
    minUnits,
    details: '',
    imageId: null,
    quality: null,
    inCover: false
  }
}

interface ProjectContextValue {
  ready: boolean
  project: Project
  imageUrls: Record<string, string>
  saveState: 'saved' | 'saving'
  updateBusiness: (patch: Partial<Business>) => void
  setLayout: (layout: Project['layout'], gridPerPage?: Project['gridPerPage']) => void
  addProduct: () => string
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProduct: (id: string) => void
  moveProduct: (id: string, dir: -1 | 1) => void
  setProductImage: (id: string, file: File | null) => Promise<void>
  replaceProject: (project: Project, images: Record<string, Blob>) => Promise<void>
  clearAll: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(defaultProject)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const urlsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await db.loadProject()
      if (cancelled) return
      setProject(stored ? { ...defaultProject(), ...stored, business: { ...defaultBusiness(), ...stored.business } } : defaultProject())

      const keys = await db.allImageKeys()
      const urls: Record<string, string> = {}
      for (const key of keys) {
        const blob = await db.getImage(String(key))
        if (blob) urls[String(key)] = URL.createObjectURL(blob)
      }
      if (cancelled) return
      urlsRef.current = urls
      setImageUrls(urls)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    setSaveState('saving')
    const t = setTimeout(() => {
      db.saveProject({ ...project, updatedAt: Date.now() }).then(() => setSaveState('saved'))
    }, 400)
    return () => clearTimeout(t)
  }, [project, ready])

  const patch = useCallback((updater: (p: Project) => Project) => {
    setProject((prev) => updater(prev))
  }, [])

  const updateBusiness = useCallback(
    (p: Partial<Business>) => patch((prev) => ({ ...prev, business: { ...prev.business, ...p } })),
    [patch]
  )

  const setLayout = useCallback(
    (layout: Project['layout'], gridPerPage?: Project['gridPerPage']) =>
      patch((prev) => ({ ...prev, layout, gridPerPage: gridPerPage ?? prev.gridPerPage })),
    [patch]
  )

  const addProduct = useCallback(() => {
    const p = emptyProduct(project.business.minUnits)
    patch((prev) => ({ ...prev, products: [...prev.products, p] }))
    return p.id
  }, [patch, project.business.minUnits])

  const updateProduct = useCallback(
    (id: string, p: Partial<Product>) =>
      patch((prev) => ({
        ...prev,
        products: prev.products.map((item) => (item.id === id ? { ...item, ...p } : item))
      })),
    [patch]
  )

  const removeProduct = useCallback(
    (id: string) => {
      patch((prev) => ({ ...prev, products: prev.products.filter((item) => item.id !== id) }))
      const url = urlsRef.current[id]
      if (url) {
        URL.revokeObjectURL(url)
        delete urlsRef.current[id]
        setImageUrls({ ...urlsRef.current })
      }
      void db.deleteImage(id)
    },
    [patch]
  )

  const moveProduct = useCallback(
    (id: string, dir: -1 | 1) =>
      patch((prev) => {
        const idx = prev.products.findIndex((p) => p.id === id)
        const target = idx + dir
        if (idx < 0 || target < 0 || target >= prev.products.length) return prev
        const next = [...prev.products]
        const [item] = next.splice(idx, 1)
        next.splice(target, 0, item)
        return { ...prev, products: next }
      }),
    [patch]
  )

  const setProductImage = useCallback(
    async (id: string, file: File | null) => {
      const existingUrl = urlsRef.current[id]
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl)
        delete urlsRef.current[id]
      }
      if (!file) {
        setImageUrls({ ...urlsRef.current })
        updateProduct(id, { imageId: null, quality: null })
        void db.deleteImage(id)
        return
      }
      const [processed, quality] = await Promise.all([processImage(file), analyzeImage(file)])
      await db.putImage(id, processed.blob)
      const url = URL.createObjectURL(processed.blob)
      urlsRef.current[id] = url
      setImageUrls({ ...urlsRef.current })
      updateProduct(id, { imageId: id, quality })
    },
    [updateProduct]
  )

  const replaceProject = useCallback(
    async (next: Project, images: Record<string, Blob>) => {
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url)
      const urls: Record<string, string> = {}
      const d = await db.allImageKeys()
      for (const key of d) await db.deleteImage(String(key))
      for (const [key, blob] of Object.entries(images)) {
        await db.putImage(key, blob)
        urls[key] = URL.createObjectURL(blob)
      }
      urlsRef.current = urls
      setImageUrls(urls)
      setProject({ ...defaultProject(), ...next, business: { ...defaultBusiness(), ...next.business } })
    },
    []
  )

  const clearAll = useCallback(async () => {
    for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url)
    urlsRef.current = {}
    setImageUrls({})
    await db.clearAll()
    setProject(defaultProject())
  }, [])

  const value = useMemo<ProjectContextValue>(
    () => ({
      ready,
      project,
      imageUrls,
      saveState,
      updateBusiness,
      setLayout,
      addProduct,
      updateProduct,
      removeProduct,
      moveProduct,
      setProductImage,
      replaceProject,
      clearAll
    }),
    [
      ready,
      project,
      imageUrls,
      saveState,
      updateBusiness,
      setLayout,
      addProduct,
      updateProduct,
      removeProduct,
      moveProduct,
      setProductImage,
      replaceProject,
      clearAll
    ]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject debe usarse dentro de ProjectProvider')
  return ctx
}
