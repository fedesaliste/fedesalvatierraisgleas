import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { visitas, type Visitas } from '../lib/visitas'
import TextoAzar from './TextoAzar'

const MOSTRAR = 5

/**
 * Cuántas personas pasaron y desde dónde. Los países salen en el idioma de la
 * visita (Intl.DisplayNames) y el tuyo va en el color del acento. Si no hay
 * números (desarrollo, sin conexión) no se muestra nada.
 */
export default function Contador({ seed }: { seed: number }) {
  const { t, lang } = useI18n()
  const [v, setV] = useState<Visitas | null>(null)
  useEffect(() => {
    visitas().then(setV)
  }, [])
  if (!v || v.total < 1) return null

  const num = new Intl.NumberFormat(lang)
  let nombres: Intl.DisplayNames | null = null
  try {
    nombres = new Intl.DisplayNames([lang], { type: 'region' })
  } catch {
    // navegador viejo: quedan los códigos
  }
  const nombre = (pais: string) => (pais === 'XX' ? t.paisDesconocido : (nombres?.of(pais) ?? pais).toLowerCase())

  const frase = v.total === 1 ? t.visitasUna : t.visitas.replace('{n}', num.format(v.total))
  const resto = v.paises.length - MOSTRAR
  const mas = resto === 1 ? t.masPaisUno : t.masPaises.replace('{n}', num.format(resto))

  return (
    <div className="mt-20 max-w-3xl">
      <TextoAzar
        as="p"
        texto={frase}
        seed={seed ^ v.total}
        className="font-display text-[clamp(1.4rem,3.4vw,2.6rem)] uppercase leading-[0.95]"
      />
      <p className="mt-3 text-[13px] leading-relaxed">
        {v.paises.slice(0, MOSTRAR).map((p, i) => (
          <span key={p.pais}>
            {i > 0 && <span className="opacity-40"> · </span>}
            <span style={p.pais === v.tuyo ? { color: 'var(--acento)' } : undefined}>
              {nombre(p.pais)} {num.format(p.visitas)}
            </span>
          </span>
        ))}
        {resto > 0 && <span className="opacity-60"> · {mas}</span>}
      </p>
    </div>
  )
}
