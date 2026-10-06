import { useMemo, type CSSProperties } from 'react'
import { mulberry32 } from '../engine/random'

/**
 * Nada es plano: todo el sitio está impreso sobre algo. Siempre hay grano
 * (vivo, como película) y encima una o dos capas más que salen de la semilla:
 * fibras de papel, trama de imprenta, manchas, cuadrícula, pliegues.
 */

type Capa = { estilo: CSSProperties }

const svg = (body: string, w: number, h = w) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`,
  )}")`

/** ruido gris centrado en 0.5 (en overlay, 0.5 no cambia nada) */
const ruido = (freq: string, oct: number, seed: number, contraste: number, w: number, h = w) => {
  const o = (0.5 - contraste * 0.5).toFixed(3)
  const c = contraste.toFixed(3)
  return svg(
    `<filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='${c} 0 0 0 ${o} ${c} 0 0 0 ${o} ${c} 0 0 0 ${o} 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#n)'/>`,
    w,
    h,
  )
}

/** manchas de un color, con borde de tinta corrida */
const manchas = (freq: number, seed: number, hex: string, w: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3))
  return svg(
    `<filter id='m' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 9 0 0 0 -4.6'/></filter><rect width='100%' height='100%' filter='url(#m)'/>`,
    w,
  )
}

const EXTRAS = ['fibras', 'trama', 'manchas', 'cuadricula', 'pliegues'] as const

function capas(seed: number, acento: string): { grano: string; extras: Capa[]; nombres: string[] } {
  const r = mulberry32(seed ^ 0x7e57)
  const grano = ruido(r.range(0.7, 0.95).toFixed(3), 3, r.int(1, 999), r.range(1.6, 2.2), 240)
  const nombres = r.shuffle(EXTRAS).slice(0, r.chance(0.4) ? 2 : 1)
  const extras = nombres.map((n): Capa => {
    switch (n) {
      case 'fibras': {
        const largo = r.range(0.004, 0.009).toFixed(4)
        const fino = r.range(0.16, 0.36).toFixed(3)
        const horizontal = r.chance(0.6)
        return {
          estilo: {
            backgroundImage: ruido(horizontal ? `${largo} ${fino}` : `${fino} ${largo}`, 4, r.int(1, 999), 2.6, 640),
            mixBlendMode: 'overlay',
            opacity: r.range(0.35, 0.6),
          },
        }
      }
      case 'trama': {
        const s = r.range(5, 9)
        const p = r.range(0.7, 1.2)
        const punto = `radial-gradient(circle, rgb(0 0 0 / 0.55) ${p}px, transparent ${p + 0.6}px)`
        return {
          estilo: {
            backgroundImage: `${punto}, ${punto}`,
            backgroundSize: `${s}px ${s}px`,
            backgroundPosition: `0 0, ${s / 2}px ${s / 2}px`,
            mixBlendMode: 'overlay',
            opacity: r.range(0.18, 0.32),
          },
        }
      }
      case 'manchas':
        return {
          estilo: {
            backgroundImage: manchas(r.range(0.0025, 0.006), r.int(1, 999), acento, 1100),
            mixBlendMode: 'multiply',
            opacity: r.range(0.07, 0.13),
          },
        }
      case 'cuadricula': {
        const s = r.int(22, 48)
        const linea = `color-mix(in srgb, ${acento} 45%, transparent)`
        return {
          estilo: {
            backgroundImage: `linear-gradient(${linea} 1px, transparent 1px), linear-gradient(90deg, ${linea} 1px, transparent 1px)`,
            backgroundSize: `${s}px ${s}px`,
            backgroundPosition: `${r.int(0, s)}px ${r.int(0, s)}px`,
            opacity: r.range(0.1, 0.18),
          },
        }
      }
      case 'pliegues': {
        // dobleces: una arista de luz y sombra que cruza en diagonal cada tanto
        const ang = r.range(20, 160)
        const alto = r.range(90, 160)
        const at = r.range(30, 70)
        return {
          estilo: {
            backgroundImage: `linear-gradient(${ang}deg, transparent ${at - 9}%, rgb(0 0 0 / 0.35) ${at}%, rgb(255 255 255 / 0.5) ${at + 0.4}%, transparent ${at + 14}%)`,
            backgroundSize: `100% ${alto}vh`,
            mixBlendMode: 'overlay',
            opacity: r.range(0.25, 0.45),
          },
        }
      }
    }
  })
  return { grano, extras, nombres }
}

/** Va en la raíz: una capa fija (el grano, que se mueve) y otras que scrollean con el papel. */
export default function Textura({ seed, acento }: { seed: number; acento: string }) {
  const { grano, extras, nombres } = useMemo(() => capas(seed, acento), [seed, acento])
  return (
    <>
      {/* cada capa suelta en la raíz: si las envuelvo, el blend mode queda encerrado y no toca la página */}
      {extras.map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-0 z-[7400]"
          style={c.estilo}
          aria-hidden
          data-textura={nombres[i]}
        />
      ))}
      <div className="textura-grano" aria-hidden>
        <div style={{ backgroundImage: grano }} />
      </div>
    </>
  )
}
