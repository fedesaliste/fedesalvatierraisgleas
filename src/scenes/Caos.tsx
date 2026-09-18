import { useEffect, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { crearCaos, type Caos as CaosEngine } from '../engine/caos'
import type { Rng } from '../engine/random'
import { obras, type Obra } from '../lib/obras'
import { useI18n } from '../i18n'
import BotonAzar from '../components/BotonAzar'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  rng: Rng
  onSelect: (o: Obra) => void
  /** el visitante pide otro azar: todo se repele del centro y vuelve a empezar con otra semilla */
  onOtroAzar: () => void
  /** la sección alta que define cuánto scroll dura el caos */
  trigger: RefObject<HTMLElement | null>
}

export default function Caos({ rng, onSelect, onOtroAzar, trigger }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const fragRef = useRef<HTMLDivElement>(null)
  const [frag, setFrag] = useState<string | null>(null)
  const { t } = useI18n()
  const fragsRef = useRef(t.fragmentos)
  fragsRef.current = t.fragmentos
  const activo = useRef(true)
  const botonBody = useRef<{ caos: CaosEngine; body: import('matter-js').Body } | null>(null)

  useEffect(() => {
    const el = ref.current!
    const caos: CaosEngine = crearCaos({ container: el, rng, obras, onSelect })

    // entrada: una lluvia de obras, sin orden, a ritmo irregular
    const inicial = rng.int(12, 17)
    const timers: number[] = []
    let t0 = 150
    for (let i = 0; i < inicial; i++) {
      timers.push(window.setTimeout(() => caos.irrumpir(), t0))
      t0 += rng.range(60, 320)
    }

    // el botón de "otro azar" también cae, como un cuerpo más
    let alive = true
    const boton = botonRef.current!
    let explotando = false
    timers.push(
      window.setTimeout(() => {
        boton.style.visibility = 'visible'
        botonBody.current = { caos, body: caos.agregarElemento(boton, { density: 0.006, restitution: 0.5 }) }
      }, t0 + rng.range(400, 1200)),
    )
    let down: { x: number; y: number; t: number } | null = null
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY, t: performance.now() })
    const onUp = async (e: PointerEvent) => {
      if (!down || explotando) return
      const d = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      const dt = performance.now() - down.t
      down = null
      if (d > 8 || dt > 400) return
      explotando = true
      alive = false
      boton.style.pointerEvents = 'none'
      await caos.explotar()
      onOtroAzar()
    }
    boton.addEventListener('pointerdown', onDown)
    boton.addEventListener('pointerup', onUp)

    // el sitio muta solo (mientras el caos esté a la vista)
    const mutar = () => {
      if (!alive) return
      if (activo.current) {
        const n = caos.count()
        const r = rng.next()
        if (n < 8 || (r < 0.4 && n < 20)) caos.irrumpir()
        else if (r < 0.6) caos.impulso()
        else if (r < 0.72) caos.retirar()
        else if (r < 0.78) caos.vuelco()
        else if (r < 0.9) setFrag(rng.pick(fragsRef.current))
        else caos.irrumpir()
      }
      timers.push(window.setTimeout(mutar, rng.range(1800, 5000)))
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
      boton.removeEventListener('pointerdown', onDown)
      boton.removeEventListener('pointerup', onUp)
      st.kill()
      botonBody.current = null
      caos.destroy()
      // el botón vuelve al DOM de React para la próxima ronda
      boton.style.cssText = ''
      boton.style.visibility = 'hidden'
      boton.classList.remove('obra-body')
      ref.current?.appendChild(boton)
    }
  }, [rng, onSelect, onOtroAzar, trigger])

  // cambió el idioma: el botón cambia de ancho y su cuerpo físico lo sigue
  useEffect(() => {
    const id = window.setTimeout(() => {
      const b = botonBody.current
      if (b) b.caos.redimensionar(b.body)
    }, 50)
    return () => clearTimeout(id)
  }, [t.otroAzar])

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
    <div ref={ref} className="absolute inset-0 overflow-hidden touch-pan-y">
      <BotonAzar ref={botonRef} texto={t.otroAzar} rng={rng} />
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
