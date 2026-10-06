import { Fragment, useEffect, useMemo, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { mulberry32 } from '../engine/random'

const GLIFOS = '#*%&@/\\|+=~<>?!¿¡§∆◊○●▲■'

type Props = {
  texto: string
  seed: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  style?: CSSProperties
  /** después de armarse, cada tanto una letra se escapa y vuelve */
  vivo?: boolean
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)
const CJK = /[぀-ヿ㐀-鿿]/

/**
 * Un texto que no llega entero: las letras vienen de cualquier lado, pasan por
 * glifos y se asientan. Si cambia el idioma, se vuelve a armar.
 */
export default function TextoAzar({ texto, seed, as: Tag = 'span', className, style, vivo }: Props) {
  const ref = useRef<HTMLElement>(null)

  // palabras enteras no se cortan; el japonés no tiene espacios, ahí cada carácter es suelto
  const sinEspacios = CJK.test(texto) && !texto.includes(' ')
  const palabras = useMemo(
    () => (sinEspacios ? [...texto].map((c) => [c]) : texto.split(' ').map((w) => [...w])),
    [texto, sinEspacios],
  )

  useEffect(() => {
    const root = ref.current!
    const letras = [...root.querySelectorAll<HTMLElement>('.ta-letra')]
    const originales = letras.map((l) => l.textContent ?? '')
    const r = mulberry32(seed ^ hash(texto))
    const timers: number[] = []
    let vivoT = 0
    // nodeValue y no textContent: así React conserva su nodo de texto
    const poner = (el: HTMLElement, c: string) => {
      if (el.firstChild) el.firstChild.nodeValue = c
    }
    const glifo = () => GLIFOS[r.int(0, GLIFOS.length - 1)]

    gsap.set(letras, { opacity: 0 })
    const entrar = () => {
      gsap.fromTo(
        letras,
        {
          x: () => r.range(-70, 70),
          y: () => r.range(-90, 40),
          rotate: () => r.range(-60, 60),
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          duration: () => r.range(0.6, 1.2),
          ease: 'expo.out',
          stagger: { each: 0.025, from: 'random' },
        },
      )
      letras.forEach((el, i) => {
        el.classList.add('ta-glifo')
        const id = window.setInterval(() => poner(el, glifo()), 55)
        timers.push(id)
        timers.push(
          window.setTimeout(() => {
            clearInterval(id)
            poner(el, originales[i])
            el.classList.remove('ta-glifo')
          }, r.range(250, 950)),
        )
      })
      if (vivo) {
        const tick = () => {
          const i = r.int(0, letras.length - 1)
          const el = letras[i]
          if (originales[i].trim()) {
            poner(el, glifo())
            el.classList.add('ta-glifo')
            gsap.fromTo(
              el,
              { y: r.range(-12, 12), rotate: r.range(-30, 30) },
              { y: 0, rotate: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' },
            )
            timers.push(
              window.setTimeout(() => {
                poner(el, originales[i])
                el.classList.remove('ta-glifo')
              }, r.range(90, 240)),
            )
          }
          vivoT = window.setTimeout(tick, r.range(600, 2800))
        }
        vivoT = window.setTimeout(tick, 2200)
      }
    }
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return
        io.disconnect()
        entrar()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(root)

    return () => {
      io.disconnect()
      timers.forEach((id) => {
        clearTimeout(id)
        clearInterval(id)
      })
      clearTimeout(vivoT)
      gsap.killTweensOf(letras)
      letras.forEach((el, i) => {
        poner(el, originales[i])
        el.classList.remove('ta-glifo')
      })
      gsap.set(letras, { clearProps: 'all' })
    }
  }, [texto, seed, vivo])

  return (
    <Tag ref={ref as never} className={className} style={style} aria-label={texto}>
      {palabras.map((p, i) => (
        <Fragment key={i}>
          <span className="ta-palabra" aria-hidden>
            {p.map((c, j) => (
              <span key={j} className="ta-letra">
                {c}
              </span>
            ))}
          </span>
          {sinEspacios || i === palabras.length - 1 ? null : ' '}
        </Fragment>
      ))}
    </Tag>
  )
}
