import type { Rng } from '../engine/random'
import { useI18n } from '../i18n'
import { BIO } from '../data/manifiesto'

export default function Bio({ rng }: { rng: Rng }) {
  const { t } = useI18n()
  return (
    <section className="relative z-10 flex min-h-[70vh] flex-col justify-between bg-papel px-4 py-24 md:px-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[clamp(2.4rem,7vw,6rem)] leading-[0.9]">{BIO.nombre}</h2>
          <p className="mt-3 text-[11px] uppercase tracking-wider opacity-70">
            {t.roles} · {t.rotulo} · {t.origen}
          </p>
        </div>
        <div className="max-w-md space-y-6 self-end text-[15px] leading-relaxed">
          <p>{t.bio}</p>
          <p>
            <span className="text-[11px] uppercase tracking-wider opacity-70">{t.contacto} — </span>
            <a href="mailto:fede@grupodte.com" className="underline decoration-[var(--acento)] decoration-2 underline-offset-4">
              {t.escribime}
            </a>
          </p>
        </div>
      </div>
      <footer className="mt-24 flex flex-wrap items-end justify-between gap-4 border-t border-tinta/30 pt-4 text-[11px] uppercase tracking-wider opacity-70">
        <span>
          {t.creditos} <a className="underline" href={`?seed=${rng.seed}`}>#{rng.seed.toString(36)}</a>
        </span>
        <span>© {new Date().getFullYear()} · {t.rotulo}</span>
      </footer>
    </section>
  )
}
