import { LANGS, useI18n } from '../i18n'

export default function LangSwitch() {
  const { lang, setLang } = useI18n()
  // "?": cualquier otro idioma, el que toque
  const otro = () => {
    const resto = LANGS.filter((l) => l !== lang)
    setLang(resto[Math.floor(Math.random() * resto.length)])
  }
  return (
    <nav className="fixed right-4 top-4 z-[8000] flex gap-2 text-[11px] uppercase tracking-wider text-white mix-blend-difference md:right-6 md:top-5"
      aria-label="idioma">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`transition-opacity hover:opacity-100 ${lang === l ? 'underline decoration-2 underline-offset-4' : 'opacity-50'}`}
                  >
          {l}
        </button>
      ))}
      <button onClick={otro} className="opacity-50 transition-[opacity,rotate] duration-300 hover:rotate-180 hover:opacity-100" aria-label="?">
        ?
      </button>
    </nav>
  )
}
