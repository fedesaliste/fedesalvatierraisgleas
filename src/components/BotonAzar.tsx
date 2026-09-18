import { useEffect, useRef, useState, type Ref } from 'react'
import type { Rng } from '../engine/random'

const GLIFOS = '#*%&@/\\|+=~<>?!¿¡§∆◊○●▲■'

type Props = { texto: string; rng: Rng; ref: Ref<HTMLButtonElement> }

/**
 * El botón de "otro azar". Adentro le pasa de todo: pedacitos de papel que
 * rebotan en un canvas, y las letras de la palabra se desordenan solas
 * —el azar también le toca a la palabra "azar".
 */
export default function BotonAzar({ texto, rng, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hover = useRef(false)
  const [letras, setLetras] = useState<string[]>(() => [...texto])

  // scramble: cada tanto unas letras se cambian por glifos y vuelven
  useEffect(() => {
    const base = [...texto]
    setLetras(base)
    let timer = 0
    const tick = () => {
      const cuantas = hover.current ? Math.ceil(base.length * 0.6) : rng.int(1, Math.max(1, Math.floor(base.length / 3)))
      const idx = new Set<number>()
      while (idx.size < cuantas) idx.add(rng.int(0, base.length - 1))
      setLetras(base.map((c, i) => (idx.has(i) && c !== ' ' ? GLIFOS[rng.int(0, GLIFOS.length - 1)] : c)))
      window.setTimeout(() => setLetras(base), hover.current ? 60 : 140)
      timer = window.setTimeout(tick, hover.current ? rng.range(90, 160) : rng.range(900, 2600))
    }
    timer = window.setTimeout(tick, rng.range(500, 1500))
    return () => clearTimeout(timer)
  }, [texto, rng])

  // canvas: pedacitos de papel que rebotan adentro
  useEffect(() => {
    const cv = canvasRef.current!
    const ctx = cv.getContext('2d')!
    type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; a: number; va: number; tono: number }
    let ps: P[] = []
    let W = 0
    let H = 0
    let raf = 0

    const resize = () => {
      const r = cv.getBoundingClientRect()
      W = Math.max(1, r.width)
      H = Math.max(1, r.height)
      const dpr = Math.min(devicePixelRatio, 2)
      cv.width = W * dpr
      cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round((W * H) / 380)
      ps = Array.from({ length: n }, () => ({
        x: rng.range(0, W),
        y: rng.range(0, H),
        vx: rng.range(-0.6, 0.6),
        vy: rng.range(-0.6, 0.6),
        w: rng.range(3, 9),
        h: rng.range(2, 6),
        a: rng.range(0, Math.PI),
        va: rng.range(-0.05, 0.05),
        tono: rng.range(0.25, 0.7),
      }))
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    const frame = () => {
      ctx.clearRect(0, 0, W, H)
      const k = hover.current ? 3.2 : 1
      for (const p of ps) {
        p.x += p.vx * k
        p.y += p.vy * k
        p.a += p.va * k
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        if (hover.current && rng.chance(0.02)) {
          p.vx = rng.range(-1.5, 1.5)
          p.vy = rng.range(-1.5, 1.5)
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.a)
        ctx.globalAlpha = p.tono
        ctx.fillStyle = '#efece4'
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [rng])

  return (
    <button
      ref={ref}
      type="button"
      className="boton-azar"
      style={{ visibility: 'hidden' }}
      aria-label={texto}
      onPointerEnter={() => (hover.current = true)}
      onPointerLeave={() => (hover.current = false)}
    >
      <canvas ref={canvasRef} aria-hidden />
      <span className="boton-azar-texto">
        {letras.map((c, i) => (
          <span key={i} className={c === texto[i] ? undefined : 'glifo'}>
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
      <span className="boton-azar-icono" aria-hidden>
        ↻
      </span>
    </button>
  )
}
