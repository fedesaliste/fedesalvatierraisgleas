import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, type Rng } from '../engine/random'
import { obras, src, type Obra } from '../lib/obras'
import sala from '../data/sala.json'
import { useI18n } from '../i18n'

gsap.registerPlugin(ScrollTrigger)

type Props = { rng: Rng; onSelect: (o: Obra) => void }

/**
 * Cómo se hace. Una obra al azar cuenta el formato en cuatro pasos, al ritmo
 * del scroll: llega en fragmentos (recolectar), se arma a escala de mano
 * (componer), un flash la vuelve archivo (fotografiar) y un haz la agranda
 * hasta llenar la pared con gente adelante (proyectar).
 */

// siluetas recortadas en papel, caja 100×300. distintas alturas y gestos.
const SILUETAS = [
  // adulto de pie
  'M50 0c-13 0-22 10-22 24 0 10 5 18 12 22-16 6-27 20-27 44v70l10 4v136h18l6-120h6l6 120h18V164l10-4V90c0-24-11-38-27-44 7-4 12-12 12-22C72 10 63 0 50 0z',
  // adulto señalando
  'M52 0c-13 0-22 10-22 24 0 10 5 18 12 22-16 6-26 20-26 44v66l10 4v140h18l6-124h6l6 124h18V160l10-4v-40l32-30-8-8-26 20V90c0-24-11-38-27-44 7-4 12-12 12-22C74 10 65 0 52 0z',
  // niño
  'M50 90c-11 0-19 8-19 20 0 8 4 14 10 18-13 5-21 16-21 36v52l8 3v81h16l5-76h2l5 76h16v-81l8-3v-52c0-20-8-31-21-36 6-4 10-10 10-18 0-12-8-20-19-20z',
  // niño con brazos abiertos
  'M50 100c-11 0-19 8-19 20 0 8 4 14 10 18-8 3-14 8-18 15l-22-18-7 8 30 26v45l8 3v83h16l5-78h2l5 78h16v-83l8-3v-45l30-26-7-8-22 18c-4-7-10-12-18-15 6-4 10-10 10-18 0-12-8-20-19-20z',
] as const

