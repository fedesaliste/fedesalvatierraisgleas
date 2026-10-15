/**
 * Contador de visitas por país. Vercel dice de dónde viene cada visita
 * (x-vercel-ip-country) sin cookies ni IPs guardadas; acá solo se suma 1 a ese
 * país en Supabase y se devuelven todos. Que la visita sea nueva lo decide el
 * navegador (ver src/lib/visitas.ts).
 */
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|lighthouse|headless/i

export async function POST(request: Request): Promise<Response> {
  const url = process.env.SINPERMISO_SUPABASE_URL
  const key = process.env.SINPERMISO_SUPABASE_KEY
  if (!url || !key) return Response.json({ error: 'sin configurar' }, { status: 503 })

  let nueva = false
  try {
    nueva = (await request.json())?.nueva === true
  } catch {
    // sin cuerpo: solo se leen los números
  }
  // los robots miran pero no cuentan
  if (BOTS.test(request.headers.get('user-agent') ?? '')) nueva = false
  const pais = (request.headers.get('x-vercel-ip-country') ?? 'XX').toUpperCase()

  const r = await fetch(`${url}/rest/v1/rpc/sinpermiso_contar`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_pais: pais, p_nueva: nueva }),
  })
  if (!r.ok) return Response.json({ error: 'no se pudo contar' }, { status: 502 })

  const paises = (await r.json()) as { pais: string; visitas: number }[]
  const total = paises.reduce((s, p) => s + p.visitas, 0)
  return Response.json({ total, paises, tuyo: pais }, { headers: { 'Cache-Control': 'no-store' } })
}
