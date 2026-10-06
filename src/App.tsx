import { useCallback, useMemo, useRef, useState } from 'react'
import Caos from './scenes/Caos'
import Luz from './scenes/Luz'
import Sedimento from './scenes/Sedimento'
import Manifiesto from './scenes/Manifiesto'
import Bio from './scenes/Bio'
import LangSwitch from './components/LangSwitch'
import Detalle from './components/Detalle'
import Textura from './components/Textura'
import TextoAzar from './components/TextoAzar'
import Cinta from './components/Cinta'
import { ACENTOS, mulberry32, PAPELES, seedFromUrl, semillaNueva, TINTAS } from './engine/random'
import type { Obra } from './lib/obras'
import { BIO } from './data/manifiesto'
import { I18nProvider, langDeSemilla, useI18n } from './i18n'

function Sitio({ seed, setSeed }: { seed: number; setSeed: (s: number) => void }) {
  // la paleta de la visita: acento, papel y tinta salen de la semilla. el acento
  // se saca del rng principal en el mismo memo que lo crea (como siempre), así
  // el caos de cada ?seed=N sigue siendo el mismo
  const { rng, acento } = useMemo(() => {
    const r = mulberry32(seed)
    return { rng: r, acento: r.pick(ACENTOS) }
  }, [seed])
  const paleta = useMemo(() => {
    const r = mulberry32(seed ^ 0x9a9e)
    const papel = r.pick(PAPELES)
    const tinta = r.pick(TINTAS)
    const s = document.documentElement.style
    s.setProperty('--acento', acento)
    s.setProperty('--color-papel', papel)
    s.setProperty('--color-tinta', tinta)
    // la cinta cae en un lugar distinto cada vez
    const cinta = r.int(0, 2)
    return { acento, cinta }
  }, [acento, seed])

  const { t, lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang
  // otro azar es otro todo: también otro idioma (nunca el mismo que ya estaba)
  const onOtroAzar = useCallback(() => {
    let nuevo = semillaNueva()
    while (langDeSemilla(nuevo) === langRef.current) nuevo = (nuevo + 1) >>> 0
    const url = new URL(location.href)
    url.searchParams.set('seed', String(nuevo))
    url.searchParams.delete('lang')
    history.replaceState(null, '', url)
    setSeed(nuevo)
  }, [setSeed])
  const [sel, setSel] = useState<Obra | null>(null)
  const onSelect = useCallback((o: Obra) => setSel(o), [])
  const onClose = useCallback(() => setSel(null), [])
  const caosSection = useRef<HTMLElement>(null)
  const repetir = `?seed=${rng.seed}&lang=${lang}`

  return (
    <div className="relative">
      <Textura seed={seed} acento={paleta.acento} />
      <LangSwitch />

      {/* CAOS: 300vh de scroll durante los cuales el mundo se sacude y al final se cae */}
      <section ref={caosSection} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <Caos rng={rng} onSelect={onSelect} onOtroAzar={onOtroAzar} trigger={caosSection} />

          <header className="pointer-events-none absolute left-4 top-4 z-[6000] select-none text-[11px] uppercase leading-tight tracking-wider md:left-6 md:top-5">
            <TextoAzar
              as="h1"
              texto={BIO.nombre}
              seed={seed}
              vivo
              className="font-display text-[clamp(1.3rem,3.2vw,2.6rem)] uppercase leading-[0.9] tracking-normal"
            />
            <p className="mt-1 opacity-70">
              {t.rotulo} · {t.origen}
            </p>
          </header>

          <footer className="pointer-events-none absolute bottom-4 left-4 right-4 z-[6000] flex items-end justify-between text-[11px] uppercase tracking-wider opacity-70 md:bottom-5 md:left-6 md:right-6">
            <span>
              {t.visita} #{rng.seed.toString(36)} ·{' '}
              <a className="pointer-events-auto underline" href={repetir}>
                {t.repetir}
              </a>
            </span>
            <span className="hidden sm:inline">
              {t.hint} · <span style={{ color: 'var(--acento)' }}>{t.scrollHint} ↓</span>
            </span>
          </footer>
        </div>
      </section>

      <Luz rng={rng} onSelect={onSelect} />
      {paleta.cinta === 0 && <Cinta seed={seed} />}
      <Sedimento rng={rng} onSelect={onSelect} />
      {paleta.cinta === 1 && <Cinta seed={seed} />}
      <Manifiesto rng={rng} />
      {paleta.cinta === 2 && <Cinta seed={seed} />}
      <Bio rng={rng} repetir={repetir} />

      {sel && <Detalle obra={sel} onClose={onClose} />}
    </div>
  )
}

export default function App() {
  const [seed, setSeed] = useState(seedFromUrl)
  return (
    <I18nProvider seed={seed}>
      <Sitio seed={seed} setSeed={setSeed} />
    </I18nProvider>
  )
}
