/**
 * Ingesta de obras: obras/<año>/*.png  ->  public/obras/<año>/<slug>-<w>.webp
 *
 * - Elimina el fondo blanco del estudio fotográfico (solo el conectado a los
 *   bordes de la foto: el blanco interno de la obra se conserva).
 * - Genera 3 tamaños WebP.
 * - Escribe src/data/obras.json con metadata para el sitio.
 *
 * Uso: npm run ingest            (solo procesa lo nuevo)
 *      npm run ingest -- --force (reprocesa todo)
 */
import sharp from 'sharp'
import { readdir, mkdir, writeFile, stat, unlink } from 'node:fs/promises'
import { join, parse } from 'node:path'

const SRC = 'obras'
const OUT = 'public/obras'
const META = 'src/data/obras.json'
const SIZES = [480, 1024, 1920]
const WHITE = 214 // umbral: r,g,b >= WHITE cuenta como fondo
const SKIP_DIRS = new Set(['portadas']) // copia duplicada de 2020, ver README

const force = process.argv.includes('--force')

type Obra = {
  id: string
  year: number
  file: string
  w: number
  h: number
  ratio: number
  sizes: number[]
  dominant: string
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Máscara alpha: flood-fill desde los bordes sobre píxeles casi blancos. */
function backgroundMask(rgba: Buffer, w: number, h: number): Buffer {
  const n = w * h
  const isWhite = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (rgba[o] >= WHITE && rgba[o + 1] >= WHITE && rgba[o + 2] >= WHITE) isWhite[i] = 1
  }
  const bg = new Uint8Array(n)
  const stack: number[] = []
  const push = (i: number) => {
    if (isWhite[i] && !bg[i]) {
      bg[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (stack.length) {
    const i = stack.pop()!
    const x = i % w
    if (x > 0) push(i - 1)
    if (x < w - 1) push(i + 1)
    if (i >= w) push(i - w)
    if (i < n - w) push(i + w)
  }
  const alpha = Buffer.alloc(n)
  for (let i = 0; i < n; i++) alpha[i] = bg[i] ? 0 : 255
  return alpha
}

function feather(a: Buffer, w: number, h: number): Buffer {
  const out = Buffer.alloc(a.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0
      let cnt = 0
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx < 0 || xx >= w) continue
          sum += a[yy * w + xx]
          cnt++
        }
      }
      out[y * w + x] = (sum / cnt) | 0
    }
  }
  return out
}

async function processOne(year: number, file: string): Promise<Obra> {
  const id = `${year}-${slug(parse(file).name)}`
  const outDir = join(OUT, String(year))
  await mkdir(outDir, { recursive: true })

  const src = sharp(join(SRC, String(year), file))
  const { data, info } = await src.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const alpha = backgroundMask(data, info.width, info.height)

  // suavizar borde de la máscara (box blur 3x3, dos pasadas) para que el rasgado no quede dentado
  const softAlpha = feather(feather(alpha, info.width, info.height), info.width, info.height)

  // RGB original + alpha suavizado
  const rgba = Buffer.from(data)
  for (let i = 0, n = info.width * info.height; i < n; i++) rgba[i * 4 + 3] = softAlpha[i]
  const base = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({
    threshold: 5,
  })
  const trimmed = await base.png().toBuffer({ resolveWithObject: true })

  const sizes: number[] = []
  for (const s of SIZES) {
    if (s > trimmed.info.width && sizes.length) break
    await sharp(trimmed.data)
      .resize({ width: Math.min(s, trimmed.info.width) })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(join(outDir, `${id}-${s}.webp`))
    sizes.push(s)
  }

  const { dominant } = await sharp(trimmed.data).stats()
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')

  return {
    id,
    year,
    file,
    w: trimmed.info.width,
    h: trimmed.info.height,
    ratio: +(trimmed.info.width / trimmed.info.height).toFixed(4),
    sizes,
    dominant: hex,
  }
}

async function exists(p: string) {
  return stat(p).then(() => true, () => false)
}

async function main() {
  const years = (await readdir(SRC, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name) && /^\d{4}$/.test(d.name))
    .map((d) => +d.name)
    .sort()

  let prev: Obra[] = []
  if (!force && (await exists(META))) prev = JSON.parse(await (await import('node:fs/promises')).readFile(META, 'utf8'))
  const byId = new Map(prev.map((o) => [o.id, o]))

  const obras: Obra[] = []
  for (const year of years) {
    const files = (await readdir(join(SRC, String(year)))).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
    for (const file of files) {
      const id = `${year}-${slug(parse(file).name)}`
      const cached = byId.get(id)
      const derivadosOk =
        cached && (await Promise.all(cached.sizes.map((sz) => exists(join(OUT, String(year), `${id}-${sz}.webp`))))).every(Boolean)
      if (cached && derivadosOk) {
        obras.push(cached)
        continue
      }
      process.stdout.write(`  ${year}/${file} ... `)
      const t = Date.now()
      obras.push(await processOne(year, file))
      console.log(`${Date.now() - t}ms`)
    }
  }
  // limpieza: derivados cuya fuente ya no existe (obra borrada de obras/<año>/)
  const vivos = new Set(obras.map((o) => o.id))
  let borrados = 0
  for (const year of years) {
    const dir = join(OUT, String(year))
    if (!(await exists(dir))) continue
    for (const f of await readdir(dir)) {
      const id = f.replace(/-\d+\.webp$/, '')
      if (!vivos.has(id)) {
        await unlink(join(dir, f))
        borrados++
      }
    }
  }
  if (borrados) console.log(`  limpiados ${borrados} derivados sin fuente`)

  await mkdir('src/data', { recursive: true })
  await writeFile(META, JSON.stringify(obras, null, 2))
  console.log(`\n${obras.length} obras -> ${META}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
