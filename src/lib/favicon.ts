/**
 * El favicon vivo: las tres iniciales (F · S · I) en Anton, cada una sobre un
 * color de la paleta de las obras. Entre una y otra la letra se escapa por un
 * par de glifos, como en TextoAzar.
 *
 * Los navegadores (salvo Firefox) no animan un GIF en la pestaña, así que en
 * vez de un .gif se redibuja un canvas y se cambia el href del <link>.
 */
import { ACENTOS } from '../engine/random'

const LETRAS = ['F', 'S', 'I'] as const
const GLIFOS = '#*%&@/+=~<>?!'
const PAPEL = '#efece4'
const TINTA = '#141210'
const SIZE = 64 // se ve a 16/32 px; 64 deja margen para pantallas retina

/** el amarillo pide tinta; el resto, papel */
const tintaSobre = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return l > 150 ? TINTA : PAPEL
}

export function iniciarFavicon(): () => void {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  // un solo <link rel=icon>: si quedan dos (el SVG de respaldo y este) el navegador
  // elige uno y no siempre el vivo. Se saca el estático y, en cada cuadro, se
  // reemplaza el nodo entero: Chrome ignora un cambio de href sobre el mismo nodo
  const poner = (url: string) => {
    document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]').forEach((l) => l.remove())
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = url
    document.head.appendChild(link)
  }

  const dibujar = (txt: string, fondo: string) => {
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = fondo
    ctx.beginPath()
    ctx.roundRect(0, 0, SIZE, SIZE, 10)
    ctx.fill()
    ctx.fillStyle = tintaSobre(fondo)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    // Anton es angosta y alta: el tamaño sale de la altura de las mayúsculas,
    // no del ancho. 0.8 del lado queda legible a 16 px
    ctx.font = `${SIZE}px Anton, Impact, sans-serif`
    const m = ctx.measureText('H')
    const alto = m.actualBoundingBoxAscent || SIZE * 0.7
    const px = Math.floor((SIZE * SIZE * 0.8) / alto)
    ctx.font = `${px}px Anton, Impact, sans-serif`
    const mm = ctx.measureText(txt)
    const a = mm.actualBoundingBoxAscent
    const d = mm.actualBoundingBoxDescent
    ctx.fillText(txt, SIZE / 2, SIZE / 2 + (a - d) / 2)
    poner(canvas.toDataURL('image/png'))
  }

  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
  let i = 0
  let c = Math.floor(Math.random() * ACENTOS.length)
  let t = 0
  let vivo = true

  const siguiente = () => {
    if (!vivo) return
    i = (i + 1) % LETRAS.length
    c = (c + 1 + Math.floor(Math.random() * (ACENTOS.length - 1))) % ACENTOS.length
    // con movimiento reducido no hay destellos: la letra y el color cambian de a poco
    if (reducido) {
      dibujar(LETRAS[i], ACENTOS[c])
      t = window.setTimeout(siguiente, 2500)
      return
    }
    // 3 destellos de glifo, cada uno de otro color, y se asienta la letra
    let k = 0
    const paso = () => {
      if (!vivo) return
      if (k < 3) {
        const g = GLIFOS[Math.floor(Math.random() * GLIFOS.length)]
        dibujar(g, ACENTOS[(c + k + 1) % ACENTOS.length])
        k++
        t = window.setTimeout(paso, 75)
      } else {
        dibujar(LETRAS[i], ACENTOS[c])
        t = window.setTimeout(siguiente, 900)
      }
    }
    paso()
  }

  // Anton tiene que estar cargada antes del primer dibujo, si no sale Impact
  const arrancar = () => {
    if (!vivo) return
    dibujar(LETRAS[i], ACENTOS[c])
    t = window.setTimeout(siguiente, reducido ? 2500 : 900)
  }
  document.fonts.load(`${SIZE}px Anton`, 'FSI').then(arrancar, arrancar)

  return () => {
    vivo = false
    clearTimeout(t)
  }
}
