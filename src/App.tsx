import { useRef, useState } from 'react'
import { useProject } from './store/project'
import { exportBackup, parseBackup, downloadBlob } from './lib/backup'
import { BusinessStep } from './components/BusinessStep'
import { ProductsStep } from './components/ProductsStep'
import { CoverStep } from './components/CoverStep'
import { PreviewStep } from './components/PreviewStep'
import { Toast } from './components/ui'

type TabId = 'business' | 'products' | 'cover' | 'preview'

const TABS: { id: TabId; label: string; n: number }[] = [
  { id: 'business', label: 'Negocio', n: 1 },
  { id: 'products', label: 'Productos', n: 2 },
  { id: 'cover', label: 'Tapa', n: 3 },
  { id: 'preview', label: 'PDF', n: 4 }
]

export default function App() {
  const { ready, project, imageUrls, saveState, replaceProject, clearAll } = useProject()
  const [tab, setTab] = useState<TabId>('business')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'neutral' | 'good' | 'bad' } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const notify = (msg: string, tone: 'neutral' | 'good' | 'bad' = 'neutral') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 3000)
  }

  const onExport = async () => {
    setMenuOpen(false)
    try {
      const blob = await exportBackup(project, imageUrls)
      downloadBlob(blob, 'copia-catalogo.json')
      notify('Copia descargada', 'good')
    } catch {
      notify('No se pudo crear la copia', 'bad')
    }
  }

  const onImportFile = async (file: File | null) => {
    if (!file) return
    try {
      const { project: p, images } = await parseBackup(file)
      await replaceProject(p, images)
      notify('Copia restaurada', 'good')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo restaurar', 'bad')
    }
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-serif text-lg text-nude-500">Cargando tu catálogo…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col">
      <header className="sticky top-0 z-40 border-b border-nude-200 bg-nude-100/85 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg font-bold text-nude-700">
              {project.business.name || 'Catálogo Mayorista'}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-nude-400">
              <span
                className={`inline-block h-2 w-2 rounded-full ${saveState === 'saved' ? 'bg-emerald-500' : 'bg-amber-400'}`}
              />
              {saveState === 'saved' ? 'Guardado' : 'Guardando…'}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl border border-nude-300 bg-white px-3 py-2 text-sm font-semibold text-nude-600 transition hover:bg-nude-50"
            >
              Copia de seguridad
            </button>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-nude-200 bg-white shadow-soft">
                  <button
                    onClick={onExport}
                    className="block w-full px-4 py-2.5 text-left text-sm text-nude-700 transition hover:bg-nude-100"
                  >
                    Descargar copia
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      importRef.current?.click()
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-nude-700 transition hover:bg-nude-100"
                  >
                    Restaurar copia
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      if (confirm('¿Borrar todo y empezar de cero? Esta acción no se puede deshacer.')) {
                        void clearAll().then(() => notify('Todo borrado'))
                      }
                    }}
                    className="block w-full border-t border-nude-200 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Borrar todo
                  </button>
                </div>
              </>
            ) : null}
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                void onImportFile(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? 'bg-nude-600 text-white shadow-soft' : 'text-nude-500 hover:bg-nude-200/60'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  tab === t.id ? 'bg-white/25' : 'bg-nude-200'
                }`}
              >
                {t.n}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-4 py-5">
        {tab === 'business' ? <BusinessStep /> : null}
        {tab === 'products' ? <ProductsStep /> : null}
        {tab === 'cover' ? <CoverStep /> : null}
        {tab === 'preview' ? <PreviewStep /> : null}
      </main>

      <footer className="px-4 pb-8 pt-2 text-center text-xs text-nude-400">
        Todo se guarda en este dispositivo. Hacé una copia de seguridad de vez en cuando.
      </footer>

      {toast ? <Toast message={toast.msg} tone={toast.tone === 'bad' ? 'bad' : toast.tone} /> : null}
    </div>
  )
}
