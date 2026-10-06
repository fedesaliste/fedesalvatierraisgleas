import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Obra } from '../lib/obras'
import { useI18n } from '../i18n'

export default function Detalle({ obra, onClose }: { obra: Obra; onClose: () => void }) {
  const { t } = useI18n()
  const img = useRef<HTMLImageElement>(null)
  // cada vez que se abre, la obra llega de otro lado y se endereza
  useEffect(() => {
    const a = Math.random() * Math.PI * 2
    const tw = gsap.fromTo(
      img.current,
      {
        x: Math.cos(a) * innerWidth * 0.4,
        y: Math.sin(a) * innerHeight * 0.4,
        rotate: gsap.utils.random(-35, 35),
        scale: gsap.utils.random(0.4, 0.7),
        opacity: 0,
      },
      { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.5)' },
    )
    return () => {
      tw.kill()
    }
  }, [obra])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-[9000] flex cursor-zoom-out items-center justify-center bg-papel/92 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <img
        ref={img}
        src={`/obras/${obra.year}/${obra.id}-${obra.sizes[obra.sizes.length - 1]}.webp`}
        alt={obra.title ?? `${t.obra} ${obra.year}`}
        className="max-h-[85vh] max-w-[90vw] object-contain drop-shadow-2xl"
      />
      <p className="absolute bottom-5 left-6 text-[11px] uppercase tracking-wider">
        {obra.title ?? t.sinTitulo} · {obra.year}
        {obra.technique ? ` · ${obra.technique}` : ''}
      </p>
      <button className="absolute right-6 top-5 text-[11px] uppercase tracking-wider underline" onClick={onClose}>
        {t.cerrar}
      </button>
    </div>
  )
}
