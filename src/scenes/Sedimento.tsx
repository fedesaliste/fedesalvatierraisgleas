import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { mulberry32, type Rng } from '../engine/random'
import { obras, srcSet, src, years, type Obra } from '../lib/obras'
import { useI18n } from '../i18n'

type Props = { rng: Rng; onSelect: (o: Obra) => void }

/**
 * Lo que quedó. Las obras que cayeron del caos se acumulan por año en una
 * grilla imperfecta: cada una aterrizó un poco torcida, un poco corrida.
 */
export default function Sedimento({ rng, onSelect }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { t } = useI18n()

  // desorden fijo por visita (derivado de la semilla, independiente del caos)
  const desorden = useMemo(() => {
    const r = mulberry32(rng.seed ^ 0x5ed1)
    return new Map(
      obras.map((o) => [
        o.id,
        {
          rot: r.range(-7, 7),
          dx: r.range(-10, 10),
          dy: r.range(-14, 14),
          span: r.chance(0.14) ? 2 : 1,
          orden: r.next(),
        },
      ]),
    )
  }, [rng.seed])

  // entrada: cada obra cae cuando entra a la vista. IntersectionObserver en vez de
  // ScrollTrigger.batch porque las imágenes lazy corren el layout y los triggers
  // quedaban desfasados para los años de más abajo.
  useEffect(() => {
    const root = ref.current!
    const r = mulberry32(rng.seed ^ 0xa11)
    const pendientes = new Set<HTMLElement>()
    let flush = 0
    const caer = () => {
      const batch = [...pendientes]
      pendientes.clear()
      if (!batch.length) return
      gsap.fromTo(
        batch,
        { y: () => -r.range(180, 420), rotate: () => r.range(-40, 40), opacity: 0 },
        {
          y: 0,
          rotate: (_i, el) => +(el as HTMLElement).dataset.rot!,
          opacity: 1,
          duration: () => r.range(0.7, 1.2),
          ease: 'back.out(1.4)',
          stagger: { each: 0.06, from: 'random' },
          overwrite: true,
        },
      )
    }
    const sinAnimar = new Set<HTMLElement>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          io.unobserve(e.target)
          sinAnimar.delete(e.target as HTMLElement)
          pendientes.add(e.target as HTMLElement)
        }
        // agrupar los que entraron juntos para que caigan en cascada
        clearTimeout(flush)
        flush = window.setTimeout(caer, 40)
      },
      { rootMargin: '0px 0px 5% 0px' },
    )
    const todos = [...root.querySelectorAll<HTMLElement>('.sed-item')]
    todos.forEach((el) => io.observe(el))

    todos.forEach((el) => sinAnimar.add(el))
    // si un salto de scroll dejó obras arriba sin haber pasado por la pantalla, mostrarlas sin más
    const onScroll = () => {
      for (const el of sinAnimar) {
        if (el.getBoundingClientRect().bottom < 0) {
          io.unobserve(el)
          sinAnimar.delete(el)
          gsap.set(el, { opacity: 1, y: 0, rotate: +el.dataset.rot! })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(flush)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [rng.seed])

  const nudge = (el: HTMLElement, base: number) => {
    gsap.to(el, {
      rotate: base + rng.range(-5, 5),
      x: `+=${rng.range(-6, 6)}`,
      y: `+=${rng.range(-6, 6)}`,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    })
  }

  return (
    <section ref={ref} className="relative z-10 min-h-screen bg-papel px-4 pb-32 pt-24 md:px-10">
      <header className="mb-16 flex items-end justify-between border-b border-tinta/30 pb-4">
        <h2 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.85] uppercase">{t.sedimento}</h2>
        <p className="text-[11px] uppercase tracking-wider opacity-70">
          {t.sedimentoSub} · {obras.length} {t.obra}s
        </p>
      </header>

      {years.map((y) => {
        const lista = obras
          .filter((o) => o.year === y)
          .sort((a, b) => desorden.get(a.id)!.orden - desorden.get(b.id)!.orden)
        return (
          <div key={y} className="mb-24">
            <div className="sticky top-4 z-20 mb-6 flex items-baseline gap-4">
              <span className="font-display text-[clamp(2rem,6vw,5rem)] leading-none" style={{ color: 'var(--acento)' }}>
                {y}
              </span>
              <span className="text-[11px] uppercase tracking-wider opacity-60">{lista.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {lista.map((o) => {
                const d = desorden.get(o.id)!
                return (
                  <figure
                    key={o.id}
                    className={`sed-item flex items-center justify-center ${d.span === 2 ? 'col-span-2 row-span-2' : ''}`}
                    data-rot={d.rot}
                    style={{
                      transform: `rotate(${d.rot}deg) translate(${d.dx}px, ${d.dy}px)`,
                      opacity: 0,
                      aspectRatio: o.ratio,
                    }}
                    onPointerEnter={(e) => nudge(e.currentTarget, d.rot)}
                    onClick={() => onSelect(o)}
                  >
                    <img
                      src={src(o, 480)}
                      srcSet={srcSet(o)}
                      sizes={d.span === 2 ? '(min-width:1280px) 40vw, 50vw' : '(min-width:1280px) 20vw, (min-width:640px) 33vw, 50vw'}
                      alt={o.title ?? `${t.obra} ${o.year}`}
                      loading="lazy"
                      className="max-h-[60vh] w-full object-contain"
                    />
                  </figure>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
