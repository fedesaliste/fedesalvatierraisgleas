import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, type Rng } from '../engine/random'
import { useI18n } from '../i18n'

gsap.registerPlugin(ScrollTrigger)

/** Las palabras caen en desorden y se acomodan solas. */
export default function Manifiesto({ rng }: { rng: Rng }) {
  const ref = useRef<HTMLElement>(null)
  const { t, lang } = useI18n()

  // la puesta también es azar: sangría, alineación, inclinación y qué línea se lleva el acento
  const n = t.statement.length
  const puesta = useMemo(() => {
    const r = mulberry32(rng.seed ^ 0x3a20)
    return {
      acento: r.int(0, n - 1),
      lineas: Array.from({ length: n }, () => ({
        sangria: r.pick([0, 0, r.range(6, 20), r.range(20, 36)]),
        derecha: r.chance(0.2),
        giro: r.range(-1.6, 1.6),
      })),
    }
  }, [rng.seed, n])

  // al pasar, la palabra se sobresalta
  const saltar = (el: HTMLElement) => {
    if (gsap.isTweening(el)) return
    gsap.fromTo(
      el,
      { y: gsap.utils.random(-28, -10), rotate: gsap.utils.random(-14, 14) },
      { y: 0, rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)' },
    )
  }

  useEffect(() => {
    const root = ref.current!
    const r = mulberry32(rng.seed ^ 0x3a1f)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.linea', root).forEach((linea) => {
        const palabras = linea.querySelectorAll<HTMLElement>('.palabra')
        gsap.fromTo(
          palabras,
          {
            x: () => r.range(-160, 160),
            y: () => r.range(-120, 60),
            rotate: () => r.range(-30, 30),
            opacity: 0,
          },
          {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'expo.out',
            stagger: { each: 0.05, from: 'random' },
            scrollTrigger: { trigger: linea, start: 'top 85%', once: true },
          },
        )
      })
    }, root)
    return () => ctx.revert()
  }, [rng.seed, lang])

  // japonés no separa con espacios: partimos por carácter en grupos cortos
  const split = (s: string) =>
    lang === 'ja' ? (s.match(/.{1,3}/g) ?? [s]) : s.split(' ')

  return (
    <section ref={ref} className="relative z-10 min-h-screen bg-tinta px-4 py-32 text-papel md:px-10">
      <p className="mb-16 text-[11px] uppercase tracking-wider opacity-60">{t.manifiesto}</p>
      <div className="max-w-6xl space-y-12">
        {t.statement.map((linea, i) => (
          <p
            key={i}
            className={`linea font-display uppercase leading-[0.95] md:ml-[var(--sangria)] ${
              i === 0 ? 'text-[clamp(2.6rem,8vw,7.5rem)]' : 'text-[clamp(1.5rem,4vw,3.6rem)]'
            } ${puesta.lineas[i].derecha ? 'md:text-right' : ''}`}
            style={{
              color: i === puesta.acento ? 'var(--acento)' : undefined,
              rotate: `${puesta.lineas[i].giro}deg`,
              ['--sangria' as string]: `${puesta.lineas[i].sangria}%`,
            }}
          >
            {split(linea).map((w, j) => (
              <span key={j} className="palabra" onPointerEnter={(e) => saltar(e.currentTarget)}>
                {w}
                {lang === 'ja' ? '' : ' '}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  )
}
