import gsap from 'gsap'

/**
 * Sedimento con cuerpo: cualquier obra se puede agarrar y arrastrar, y las que
 * toca se corren (y empujan a su vez a las de al lado). Al soltarla sigue un
 * poco de largo y se frena sola. Cada año es su propio piso: las obras no se
 * salen de su grilla.
 *
 * Física mínima y propia (no Matter): cajas alineadas, sin gravedad, con
 * fricción. Alcanza para que se sienta el choque sin que nada salga volando.
 */

type Cuerpo = {
  el: HTMLElement
  x: number // desplazamiento sobre su celda (lo que GSAP llama x/y)
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  cx: number // centro de su celda, en coordenadas de página
  cy: number
  w: number // tamaño de lo que se ve (la imagen dentro de la celda)
  h: number
}

const FRICCION = 0.86
const FRICCION_GIRO = 0.84
const GIRO_MAX = 12 // grados: se tuercen con los golpes, pero no se dan vuelta
const UMBRAL_ARRASTRE = 5 // px antes de que un clic pase a ser arrastre
const ESPERA_TACTIL = 260 // ms apretando antes de agarrar con el dedo (si no, es scroll)

export function arrastrable(
  root: HTMLElement,
  { alSoltar }: { alSoltar?: (el: HTMLElement) => void } = {},
): () => void {
  let cuerpos: Cuerpo[] = []
  let limites = { l: 0, r: 0, t: 0, b: 0 }
  let raf = 0
  let agarrado: {
    c: Cuerpo
    fig: HTMLElement
    id: number
    px: number
    py: number
    x0: number
    y0: number
    vx: number
    vy: number
    t: number
  } | null = null
  let pendiente: { fig: HTMLElement; id: number; px: number; py: number; tactil: boolean; timer: number } | null = null
  let acabaDeArrastrar = false

  const setters = new WeakMap<HTMLElement, (v: { x: number; y: number; rot: number }) => void>()
  const poner = (c: Cuerpo) => {
    let s = setters.get(c.el)
    if (!s) {
      const sx = gsap.quickSetter(c.el, 'x', 'px')
      const sy = gsap.quickSetter(c.el, 'y', 'px')
      const sr = gsap.quickSetter(c.el, 'rotate', 'deg')
      s = (v) => {
        sx(v.x)
        sy(v.y)
        sr(v.rot)
      }
      setters.set(c.el, s)
    }
    s(c)
  }

  // arma los cuerpos del año donde se agarró la obra (solo las que ya cayeron)
  const medir = (grilla: HTMLElement) => {
    const g = grilla.getBoundingClientRect()
    limites = { l: g.left, r: g.right, t: g.top + scrollY, b: g.bottom + scrollY }
    cuerpos = [...grilla.querySelectorAll<HTMLElement>('.sed-obra')]
      .filter((el) => el.dataset.cayo === '1')
      .map((el) => {
        const fig = el.parentElement!
        const r = fig.getBoundingClientRect()
        const pad = parseFloat(getComputedStyle(fig).paddingLeft) || 0
        const cw = r.width - pad * 2
        const ch = r.height - pad * 2
        const ratio = +el.dataset.ratio! || 1
        // la imagen va "contain": lo que se ve puede ser más angosto o más bajo que la caja
        const w = Math.min(cw, ch * ratio)
        const h = w / ratio
        gsap.killTweensOf(el)
        return {
          el,
          x: +gsap.getProperty(el, 'x'),
          y: +gsap.getProperty(el, 'y'),
          vx: 0,
          vy: 0,
          rot: +gsap.getProperty(el, 'rotate'),
          vr: 0,
          cx: r.left + r.width / 2,
          cy: r.top + scrollY + r.height / 2,
          w: w * 0.97,
          h: h * 0.97,
        }
      })
  }

  const paso = () => {
    const a = agarrado?.c
    for (const c of cuerpos) {
      if (c === a) continue
      c.x += c.vx
      c.y += c.vy
      c.rot = gsap.utils.clamp(-GIRO_MAX, GIRO_MAX, c.rot + c.vr)
      c.vx *= FRICCION
      c.vy *= FRICCION
      c.vr *= FRICCION_GIRO
    }
    // la caja de choque es lo que ocupa la obra ya torcida: así ni las esquinas se pisan
    const ext = new Map<Cuerpo, [number, number]>()
    for (const c of cuerpos) {
      const t = (c.rot * Math.PI) / 180
      const cos = Math.abs(Math.cos(t))
      const sin = Math.abs(Math.sin(t))
      ext.set(c, [c.w * cos + c.h * sin, c.w * sin + c.h * cos])
    }
    // choques: varias pasadas para que el empujón se propague en cadena
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < cuerpos.length; i++) {
        const p = cuerpos[i]
        const [pw, ph] = ext.get(p)!
        for (let j = i + 1; j < cuerpos.length; j++) {
          const q = cuerpos[j]
          const [qw, qh] = ext.get(q)!
          const dx = q.cx + q.x - (p.cx + p.x)
          const dy = q.cy + q.y - (p.cy + p.y)
          const ox = (pw + qw) / 2 - Math.abs(dx)
          const oy = (ph + qh) / 2 - Math.abs(dy)
          if (ox <= 0 || oy <= 0) continue
          // salen por el lado que menos se pisan
          const porX = ox < oy
          const sx = porX ? Math.sign(dx) || 1 : 0
          const sy = porX ? 0 : Math.sign(dy) || 1
          const pen = porX ? ox : oy
          // la agarrada no cede: empuja todo; entre sueltas, mitad y mitad
          const kp = p === a ? 0 : q === a ? 1 : 0.5
          const kq = 1 - kp
          p.x -= sx * pen * kp
          p.y -= sy * pen * kp
          q.x += sx * pen * kq
          q.y += sy * pen * kq
          // el golpe deja velocidad y un poco de giro
          const imp = Math.min(pen, 24) * 0.12
          if (kp) {
            p.vx -= sx * imp
            p.vy -= sy * imp
            p.vr += (sx ? -sx : sy) * imp * 0.12
          }
          if (kq) {
            q.vx += sx * imp
            q.vy += sy * imp
            q.vr += (sx ? sx : -sy) * imp * 0.12
          }
        }
      }
      // cada año es su piso: nadie sale de la grilla (rebote corto contra el borde)
      for (const c of cuerpos) {
        const [ew, eh] = ext.get(c)!
        const minX = limites.l + ew / 2 - c.cx
        const maxX = limites.r - ew / 2 - c.cx
        const minY = limites.t + eh / 2 - c.cy
        const maxY = limites.b - eh / 2 - c.cy
        if (c.x < minX) (c.x = minX), (c.vx = Math.abs(c.vx) * 0.4)
        if (c.x > maxX) (c.x = maxX), (c.vx = -Math.abs(c.vx) * 0.4)
        if (c.y < minY) (c.y = minY), (c.vy = Math.abs(c.vy) * 0.4)
        if (c.y > maxY) (c.y = maxY), (c.vy = -Math.abs(c.vy) * 0.4)
      }
    }
    let quieto = !agarrado
    for (const c of cuerpos) {
      poner(c)
      if (Math.abs(c.vx) + Math.abs(c.vy) + Math.abs(c.vr) > 0.05) quieto = false
      if (c !== a && (c.vx || c.vy)) c.el.dataset.movida = '1'
    }
    raf = quieto ? 0 : requestAnimationFrame(paso)
  }
  const andar = () => {
    if (!raf) raf = requestAnimationFrame(paso)
  }

  const empezar = (fig: HTMLElement, id: number, px: number, py: number) => {
    const el = fig.querySelector<HTMLElement>('.sed-obra')
    const grilla = fig.closest<HTMLElement>('.sed-grilla')
    if (!el || !grilla || el.dataset.cayo !== '1') return
    medir(grilla)
    const c = cuerpos.find((k) => k.el === el)
    if (!c) return
    agarrado = { c, fig, id, px, py, x0: c.x, y0: c.y, vx: 0, vy: 0, t: performance.now() }
    el.dataset.movida = '1'
    fig.classList.add('arrastrando')
    try {
      fig.setPointerCapture(id)
    } catch {}
    // se levanta un poco al agarrarla
    gsap.to(el, { scale: 1.04, duration: 0.2, ease: 'power2.out' })
    andar()
  }

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || agarrado) return
    const fig = (e.target as Element).closest<HTMLElement>('.sed-item')
    if (!fig) return
    const tactil = e.pointerType === 'touch'
    pendiente = { fig, id: e.pointerId, px: e.pageX, py: e.pageY, tactil, timer: 0 }
    // con el dedo, arrastrar y scrollear son el mismo gesto: se agarra solo si se mantiene apretado
    if (tactil) {
      pendiente.timer = window.setTimeout(() => {
        if (!pendiente) return
        const p = pendiente
        pendiente = null
        empezar(p.fig, p.id, p.px, p.py)
      }, ESPERA_TACTIL)
    }
  }

  const onMove = (e: PointerEvent) => {
    if (pendiente && e.pointerId === pendiente.id) {
      const d = Math.hypot(e.pageX - pendiente.px, e.pageY - pendiente.py)
      if (d > UMBRAL_ARRASTRE) {
        const p = pendiente
        pendiente = null
        clearTimeout(p.timer)
        // con el dedo, moverse antes de tiempo es scrollear: no se agarra nada
        if (!p.tactil) empezar(p.fig, p.id, p.px, p.py)
      }
    }
    if (!agarrado || e.pointerId !== agarrado.id) return
    const g = agarrado
    const nx = g.x0 + (e.pageX - g.px)
    const ny = g.y0 + (e.pageY - g.py)
    const now = performance.now()
    const dt = Math.max(1, now - g.t) / 16.7
    // velocidad suavizada, para el tiro al soltar y para que el golpe tenga fuerza
    g.vx = g.vx * 0.5 + ((nx - g.c.x) / dt) * 0.5
    g.vy = g.vy * 0.5 + ((ny - g.c.y) / dt) * 0.5
    g.t = now
    // arrastrarla de costado la tuerce apenas, como un papel que se lleva con un dedo
    g.c.rot = gsap.utils.clamp(-GIRO_MAX, GIRO_MAX, g.c.rot + (nx - g.c.x) * 0.02)
    g.c.x = nx
    g.c.y = ny
    andar()
  }

  const soltar = (e: PointerEvent) => {
    if (pendiente && e.pointerId === pendiente.id) {
      clearTimeout(pendiente.timer)
      pendiente = null
    }
    if (!agarrado || e.pointerId !== agarrado.id) return
    const { c, fig, vx, vy } = agarrado
    agarrado = null
    // el clic que sigue al soltar se descarta; si no llega (se soltó afuera), se olvida
    acabaDeArrastrar = true
    window.setTimeout(() => (acabaDeArrastrar = false), 0)
    fig.classList.remove('arrastrando')
    // sigue de largo con la velocidad que llevaba (con tope)
    c.vx = gsap.utils.clamp(-40, 40, vx)
    c.vy = gsap.utils.clamp(-40, 40, vy)
    c.vr = gsap.utils.clamp(-1.5, 1.5, vx * 0.04)
    gsap.to(c.el, { scale: 1, duration: 0.35, ease: 'power2.out' })
    alSoltar?.(c.el)
    andar()
  }

  // un arrastre no es un clic: que no abra el detalle al soltar
  const onClick = (e: MouseEvent) => {
    if (!acabaDeArrastrar) return
    acabaDeArrastrar = false
    e.stopPropagation()
    e.preventDefault()
  }
  // mientras se arrastra con el dedo, la página no scrollea
  const onTouchMove = (e: TouchEvent) => {
    if (agarrado) e.preventDefault()
  }

  root.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', soltar)
  window.addEventListener('pointercancel', soltar)
  root.addEventListener('click', onClick, true)
  root.addEventListener('touchmove', onTouchMove, { passive: false })

  return () => {
    cancelAnimationFrame(raf)
    if (pendiente) clearTimeout(pendiente.timer)
    root.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', soltar)
    window.removeEventListener('pointercancel', soltar)
    root.removeEventListener('click', onClick, true)
    root.removeEventListener('touchmove', onTouchMove)
  }
}
