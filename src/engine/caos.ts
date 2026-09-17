/**
 * El motor del caos: un mundo Matter.js donde las obras caen, chocan y se apilan.
 * Renderizamos con DOM (un <div><img/></div> por cuerpo) sincronizado cada frame,
 * así las imágenes se ven nítidas y con drop-shadow real.
 */
import Matter from 'matter-js'
import type { Rng } from './random'
import { type Obra, srcSet, src } from '../lib/obras'

const { Engine, World, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Runner } = Matter

export type CaosOptions = {
  container: HTMLElement
  rng: Rng
  obras: Obra[]
  onSelect?: (obra: Obra) => void
}

export type Caos = {
  destroy: () => void
  /** una obra irrumpe desde afuera del viewport */
  irrumpir: (obra?: Obra) => void
  /** algo se mueve solo */
  impulso: () => void
  /** invertir gravedad un rato */
  vuelco: () => void
  /** sacar una obra (se va como vino) */
  retirar: () => void
  bodies: () => Matter.Body[]
}

type Tag = { obra: Obra; el: HTMLDivElement; w: number; h: number }

export function crearCaos({ container, rng, obras, onSelect }: CaosOptions): Caos {
  const engine = Engine.create({ gravity: { x: 0, y: 0.9 } })
  engine.positionIterations = 8
  engine.velocityIterations = 6
  const world = engine.world
  let W = container.clientWidth
  let H = container.clientHeight

  // paredes: piso + laterales. El techo queda abierto para que entren cosas.
  const wallOpts = { isStatic: true, friction: 0.6, restitution: 0.1 }
  const makeWalls = () => [
    Bodies.rectangle(W / 2, H + 60, W * 3, 120, wallOpts),
    Bodies.rectangle(-60, H / 2, 120, H * 6, wallOpts),
    Bodies.rectangle(W + 60, H / 2, 120, H * 6, wallOpts),
  ]
  let walls = makeWalls()
  World.add(world, walls)

  const tags = new Map<number, Tag>()
  const used = new Set<string>()

  const tamaño = (o: Obra) => {
    // ancho relativo al viewport, con variación: algunas chicas, alguna enorme
    const base = Math.min(W, H)
    const r = rng.next()
    const frac = r < 0.12 ? rng.range(0.42, 0.6) : r < 0.5 ? rng.range(0.22, 0.32) : rng.range(0.13, 0.22)
    const w = base * frac
    return { w, h: w / o.ratio }
  }

  const agregar = (o: Obra, x: number, y: number, angle: number, vel: { x: number; y: number }) => {
    const { w, h } = tamaño(o)
    const body = Bodies.rectangle(x, y, w, h, {
      angle,
      friction: 0.5,
      frictionAir: 0.012,
      restitution: 0.15,
      density: 0.002,
      chamfer: { radius: 4 },
    })
    Body.setVelocity(body, vel)
    Body.setAngularVelocity(body, rng.range(-0.08, 0.08))

    const el = document.createElement('div')
    el.className = 'obra-body'
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    const img = document.createElement('img')
    img.src = src(o, w * devicePixelRatio)
    img.srcset = srcSet(o)
    img.sizes = `${Math.round(w)}px`
    img.alt = o.title ?? `Obra ${o.year}`
    img.decoding = 'async'
    el.appendChild(img)
    container.appendChild(el)

    tags.set(body.id, { obra: o, el, w, h })
    used.add(o.id)
    World.add(world, body)
    return body
  }

  const libres = () => obras.filter((o) => !used.has(o.id))

  const irrumpir = (obra?: Obra) => {
    const pool = libres()
    const o = obra ?? (pool.length ? rng.pick(pool) : rng.pick(obras))
    if (used.has(o.id)) return
    // desde arriba (mayoría), o desde un costado a toda velocidad
    const lado = rng.next()
    if (lado < 0.7) {
      agregar(o, rng.range(W * 0.1, W * 0.9), -H * rng.range(0.2, 0.6), rng.range(-0.6, 0.6), {
        x: rng.range(-3, 3),
        y: rng.range(0, 4),
      })
    } else {
      const izq = lado < 0.85
      agregar(o, izq ? -W * 0.2 : W * 1.2, rng.range(H * 0.1, H * 0.6), rng.range(-1, 1), {
        x: izq ? rng.range(14, 24) : rng.range(-24, -14),
        y: rng.range(-6, 2),
      })
    }
  }

  const bodies = () => Composite.allBodies(world).filter((b) => tags.has(b.id))

  const impulso = () => {
    const bs = bodies()
    if (!bs.length) return
    const b = rng.pick(bs)
    Body.applyForce(b, b.position, {
      x: rng.range(-0.06, 0.06) * b.mass,
      y: rng.range(-0.14, -0.04) * b.mass,
    })
    Body.setAngularVelocity(b, rng.range(-0.25, 0.25))
  }

  let vuelcoTimer: number | undefined
  const vuelco = () => {
    engine.gravity.y = -0.9
    clearTimeout(vuelcoTimer)
    vuelcoTimer = window.setTimeout(() => (engine.gravity.y = 0.9), rng.range(1500, 3500))
  }

  const quitar = (b: Matter.Body) => {
    const t = tags.get(b.id)
    if (!t) return
    t.el.remove()
    tags.delete(b.id)
    used.delete(t.obra.id)
    World.remove(world, b)
  }

  const retirar = () => {
    const bs = bodies()
    if (bs.length < 4) return
    const b = rng.pick(bs)
    // se va volando hacia arriba; cuando sale del viewport, se elimina
    Body.setStatic(b, false)
    Body.applyForce(b, b.position, { x: rng.range(-0.05, 0.05) * b.mass, y: -0.55 * b.mass })
    Body.setAngularVelocity(b, rng.range(-0.4, 0.4))
    ;(b as Matter.Body & { _saliendo?: boolean })._saliendo = true
  }

  // mouse: arrastrar, y click corto = seleccionar
  const mouse = Mouse.create(container)
  const mc = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.25, damping: 0.15, render: { visible: false } },
  })
  World.add(world, mc)
  // que el scroll/zoom del mouse no lo agarre Matter
  const m = mouse as Matter.Mouse & { element: HTMLElement; mousewheel: EventListener }
  m.element.removeEventListener('wheel', m.mousewheel)
  m.element.removeEventListener('DOMMouseScroll', m.mousewheel)

  let downAt = 0
  let downPos = { x: 0, y: 0 }
  Events.on(mc, 'startdrag', (ev) => {
    const e = ev as unknown as { body: Matter.Body }
    downAt = performance.now()
    downPos = { ...e.body.position }
    const t = tags.get(e.body.id)
    if (t) t.el.style.zIndex = String(++zTop)
  })
  Events.on(mc, 'enddrag', (ev) => {
    const e = ev as unknown as { body: Matter.Body }
    const dt = performance.now() - downAt
    const d = Math.hypot(e.body.position.x - downPos.x, e.body.position.y - downPos.y)
    if (dt < 250 && d < 6) {
      const t = tags.get(e.body.id)
      if (t) onSelect?.(t.obra)
    }
  })

  let zTop = 10
  const sync = () => {
    for (const b of bodies()) {
      const t = tags.get(b.id)!
      const { x, y } = b.position
      t.el.style.transform = `translate3d(${x - t.w / 2}px, ${y - t.h / 2}px, 0) rotate(${b.angle}rad)`
      const s = (b as Matter.Body & { _saliendo?: boolean })._saliendo
      if ((s && y < -t.h * 2) || y > H + t.h * 3 || x < -W || x > W * 2) quitar(b)
    }
  }
  Events.on(engine, 'afterUpdate', sync)

  const runner = Runner.create()
  Runner.run(runner, engine)

  const onResize = () => {
    W = container.clientWidth
    H = container.clientHeight
    World.remove(world, walls)
    walls = makeWalls()
    World.add(world, walls)
  }
  const ro = new ResizeObserver(onResize)
  ro.observe(container)

  return {
    destroy: () => {
      ro.disconnect()
      clearTimeout(vuelcoTimer)
      Runner.stop(runner)
      Events.off(engine, 'afterUpdate', sync)
      World.clear(world, false)
      Engine.clear(engine)
      for (const t of tags.values()) t.el.remove()
      tags.clear()
    },
    irrumpir,
    impulso,
    vuelco,
    retirar,
    bodies,
  }
}
