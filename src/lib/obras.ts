import data from '../data/obras.json'

export type Obra = {
  id: string
  year: number
  file: string
  w: number
  h: number
  ratio: number
  sizes: number[]
  dominant: string
  title?: string
  technique?: string
}

export const obras: Obra[] = data as Obra[]

export function src(o: Obra, size: number) {
  const s = o.sizes.reduce((best, cur) => (cur >= size && cur < best ? cur : best), o.sizes[o.sizes.length - 1])
  return `/obras/${o.year}/${o.id}-${s}.webp`
}

export function srcSet(o: Obra) {
  return o.sizes.map((s) => `/obras/${o.year}/${o.id}-${s}.webp ${s}w`).join(', ')
}

export const years = [...new Set(obras.map((o) => o.year))].sort()
