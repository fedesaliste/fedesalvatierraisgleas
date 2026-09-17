# sin permiso — Federico Salvatierra Isgleas

Web experimental de arte plástico digital. El arte nace sin pedir permiso; acá las obras irrumpen, chocan y se apilan al azar. Cada visita tiene una semilla (`?seed=N`) que permite repetir exactamente el mismo caos.

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · GSAP · Matter.js · Supabase · Vercel

## Correr
```bash
npm i
npm run ingest   # procesa obras/<año>/*.png -> public/obras (recorte de fondo + WebP)
npm run dev
```

## Obras
Los originales viven en `obras/<año>/` (gitignored, ~6MB c/u). `npm run ingest` les saca el fondo blanco del estudio (flood-fill desde los bordes), genera WebP en 480/1024/1920 y escribe `src/data/obras.json`.

`obras/portadas/` hoy es una copia idéntica de `2020/` y se ignora.
