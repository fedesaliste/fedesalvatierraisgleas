import { useCallback, useMemo, useRef, useState } from 'react'
import Caos from './scenes/Caos'
import Sedimento from './scenes/Sedimento'
import Manifiesto from './scenes/Manifiesto'
import Bio from './scenes/Bio'
import LangSwitch from './components/LangSwitch'
import Detalle from './components/Detalle'
import { ACENTOS, mulberry32, seedFromUrl } from './engine/random'
import type { Obra } from './lib/obras'
import { BIO } from './data/manifiesto'
import { I18nProvider, useI18n } from './i18n'

function Sitio() {
  const rng = useMemo(() => {
    const r = mulberry32(seedFromUrl())
    document.documentElement.style.setProperty('--acento', r.pick(ACENTOS))
    return r
  }, [])
  const { t } = useI18n()
  const [sel, setSel] = useState<Obra | null>(null)
  const onSelect = useCallback((o: Obra) => setSel(o), [])
  const onClose = useCallback(() => setSel(null), [])
  const caosSection = useRef<HTMLElement>(null)

  return (
    <>
      <LangSwitch />

      {/* CAOS: 300vh de scroll durante los cuales el mundo se sacude y al final se cae */}
      <section ref={caosSection} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Caos rng={rng} onSelect={onSelect} trigger={caosSection} />

          <header className="pointer-events-none absolute left-4 top-4 z-[6000] select-none text-[11px] uppercase leading-tight tracking-wider md:left-6 md:top-5">
            <h1 className="font-display text-[clamp(1.3rem,3.2vw,2.6rem)] normal-case leading-[0.9] tracking-normal">
              {BIO.nombre}
            </h1>
            <p className="mt-1 opacity-70">
              {t.rotulo} · {t.origen}
            </p>
          </header>

          <footer className="pointer-events-none absolute bottom-4 left-4 right-4 z-[6000] flex items-end justify-between text-[11px] uppercase tracking-wider opacity-70 md:bottom-5 md:left-6 md:right-6">
            <span>
              {t.visita} #{rng.seed.toString(36)} ·{' '}
              <a className="pointer-events-auto underline" href={`?seed=${rng.seed}`}>
                {t.repetir}
              </a>
            </span>
            <span className="hidden sm:inline">
              {t.hint} · <span style={{ color: 'var(--acento)' }}>{t.scrollHint} ↓</span>
            </span>
          </footer>
        </div>
      </section>

      <Sedimento rng={rng} onSelect={onSelect} />
      <Manifiesto rng={rng} />
      <Bio rng={rng} />

      {sel && <Detalle obra={sel} onClose={onClose} />}
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Sitio />
    </I18nProvider>
  )
}
