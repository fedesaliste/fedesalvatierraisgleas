/**
 * Cuántas personas pasaron y de dónde. Cada navegador cuenta una sola vez: la
 * primera vez avisa que es nueva y se anota que ya contó. Si vuelve, solo lee.
 * Nada de cookies ni datos personales; la otra punta es api/visita.ts.
 */
export type Visitas = { total: number; paises: { pais: string; visitas: number }[]; tuyo: string }

const MARCA = 'sinpermiso:contado'

const yaContado = () => {
  try {
    return localStorage.getItem(MARCA) === '1'
  } catch {
    // sin storage (ventana privada, bloqueado): se cuenta como nueva
    return false
  }
}

let cache: Promise<Visitas | null> | null = null

/** se pide una sola vez por carga; en desarrollo (sin /api) da null y no se muestra nada */
export const visitas = () =>
  (cache ??= (async () => {
    try {
      const nueva = !yaContado()
      const r = await fetch('/api/visita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva }),
      })
      if (!r.ok) return null
      const v = (await r.json()) as Visitas
      if (nueva) {
        try {
          localStorage.setItem(MARCA, '1')
        } catch {
          // no pasa nada: la próxima vez vuelve a contar
        }
      }
      return v
    } catch {
      return null
    }
  })())
