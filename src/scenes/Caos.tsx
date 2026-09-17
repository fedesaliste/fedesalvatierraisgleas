import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { crearCaos, type Caos as CaosEngine } from '../engine/caos'
import type { Rng } from '../engine/random'
import { obras, type Obra } from '../lib/obras'
import { FRAGMENTOS } from '../data/manifiesto'

type Props = { rng: Rng; onSelect: (o: Obra) => void }

export default function Caos({ rng, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const fragRef = useRef<HTMLDivElement>(null)
  const [frag, setFrag] = useState<string | null>(null)

  useEffect(() => {
    const el = ref.current!
    const caos: CaosEngine = crearCaos({ container: el, rng, obras, onSelect })

    // entrada: algunas obras irrumpen, sin orden, a ritmo irregular
    const inicial = rng.int(7, 11)
    const timers: number[] = []
    let t = 300
    for (let i = 0; i < inicial; i++) {
      timers.push(window.setTimeout(() => caos.irrumpir(), t))
      t += rng.range(120, 700)
    }

    // el sitio muta solo
    let alive = true
    const mutar = () => {
      if (!alive) return
      const n = caos.bodies().length
      const r = rng.next()
      if (n < 6 || (r < 0.35 && n < 16)) caos.irrumpir()
      else if (r < 0.6) caos.impulso()
      else if (r < 0.72) caos.retirar()
      else if (r < 0.78) caos.vuelco()
      else if (r < 0.9) setFrag(rng.pick(FRAGMENTOS))
      else caos.irrumpir()
      timers.push(window.setTimeout(mutar, rng.range(2500, 7000)))
    }
    timers.push(window.setTimeout(mutar, 4000))

    return () => {
      alive = false
      timers.forEach(clearTimeout)
      caos.destroy()
    }
  }, [rng, onSelect])

  // un fragmento del manifiesto aparece en un lugar cualquiera y se va
  useEffect(() => {
    if (!frag || !fragRef.current) return
    const el = fragRef.current
    gsap.killTweensOf(el)
    gsap.set(el, {
      left: `${rng.range(4, 55)}vw`,
      top: `${rng.range(8, 80)}vh`,
      rotate: rng.range(-6, 6),
      opacity: 0,
      y: 12,
    })
    const tl = gsap.timeline({ onComplete: () => setFrag(null) })
    tl.to(el, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' })
      .to(el, { opacity: 0, duration: 0.5, ease: 'power2.in' }, `+=${rng.range(2.2, 4)}`)
    return () => {
      tl.kill()
    }
  }, [frag, rng])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden touch-none">
      {frag && (
        <div
          ref={fragRef}
          className="pointer-events-none absolute z-[5000] max-w-[70vw] font-display text-[clamp(1.6rem,5vw,4.5rem)] leading-[0.95] uppercase"
          style={{ color: 'var(--acento)', mixBlendMode: 'multiply' }}
        >
          {frag}
        </div>
      )}
    </div>
  )
}
