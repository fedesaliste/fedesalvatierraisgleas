import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dict, LANGS, type Dict, type Lang } from './dict'

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const I18nCtx = createContext<Ctx | null>(null)

function detect(): Lang {
  const url = new URLSearchParams(location.search).get('lang')
  if (url && (LANGS as readonly string[]).includes(url)) return url as Lang
  try {
    const saved = localStorage.getItem('lang')
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang
  } catch {}
  const nav = navigator.language.slice(0, 2)
  return (LANGS as readonly string[]).includes(nav) ? (nav as Lang) : 'es'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('lang', l)
    } catch {}
  }
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(() => ({ lang, t: dict[lang], setLang }), [lang])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  const c = useContext(I18nCtx)
  if (!c) throw new Error('useI18n fuera de I18nProvider')
  return c
}

export { LANGS, type Lang }
