import { Fragment, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32 } from '../engine/random'
import { dict, LANGS } from '../i18n/dict'

gsap.registerPlugin(ScrollTrigger)

const SEPARADORES = ['✶', '●', '↻', '■', '▲', '✕', '/', '◊'] as const

/**
 * Una cinta torcida que cruza la página con fragmentos del manifiesto en
 * todos los idiomas mezclados. El scroll la acelera.
 */
export default function Cinta({ seed }: { seed: number }) {
  const pistaRef = useRef<HTMLDivElement>(null)

  const c = useMemo(() => {
    const r = mulberry32(seed ^ 0xc1a7)
    const todas = LANGS.flatMap((l) => dict[l].fragmentos.map((f) => ({ f, l })))
    const ang = r.range(1.5, 5) * (r.chance(0.5) ? 1 : -1)
    return {
      items: r.shuffle(todas).slice(0, 12),
      ang,
      dur: r.range(55, 95),
      dir: r.chance(0.5) ? 'normal' : 'reverse',
      sep: r.pick(SEPARADORES),
    }
  }, [seed])

  // la velocidad del scroll empuja la cinta y después vuelve a su ritmo
  useEffect(() => {
    const anim = pistaRef.current?.getAnimations()[0]
    if (!anim) return
    const p = { v: 1 }
    const aplicar = () => (anim.playbackRate = p.v)
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        p.v = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 12)
        aplicar()
        gsap.to(p, { v: 1, duration: 1.2, ease: 'power2.out', overwrite: true, onUpdate: aplicar })
      },
    })
    return () => {
      st.kill()
      gsap.killTweensOf(p)
    }
  }, [c])

  const tramo = (k: number) =>
    c.items.map(({ f, l }, i) => (
      <Fragment key={`${k}-${i}`}>
        <span lang={l} className="font-display uppercase">
          {f}
        </span>
        <span className="mx-[0.6em] opacity-70" aria-hidden>
          {c.sep}
        </span>
      </Fragment>
    ))

  return (
    <div className="pointer-events-none relative z-20 -my-16 py-16" aria-hidden>
      <div
        className="cinta -ml-[10vw] w-[120vw] py-3 text-[clamp(1.3rem,3.2vw,2.5rem)] leading-none"
        style={{ transform: `rotate(${c.ang}deg)` }}
      >
        <div
          ref={pistaRef}
          className="cinta-pista"
          style={{ '--cinta-dur': `${c.dur}s`, '--cinta-dir': c.dir } as CSSProperties}
        >
          {tramo(0)}
          {tramo(1)}
        </div>
      </div>
    </div>
  )
}
