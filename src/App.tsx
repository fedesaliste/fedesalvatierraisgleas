import { useCallback, useMemo, useState } from 'react'
import Caos from './scenes/Caos'
import { ACENTOS, mulberry32, seedFromUrl } from './engine/random'
import type { Obra } from './lib/obras'
import { BIO } from './data/manifiesto'

export default function App() {
  const rng = useMemo(() => {
    const r = mulberry32(seedFromUrl())
    document.documentElement.style.setProperty('--acento', r.pick(ACENTOS))
    return r
  }, [])
  const [sel, setSel] = useState<Obra | null>(null)
  const onSelect = useCallback((o: Obra) => setSel(o), [])

  return (
    <main className="relative h-full w-full">
      <Caos rng={rng} onSelect={onSelect} />

      {/* cabecera mínima: nombre y semilla de la visita */}
      <header className="pointer-events-none absolute left-4 top-4 z-[6000] select-none text-[11px] uppercase leading-tight tracking-wider md:left-6 md:top-5">
        <h1 className="font-display text-[clamp(1.3rem,3.2vw,2.6rem)] normal-case tracking-normal leading-[0.9]">
          {BIO.nombre}
        </h1>
        <p className="mt-1 opacity-70">
          {BIO.rotulo} · {BIO.origen}
        </p>
      </header>

      <footer className="pointer-events-none absolute bottom-4 left-4 right-4 z-[6000] flex items-end justify-between text-[11px] uppercase tracking-wider opacity-70 md:bottom-5 md:left-6 md:right-6">
        <span>
          visita #{rng.seed.toString(36)} ·{' '}
          <a className="pointer-events-auto underline" href={`?seed=${rng.seed}`}>
            repetir este azar
          </a>
        </span>
        <span className="hidden sm:inline">arrastrá · soltá · dejá que pase</span>
      </footer>

      {sel && (
        <div
          className="absolute inset-0 z-[7000] flex cursor-zoom-out items-center justify-center bg-papel/90 p-6 backdrop-blur-sm"
          onClick={() => setSel(null)}
        >
          <img
            src={`/obras/${sel.year}/${sel.id}-${sel.sizes[sel.sizes.length - 1]}.webp`}
            alt={sel.title ?? `Obra ${sel.year}`}
            className="max-h-[85vh] max-w-[90vw] object-contain drop-shadow-2xl"
          />
          <p className="absolute bottom-5 left-6 text-[11px] uppercase tracking-wider">
            {sel.title ?? 'sin título'} · {sel.year}
          </p>
        </div>
      )}
    </main>
  )
}
