import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { mulberry32, type Rng } from '../engine/random'
import { obras, src, type Obra } from '../lib/obras'
import sala from '../data/sala.json'
import { GENTE } from '../data/gente'
import { DESTACADAS } from '../data/destacadas'
import { useI18n } from '../i18n'

gsap.registerPlugin(ScrollTrigger)

type Props = { rng: Rng; onSelect: (o: Obra) => void }

/**
 * Cómo se hace. Una obra al azar cuenta el formato en cuatro pasos, al ritmo
 * del scroll: llega en fragmentos (recolectar), se arma a escala de mano
 * (componer), un flash la vuelve archivo (fotografiar) y un haz la agranda
 * hasta llenar la pared con gente adelante (proyectar).
 */

export default function Luz({ rng, onSelect }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { t, lang } = useI18n()

  const escena = useMemo(() => {
    const r = mulberry32(rng.seed ^ 0x1c7)
    const candidatas = obras.filter((o) => DESTACADAS.includes(o.id))
    const obra = r.pick(candidatas.length ? candidatas : obras)
    // trozos: grilla 3×3, pero los cortes no son rectos. cada borde se
    // subdivide y se desvía a mano; los bordes se comparten entre piezas
    // vecinas, así el papel rasgado vuelve a encajar exacto.
    const gx = [0, r.range(29, 39), r.range(61, 71), 100]
    const gy = [0, r.range(29, 39), r.range(61, 71), 100]
    const nodos: number[][][] = []
    for (let j = 0; j < 4; j++) {
      nodos.push([])
      for (let i = 0; i < 4; i++) {
        const bx = gx[i] === 0 || gx[i] === 100
        const by = gy[j] === 0 || gy[j] === 100
        nodos[j].push([bx ? gx[i] : gx[i] + r.range(-5, 5), by ? gy[j] : gy[j] + r.range(-5, 5)])
      }
    }
    // puntos interiores de un borde: desvío perpendicular grueso + fibra fina
    const borde = (a: number[], b: number[], recto: boolean) => {
      const pasos = 9
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len
      const amp = recto ? 0 : r.range(1.6, 3.2)
      const fase = r.range(0, Math.PI * 2)
      const pts: number[][] = []
      for (let k = 1; k < pasos; k++) {
        const t = k / pasos + (recto ? 0 : r.range(-0.02, 0.02))
        const curva = Math.sin(t * Math.PI) * Math.sin(fase + t * Math.PI * r.range(1.4, 2.6))
        const d = amp * curva + (recto ? 0 : r.range(-0.55, 0.55))
        pts.push([a[0] + dx * t + nx * d, a[1] + dy * t + ny * d])
      }
      return pts
    }
    const H: number[][][][] = [] // bordes horizontales H[j][i]
    const V: number[][][][] = [] // bordes verticales V[j][i]
    for (let j = 0; j < 4; j++) {
      H.push([])
      for (let i = 0; i < 3; i++) H[j].push(borde(nodos[j][i], nodos[j][i + 1], j === 0 || j === 3))
    }
    for (let j = 0; j < 3; j++) {
      V.push([])
      for (let i = 0; i < 4; i++) V[j].push(borde(nodos[j][i], nodos[j + 1][i], i === 0 || i === 3))
    }
    const trozos = []
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const p = [
          nodos[j][i],
          ...H[j][i],
          nodos[j][i + 1],
          ...V[j][i + 1],
          nodos[j + 1][i + 1],
          ...[...H[j + 1][i]].reverse(),
          nodos[j + 1][i],
          ...[...V[j][i]].reverse(),
        ]
        const ang = r.range(0, Math.PI * 2)
        const dist = r.range(38, 95)
        trozos.push({
          clip: `polygon(${p.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`,
          x: Math.cos(ang) * dist * 0.55, // vw
          y: Math.sin(ang) * dist * 0.45, // vh
          rot: r.range(-150, 150),
          esc: r.range(1.05, 1.3),
          // cada pieza llega con su propio tiempo: nada se mueve en bloque
          retraso: r.range(0, 0.1),
          dur: r.range(0.26, 0.4),
        })
      }
    // el público: personas distintas, sin repetir, repartidas a lo ancho de la
    // sala y escaladas por distancia (las del fondo, más chicas y más lavadas)
    const elegidas = r.shuffle(GENTE).slice(0, r.int(6, 9))
    const gente = elegidas
      .map((p, i) => {
        const lejos = r.next() // 0 adelante, 1 al fondo
        const franja = 100 / elegidas.length
        return {
          ...p,
          x: 1 + i * franja * 0.94 + r.range(0, franja * 0.5), // vw, repartidos
          h: p.alto * (0.52 - lejos * 0.17), // fracción del alto de la pantalla
          flip: r.chance(0.35),
          lejos,
          entra: r.range(0, 0.05), // cada uno entra a su tiempo
        }
      })
      .sort((a, b) => b.lejos - a.lejos)
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
          scrub: 1.6,
          invalidateOnRefresh: true,
        },
      })
      const mostrar = (i: number, at: number) => {
        tl.to([pasos[i], frases[i]], { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, at)
        if (i < 3) tl.to([pasos[i], frases[i]], { opacity: 0, y: -12, duration: 0.05 }, at + 0.2)
      }

      // 1 recolectar → 2 componer: los trozos encajan al ritmo del scroll. cada
      // uno con su propio tiempo y easing, encimados entre sí, para que el
      // armado se sienta continuo y no un salto. todo cierra antes de 0.5, que
      // es donde entra el flash.
      mostrar(0, 0.02)
      trozos.forEach((el, i) => {
        const tz = escena.trozos[i]
        const at = 0.03 + tz.retraso * 0.8
        tl.to(el, { x: 0, y: 0, duration: 0.16 + tz.dur * 0.5, ease: 'sine.inOut' }, at)
          .to(el, { rotate: 0, scale: 1, duration: 0.2 + tz.dur * 0.5, ease: 'power2.out' }, at)
          .to(el, { filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))', duration: 0.18, ease: 'none' }, at)
      })
      // con todo encajado aparece la obra entera por debajo: tapa las costuras
      // finas que deja el antialias del recorte entre pieza y pieza
      tl.to(q('.luz-completa'), { opacity: 1, duration: 0.04, ease: 'none' }, 0.48)
      mostrar(1, 0.3)

      // 3 fotografiar: flash y se apaga el estudio
      mostrar(2, 0.58)
      tl.set(q('.luz-flash'), { opacity: 1 }, 0.55)
        .to(q('.luz-flash'), { opacity: 0, duration: 0.05, ease: 'power4.out' }, 0.55)
        .to(escenario, { backgroundColor: '#080706', duration: 0.05 }, 0.55)
        .to(q('.luz-texto'), { color: '#efece4', duration: 0.05 }, 0.55)
        .to(q('.luz-sombra'), { opacity: 0, duration: 0.04 }, 0.55)
        .to(q('.luz-ficha'), { opacity: 1, duration: 0.04 }, 0.58)
        .to(q('.luz-escala'), { opacity: 0, duration: 0.03 }, 0.55)

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
      q<HTMLElement>('.luz-silueta').forEach((el, i) => {
        tl.to(
          el,
          { y: 0, opacity: 1, duration: 0.14, ease: 'power3.out' },
          0.8 + escena.gente[i].entra,
        )
      })
    }, root)
    return () => ctx.revert()
  }, [escena, lang])

  const { obra, trozos, gente, fotos } = escena
  // la versión grande: proyectada llega a ocupar casi toda la pantalla
  const cara = src(obra, 1920)

  return (
    <>
      <section ref={ref} className="relative z-10 h-[420vh] bg-papel">
        <div className="luz-escenario sticky top-0 h-screen overflow-hidden bg-papel">
          {/* rótulo */}
          <header className="pointer-events-none absolute left-4 top-24 z-30 md:left-10">
            <p className="luz-texto text-[11px] uppercase tracking-wider opacity-60">
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
                  <p className="luz-frase luz-texto mt-3 max-w-lg text-[13px] leading-snug opacity-0 md:text-[14px]">
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
                style={{ width: 'min(52vmin, 460px)', aspectRatio: obra.ratio }}
                onClick={() => onSelect(obra)}
              >
                <div
                  className="luz-sombra absolute inset-0"
                  style={{
                    boxShadow: '0 18px 30px rgba(0,0,0,0.22)',
                    filter: 'blur(2px)',
                  }}
                />
                <div
                  className="luz-completa absolute inset-0 bg-cover bg-center opacity-0"
                  style={{ backgroundImage: `url(${cara})` }}
                />
                {trozos.map((tz, i) => (
                  <div
                    key={i}
                    className="luz-trozo absolute inset-0 bg-cover bg-center will-change-transform"
                    style={{
                      backgroundImage: `url(${cara})`,
                      clipPath: tz.clip,
                      transform: `translate(${tz.x}vw, ${tz.y}vh) rotate(${tz.rot}deg) scale(${tz.esc})`,
                      filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.28))',
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
              <div
                key={i}
                className="luz-silueta absolute bottom-0 opacity-0"
                style={{
                  left: `${g.x}vw`,
                  height: `${g.h * 100}vh`,
                  aspectRatio: String(g.ratio),
                  transform: `translateY(4%) ${g.flip ? 'scaleX(-1)' : ''}`,
                  zIndex: Math.round((1 - g.lejos) * 10),
                }}
              >
                <img
                  src={`/gente/${g.file}`}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                  style={{
                    opacity: 1 - g.lejos * 0.3,
                    // contraluz del proyector: si no, sobre la pared negra desaparecen
                    filter: `drop-shadow(0 0 ${10 - g.lejos * 5}px rgba(255,244,220,${0.3 - g.lejos * 0.14}))`,
                  }}
                />
              </div>
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
