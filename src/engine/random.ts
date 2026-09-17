/**
 * Azar reproducible. Cada visita tiene una semilla; con ?seed=N se repite
 * exactamente el mismo caos. "Lo que quedó plasmado sin querer" se puede volver a ver.
 */
export type Rng = {
  seed: number
  next: () => number // [0,1)
  range: (min: number, max: number) => number
  int: (min: number, max: number) => number
  pick: <T>(arr: readonly T[]) => T
  chance: (p: number) => boolean
  shuffle: <T>(arr: readonly T[]) => T[]
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    seed,
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle: (arr) => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
  return rng
}

export function seedFromUrl(): number {
  const p = new URLSearchParams(location.search).get('seed')
  if (p && /^\d+$/.test(p)) return +p
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}

/** paleta sacada de las obras: rojo, amarillo, verde, azul, violeta, naranja */
export const ACENTOS = ['#d0281e', '#e3b91c', '#3aa64a', '#2f6fd6', '#7a3fb5', '#e0641c'] as const