export default function Luz({ rng, onSelect }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { t, lang } = useI18n()

  const escena = useMemo(() => {
    const r = mulberry32(rng.seed ^ 0x1c7)
    const obra = r.pick(obras)
    // trozos: grilla 3×3 con los vértices internos corridos, cada uno con su
    // punto de partida disperso por la pantalla
    const gx = [0, r.range(28, 40), r.range(60, 72), 100]
    const gy = [0, r.range(28, 40), r.range(60, 72), 100]
    const jit = (v: number) => (v === 0 || v === 100 ? v : v + r.range(-9, 9))
    const pts: number[][][] = []
    for (let j = 0; j < 4; j++) {
      pts.push([])
      for (let i = 0; i < 4; i++) pts[j].push([jit(gx[i]), jit(gy[j])])
    }
    const trozos = []
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const p = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]]
        trozos.push({
          clip: `polygon(${p.map(([x, y]) => `${x}% ${y}%`).join(', ')})`,
          x: r.range(-48, 48), // vw
          y: r.range(-40, 40), // vh
          rot: r.range(-140, 140),
        })
      }
    const gente = Array.from({ length: r.int(5, 8) }, () => ({
      forma: r.int(0, SILUETAS.length - 1),
      x: r.range(4, 90), // vw
      h: r.range(0.34, 0.5), // fracción del alto de la pantalla
      flip: r.chance(0.5),
    })).sort((a, b) => a.x - b.x)
    const fotos = r.shuffle(sala).slice(0, 6)
    return { obra, trozos, gente, fotos }
  }, [rng.seed])

  useEffect(() => {
    const root = ref.current!
    const q = gsap.utils.selector(root)
    const escenario = q<HTMLElement>('.luz-escenario')[0]
    const obraEl = q<HTMLElement>('.luz-obra')[0]
    const trozos = q<HTMLElement>('.luz-trozo')
    const pasos = q<HTMLElement>('.luz-paso')
    const frases = q<HTMLElement>('.luz-frase')

    // cuánto hay que agrandar la obra para que llene la pared
    const escalaPared = () => {
      const w = obraEl.offsetWidth || 1
      const h = obraEl.offsetHeight || 1
      return Math.min((innerWidth * 0.86) / w, (innerHeight * 0.74) / h)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      const mostrar = (i: number, at: number) => {
        tl.to([pasos[i], frases[i]], { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, at)
        if (i < 3) tl.to([pasos[i], frases[i]], { opacity: 0, y: -12, duration: 0.05 }, at + 0.2)
      }

      // 1 recolectar → 2 componer: los trozos vuelan hasta encajar
      mostrar(0, 0.02)
      tl.to(
        trozos,
        {
          x: 0,
          y: 0,
          rotate: 0,
          duration: 0.34,
          ease: 'power3.inOut',
          stagger: { each: 0.012, from: 'random' },
        },
        0.04,
      )
      mostrar(1, 0.26)

      // 3 fotografiar: flash y se apaga el estudio
      mostrar(2, 0.5)
      tl.set(q('.luz-flash'), { opacity: 1 }, 0.47)
        .to(q('.luz-flash'), { opacity: 0, duration: 0.05, ease: 'power4.out' }, 0.47)
        .to(escenario, { backgroundColor: '#080706', duration: 0.05 }, 0.47)
        .to(q('.luz-sombra'), { opacity: 0, duration: 0.04 }, 0.47)
        .to(q('.luz-ficha'), { opacity: 1, duration: 0.04 }, 0.5)
        .to(q('.luz-escala'), { opacity: 0, duration: 0.03 }, 0.47)

      // 4 proyectar: haz, la obra crece, entra la gente
      mostrar(3, 0.76)
      tl.to(q('.luz-ficha'), { opacity: 0, duration: 0.03 }, 0.7)
        .to(q('.luz-haz'), { opacity: 1, duration: 0.08 }, 0.7)
        .to(
          obraEl,
          {
            scale: escalaPared,
            y: () => -innerHeight * 0.05,
            boxShadow: '0 0 90px rgba(255,240,200,0.22)',
            duration: 0.26,
            ease: 'power2.inOut',
          },
          0.7,
        )
        .to(
          q('.luz-silueta'),
          {
            y: 0,
            opacity: 1,
            duration: 0.14,
            ease: 'power3.out',
            stagger: 0.02,
          },
          0.8,
        )
    }, root)
    return () => ctx.revert()
  }, [rng.seed, lang])

  const { obra, trozos, gente, fotos } = escena
  // la versión grande: proyectada llega a ocupar casi toda la pantalla
  const cara = src(obra, 1920)

  return (
    <>
      <section ref={ref} className="relative z-10 h-[420vh] bg-papel">
        <div className="luz-escenario sticky top-0 h-screen overflow-hidden bg-papel">
          {/* rótulo */}
          <header className="pointer-events-none absolute left-4 top-24 z-30 md:left-10">
            <p className="text-[11px] uppercase tracking-wider opacity-60 mix-blend-difference text-white">
              {t.luz.titulo} · {t.luz.sub}
            </p>
          </header>

          {/* pasos + frases: se van pisando */}
          <div className="pointer-events-none absolute inset-x-4 bottom-8 z-30 md:inset-x-10 md:bottom-10">
            <div className="relative h-[8rem] md:h-[9rem]">
              {t.luz.pasos.map((p, i) => (
                <div key={p} className="absolute inset-x-0 bottom-0">
                  <h3
                    className="luz-paso font-display text-[clamp(2.4rem,8vw,7rem)] uppercase leading-[0.85] opacity-0"
                    style={{
                      color: 'var(--acento)',
                      transform: 'translateY(12px)',
                    }}
                  >
                    {i + 1}. {p}
                  </h3>
                  <p className="luz-frase mt-3 max-w-lg text-[13px] leading-snug opacity-0 mix-blend-difference text-white md:text-[14px]">
                    {t.luz.frases[i]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* haz del proyector */}
          <div
            className="luz-haz pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 46%, rgba(255,250,235,0.14), transparent 70%), linear-gradient(to bottom, rgba(255,250,235,0.10), transparent 55%)',
            }}
          />

          {/* la obra, hecha de trozos */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                className="luz-obra relative cursor-pointer"
                style={{ width: 'min(30vmin, 260px)', aspectRatio: obra.ratio }}
                onClick={() => onSelect(obra)}
              >
                <div
                  className="luz-sombra absolute inset-0"
                  style={{
                    boxShadow: '0 18px 30px rgba(0,0,0,0.22)',
                    filter: 'blur(2px)',
                  }}
                />
                {trozos.map((tz, i) => (
                  <div
                    key={i}
                    className="luz-trozo absolute inset-0 bg-cover bg-center will-change-transform"
                    style={{
                      backgroundImage: `url(${cara})`,
                      clipPath: tz.clip,
                      transform: `translate(${tz.x}vw, ${tz.y}vh) rotate(${tz.rot}deg)`,
                    }}
                  />
                ))}
              </div>
              <p className="luz-escala absolute -bottom-7 left-0 whitespace-nowrap text-[11px] uppercase tracking-wider opacity-60">
                {t.luz.escala}
              </p>
              <p className="luz-ficha absolute -bottom-7 left-0 whitespace-nowrap text-[11px] uppercase tracking-wider text-papel opacity-0">
                {obra.title ?? t.sinTitulo} · {obra.year} · {obra.w}×{obra.h}px
              </p>
            </div>
          </div>

          {/* flash de la cámara */}
          <div className="luz-flash pointer-events-none absolute inset-0 z-40 bg-white opacity-0" />

          {/* gente mirando */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-full">
            {gente.map((g, i) => (
              <svg
                key={i}
                className="luz-silueta absolute bottom-0 opacity-0"
                viewBox="0 0 100 300"
                style={{
                  left: `${g.x}vw`,
                  height: `${g.h * 100}vh`,
                  transform: `translateY(30%) ${g.flip ? 'scaleX(-1)' : ''}`,
                  fill: '#050403',
                }}
              >
                <path d={SILUETAS[g.forma]} />
              </svg>
            ))}
          </div>
        </div>
      </section>

      {/* en sala: las fotos del portafolio, grandes y sin fecha — no son registro, son
          una forma posible de verlo. el orden y cuáles entran, al azar */}
      <section className="relative z-10 bg-[#080706] px-2 pb-24 pt-24 text-papel md:px-4">
        <header className="mb-10 flex flex-col gap-3 px-2 md:flex-row md:items-end md:justify-between md:px-6">
          <h2 className="font-display text-[clamp(2.4rem,7vw,6rem)] uppercase leading-[0.9]">{t.luz.registro}</h2>
          <p className="max-w-sm text-[11px] uppercase tracking-wider opacity-60 md:text-right">{t.luz.registroSub}</p>
        </header>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {fotos.map((f, i) => (
            <figure
              key={f.file}
              className={`luz-foto relative overflow-hidden ${i % 3 === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]'}`}
            >
              <img
                src={`/sala/${f.file}`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            </figure>
          ))}
        </div>
      </section>
    </>
  )
}
