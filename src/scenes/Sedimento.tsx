import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { mulberry32, type Rng } from '../engine/random'
import { obras, srcSet, src, years, type Obra } from '../lib/obras'
import { useI18n } from '../i18n'
import { arrastrable } from '../engine/empujes'
import TextoAzar from '../components/TextoAzar'

type Props = { rng: Rng; onSelect: (o: Obra) => void }

/**
 * Lo que quedó. Las obras que cayeron del caos se acumulan por año en una
 * grilla imperfecta: cada una aterrizó un poco torcida, un poco corrida.
 */
export default function Sedimento({ rng, onSelect }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { t } = useI18n()

  // desorden fijo por visita (derivado de la semilla, independiente del caos).
  // el giro y el corrimiento son chicos a propósito: cada obra vive en su celda
  // con un margen (ver .sed-item) que alcanza para torcerse sin pisar a la vecina
  const desorden = useMemo(() => {
    const r = mulberry32(rng.seed ^ 0x5ed1)
    return new Map(
      obras.map((o) => [
        o.id,
        {
          rot: r.range(-3.5, 3.5),
          dx: r.range(-4, 4),
          dy: r.range(-5, 5),
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
    const encoladas = new WeakSet<HTMLElement>()
    let flush = 0
    const caer = () => {
      // en orden de lectura (fila por fila, de izquierda a derecha), con un poco
      // de desorden en el tiempo: una cascada continua, no un bloque
      const batch = [...pendientes].sort((a, b) => {
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        return Math.abs(ra.top - rb.top) > 40 ? ra.top - rb.top : ra.left - rb.left
      })
      pendientes.clear()
      batch.forEach((el, i) => {
        const at = i * 0.075 + r.range(0, 0.05)
        const rot = +el.dataset.rot!
        const dy = +el.dataset.dy!
        // cae poco y aterriza suave: sin rebote, el movimiento se apaga solo
        gsap.fromTo(
          el,
          { y: dy - r.range(60, 110), rotate: rot + r.range(-12, 12), scale: 0.96 },
          {
            y: dy,
            rotate: rot,
            scale: 1,
            duration: r.range(1.1, 1.5),
            ease: 'expo.out',
            delay: at,
            // recién cuando aterrizó se la puede agarrar
            onComplete: () => void (el.dataset.cayo = '1'),
          },
        )
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.out', delay: at })
      })
    }
    // agrupar los que entraron juntos para que caigan en cascada
    const programar = () => {
      clearTimeout(flush)
      flush = window.setTimeout(caer, 60)
    }
    // no dejar caer una obra hasta que su imagen esté decodificada: si no,
    // la imagen lazy aparece a medio cargar (cortada) mientras ya se ve
    const encolar = (el: HTMLElement) => {
      const img = el.querySelector('img')
      // una sola vez por obra: si la imagen llega después del plazo de abajo,
      // no tiene que volver a caer
      const listo = () => {
        if (encoladas.has(el)) return
        encoladas.add(el)
        pendientes.add(el)
        programar()
      }
      if (!img || (img.complete && img.naturalWidth > 0)) return listo()
      const p = img.complete ? Promise.resolve() : new Promise<void>((res) => {
        img.addEventListener('load', () => res(), { once: true })
        img.addEventListener('error', () => res(), { once: true })
      })
      p.then(() => img.decode().catch(() => {})).then(listo)
      // de última, que caiga igual aunque la imagen no llegue
      window.setTimeout(listo, 2500)
    }
    const sinAnimar = new Set<HTMLElement>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          io.unobserve(e.target)
          const el = (e.target as HTMLElement).querySelector<HTMLElement>('.sed-obra')!
          sinAnimar.delete(el)
          encolar(el)
        }
      },
      // cae cuando ya se ve, no antes: si no, la mitad del movimiento pasa fuera de pantalla
      { rootMargin: '0px 0px -6% 0px' },
    )
    // y las imágenes se piden bastante antes de que lleguen, así cuando entran ya están
    const pedir = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          pedir.unobserve(e.target)
          const img = e.target.querySelector('img')
          if (img) img.loading = 'eager'
        }
      },
      { rootMargin: '0px 0px 120% 0px' },
    )
    const figs = [...root.querySelectorAll<HTMLElement>('.sed-item')]
    figs.forEach((f) => {
      io.observe(f)
      pedir.observe(f)
      sinAnimar.add(f.querySelector<HTMLElement>('.sed-obra')!)
    })
    // si un salto de scroll dejó obras arriba sin haber pasado por la pantalla, mostrarlas sin más
    const onScroll = () => {
      for (const el of sinAnimar) {
        if (el.getBoundingClientRect().bottom < 0) {
          io.unobserve(el.parentElement!)
          sinAnimar.delete(el)
          encoladas.add(el)
          el.dataset.cayo = '1'
          gsap.set(el, { opacity: 1, y: +el.dataset.dy!, scale: 1, rotate: +el.dataset.rot! })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const soltarArrastre = arrastrable(root)
    return () => {
      soltarArrastre()
      clearTimeout(flush)
      io.disconnect()
      pedir.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [rng.seed])

  // al pasar se acomoda distinto, pero siempre alrededor de su lugar (no se va
  // corriendo de a poco hasta pisar a la de al lado)
  const nudge = (el: HTMLElement, d: { rot: number; dx: number; dy: number }) => {
    // si ya la movieron a mano (o la chocaron), se queda donde quedó
    if (gsap.isTweening(el) || el.dataset.movida || el.dataset.cayo !== '1') return
    gsap.to(el, {
      rotate: d.rot + rng.range(-3, 3),
      x: d.dx + rng.range(-4, 4),
      y: d.dy + rng.range(-6, 2),
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    })
  }

  return (
    <section ref={ref} className="relative z-10 min-h-screen bg-papel px-4 pb-32 pt-24 md:px-10">
      <header className="mb-16 border-b border-tinta/30 pb-4">
        <div className="flex items-end justify-between gap-6">
          <TextoAzar
            as="h2"
            texto={t.sedimento}
            seed={rng.seed ^ 0x5ed}
            className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.85] uppercase"
          />
          <p className="text-[11px] uppercase tracking-wider opacity-70">
            {t.sedimentoSub} · {obras.length} {t.obras}
          </p>
        </div>
        {/* todos los años con obra, de un vistazo: cada uno baja a su bloque */}
        <nav className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          {years.map((y) => (
            <a
              key={y}
              href={`#anio-${y}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(`anio-${y}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="font-display text-[clamp(1.1rem,2.6vw,2rem)] leading-none opacity-45 transition-opacity duration-300 hover:opacity-100"
              style={{ color: 'var(--acento)' }}
            >
              {y}
              <sup className="ml-1 font-sans text-[9px] tracking-wider opacity-70">
                {obras.filter((o) => o.year === y).length}
              </sup>
            </a>
          ))}
        </nav>
      </header>

      {years.map((y) => {
        const lista = obras
          .filter((o) => o.year === y)
          .sort((a, b) => desorden.get(a.id)!.orden - desorden.get(b.id)!.orden)
        return (
          <div key={y} id={`anio-${y}`} className="mb-24 scroll-mt-4">
            <div className="sticky top-4 z-20 mb-6 flex items-baseline gap-4">
              <span className="font-display text-[clamp(2rem,6vw,5rem)] leading-none" style={{ color: 'var(--acento)' }}>
                {y}
              </span>
              <span className="text-[11px] uppercase tracking-wider opacity-60">{lista.length}</span>
            </div>
            <div className="sed-grilla grid grid-flow-dense grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
              {lista.map((o) => {
                const d = desorden.get(o.id)!
                return (
                  <figure
                    key={o.id}
                    className={`sed-item max-h-[75vh] ${d.span === 2 ? 'col-span-2 row-span-2' : ''}`}
                    style={{ aspectRatio: o.ratio }}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && nudge(e.currentTarget.firstElementChild as HTMLElement, d)}
                    onClick={() => onSelect(o)}
                  >
                    {/* la celda queda quieta; lo que se tuerce y cae es esto de adentro */}
                    <div
                      className="sed-obra"
                      data-rot={d.rot}
                      data-dy={d.dy}
                      data-ratio={o.ratio}
                      style={{ transform: `translate(${d.dx}px, ${d.dy}px) rotate(${d.rot}deg)`, opacity: 0 }}
                    >
                      <img
                        src={src(o, 480)}
                        srcSet={srcSet(o)}
                        sizes={d.span === 2 ? '(min-width:1280px) 50vw, (min-width:640px) 66vw, 100vw' : '(min-width:1280px) 25vw, (min-width:640px) 33vw, 50vw'}
                        alt={o.title ?? `${t.obra} ${o.year}`}
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
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
