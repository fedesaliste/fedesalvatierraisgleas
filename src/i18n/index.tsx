import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mulberry32 } from '../engine/random'
import { dict, LANGS, type Dict, type Lang } from './dict'

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const I18nCtx = createContext<Ctx | null>(null)

const esLang = (s: string | null): s is Lang => !!s && (LANGS as readonly string[]).includes(s)

/**
 * El idioma también es azar: sale de la semilla. Cada visita (y cada "otro
 * azar") cae en una lengua distinta, y ?seed=N la repite igual.
 */
export const langDeSemilla = (seed: number): Lang => mulberry32(seed ^ 0x1a46).pick(LANGS)

/** ?lang=xx manda (lo escribe el selector, o el link de "repetir"), pero solo para la semilla con la que vino */
function langDeUrl(): Lang | null {
  const l = new URLSearchParams(location.search).get('lang')
  return esLang(l) ? l : null
}

export function I18nProvider({ seed, children }: { seed: number; children: ReactNode }) {
  const [fijado, setFijado] = useState<{ seed: number; lang: Lang } | null>(() => {
    const l = langDeUrl()
    return l ? { seed, lang: l } : null
  })
  const lang = fijado && fijado.seed === seed ? fijado.lang : langDeSemilla(seed)

  const setLang = useCallback(
    (l: Lang) => {
      setFijado({ seed, lang: l })
      const url = new URL(location.href)
      url.searchParams.set('lang', l)
      history.replaceState(null, '', url)
    },
    [seed],
  )
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(() => ({ lang, t: dict[lang], setLang }), [lang, setLang])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  const c = useContext(I18nCtx)
  if (!c) throw new Error('useI18n fuera de I18nProvider')
  return c
}

export { LANGS, type Lang }
