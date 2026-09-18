import { useEffect, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { crearCaos, type Caos as CaosEngine } from '../engine/caos'
import type { Rng } from '../engine/random'
import { obras, type Obra } from '../lib/obras'
import { useI18n } from '../i18n'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  rng: Rng
  onSelect: (o: Obra) => void
  /** la sección alta que define cuánto scroll dura el caos */
  trigger: RefObject<HTMLElement | null>
}

export default function Caos({ rng, onSelect, trigger }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const fragRef = useRef<HTMLDivElement>(null)
  const [frag, setFrag] = useState<string | null>(null)
  const { t } = useI18n()
  const fragsRef = useRef(t.fragmentos)
  fragsRef.current = t.fragmentos
  const activo = useRef(true)

  useEffect(() => {
    const el = ref.current!
    const caos: CaosEngine = crearCaos({ container: el, rng, obras, onSelect })

    // entrada: algunas obras irrumpen, sin orden, a ritmo irregular
    const inicial = rng.int(7, 11)
    const timers: number[] = []
    let t0 = 300
    for (let i = 0; i < inicial; i++) {
      timers.push(window.setTimeout(() => caos.irrumpir(), t0))
      t0 += rng.range(120, 700)
    }

    // el sitio muta solo (mientras el caos esté a la vista)
    let alive = true
    const mutar = () => {
      if (!alive) return
      if (activo.current) {
        const n = caos.count()
        const r = rng.next()
        if (n < 6 || (r < 0.35 && n < 16)) caos.irrumpir()
        else if (r < 0.6) caos.impulso()
        else if (r < 0.72) caos.retirar()
        else if (r < 0.78) caos.vuelco()
        else if (r < 0.9) setFrag(rng.pick(fragsRef.current))
        else caos.irrumpir()
      }
      timers.push(window.setTimeout(mutar, rng.range(2500, 7000)))
    }
    timers.push(window.setTimeout(mutar, 4000))

    // el scroll es energía: sacude, inclina la gravedad y al final abre el piso
    let ultimoV = 0
    const st = ScrollTrigger.create({
      trigger: trigger.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const v = self.getVelocity()
        const p = self.progress
        if (Math.abs(v - ultimoV) > 50) caos.sacudir(v)
        ultimoV = v
        caos.inclinar(v / 2500, p > 0.7 ? 1.6 : 0.9)
        if (p > 0.7) caos.abrirPiso()
        else if (caos.count() < 5 && p < 0.6) {
          caos.cerrarPiso()
          if (rng.chance(0.3)) caos.irrumpir()
        } else caos.cerrarPiso()
        activo.current = p < 0.7
        gsap.set(el, { opacity: p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1 })
      },
    })

    return () => {
      alive = false
      timers.forEach(clearTimeout)
      st.kill()
      caos.destroy()
    }
  }, [rng, onSelect, trigger])

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
    tl.to(el, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }).to(
      el,
      { opacity: 0, duration: 0.5, ease: 'power2.in' },
      `+=${rng.range(2.2, 4)}`,
    )
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
