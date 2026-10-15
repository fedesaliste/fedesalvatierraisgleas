/**
 * Lo que alguien vio en la obra, dicho cada vez distinto. Cada obra tiene tres
 * cosas que de verdad se ven (data/miradas.json); se arman con un molde al
 * azar: a veces describe, a veces se va por las ramas, a veces mete algo que
 * no está. Nunca se sabe cuál toca.
 *
 * Los moldes dejan cada pedazo suelto (después de una coma, de dos puntos o
 * como objeto directo) para no pelearse con artículos ni concordancias.
 */
import type { Lang } from '../i18n'

type Miradas = Record<string, Record<Lang, string[]>>

/** {a} {b} {c}: lo que se ve, en otro orden cada vez. {z}: algo que no está */
type Moldes = {
  literal: string[]
  rama: string[]
  absurdo: string[]
  z: string[]
}

const MOLDES: Record<Lang, Moldes> = {
  es: {
    literal: [
      '{a}. {b}. {c}.',
      '{a}, y al lado, {b}.',
      'primero, {a}. después, {b}.',
      '{a}. eso es todo.',
      'acá: {a}, {b}.',
      '{a}. {b}. y {c}, si querés.',
    ],
    rama: [
      '{a}, como si nadie mirara.',
      '{a}. o eso parece.',
      'alguien dejó esto: {a}. y se fue.',
      '{a}, esperando. {b}, también.',
      'lo importante no es lo que parece: {b}.',
      '{a}, de nuevo. siempre vuelve.',
      'si te alejás un paso: {b}. si te acercás: {a}.',
    ],
    absurdo: [
      '{a}, pero en realidad {z}.',
      'si mirás bien: {z}.',
      '{a}. y además, aunque no se vea, {z}.',
      '{a}. {z}. {b}.',
      'esta obra trata de {z}. un poco, también: {a}.',
      '{a}. me hace acordar a {z}.',
    ],
    z: [
      'un perro que no está',
      'un zumbido de heladera',
      'una tarde de 1987',
      'la abuela de alguien',
      'un domingo sin fútbol',
      'una sopa que se enfrió',
      'un mar, de lejos',
      'un error a propósito',
      'una canción que no termina',
      'un permiso que nadie pidió',
      'una llave que no abre nada',
      'un ómnibus que no para',
      'una siesta interrumpida',
      'un nombre que se olvidó',
    ],
  },
  en: {
    literal: [
      '{a}. {b}. {c}.',
      '{a}, and next to it, {b}.',
      'first, {a}. then, {b}.',
      '{a}. that’s all.',
      'here: {a}, {b}.',
      '{a}. {b}. and {c}, if you like.',
    ],
    rama: [
      '{a}, as if nobody were looking.',
      '{a}. or so it seems.',
      'someone left this: {a}. and walked away.',
      '{a}, waiting. {b}, too.',
      'what matters isn’t what it looks like: {b}.',
      '{a}, again. it always comes back.',
      'step back: {b}. step closer: {a}.',
    ],
    absurdo: [
      '{a}, but really {z}.',
      'if you look closely: {z}.',
      '{a}. and also, though you can’t see it, {z}.',
      '{a}. {z}. {b}.',
      'this work is about {z}. and about {a}, a little.',
      '{a}. it reminds me of {z}.',
    ],
    z: [
      'a dog that isn’t there',
      'the hum of the fridge',
      'an afternoon in 1987',
      'somebody’s grandmother',
      'a sunday with no football',
      'soup gone cold',
      'the sea, from far away',
      'a mistake on purpose',
      'a song that never ends',
      'a permission nobody asked for',
      'a key that opens nothing',
      'a bus that doesn’t stop',
      'an interrupted nap',
      'a forgotten name',
    ],
  },
  it: {
    literal: [
      '{a}. {b}. {c}.',
      '{a}, e accanto, {b}.',
      'prima, {a}. poi, {b}.',
      '{a}. tutto qui.',
      'qui: {a}, {b}.',
      '{a}. {b}. e {c}, se vuoi.',
    ],
    rama: [
      '{a}, come se nessuno guardasse.',
      '{a}. o almeno così sembra.',
      'qualcuno ha lasciato questo: {a}. e se n’è andato.',
      '{a}, in attesa. {b}, anche.',
      'l’importante non è quello che sembra: {b}.',
      '{a}, di nuovo. torna sempre.',
      'se ti allontani: {b}. se ti avvicini: {a}.',
    ],
    absurdo: [
      '{a}, ma in realtà {z}.',
      'se guardi bene: {z}.',
      '{a}. e poi, anche se non si vede, {z}.',
      '{a}. {z}. {b}.',
      'quest’opera, in fondo, è {z}. e un po’ anche questo: {a}.',
      '{a}. mi ricorda {z}.',
    ],
    z: [
      'un cane che non c’è',
      'il ronzio del frigorifero',
      'un pomeriggio del 1987',
      'la nonna di qualcuno',
      'una domenica senza calcio',
      'una zuppa ormai fredda',
      'il mare, da lontano',
      'un errore voluto',
      'una canzone che non finisce',
      'un permesso che nessuno ha chiesto',
      'una chiave che non apre niente',
      'un autobus che non si ferma',
      'un pisolino interrotto',
      'un nome dimenticato',
    ],
  },
  fr: {
    literal: [
      '{a}. {b}. {c}.',
      '{a}, et à côté, {b}.',
      'd’abord, {a}. ensuite, {b}.',
      '{a}. c’est tout.',
      'ici : {a}, {b}.',
      '{a}. {b}. et {c}, si tu veux.',
    ],
    rama: [
      '{a}, comme si personne ne regardait.',
      '{a}. du moins, on dirait.',
      'quelqu’un a laissé ça : {a}. et il est parti.',
      '{a}, en attente. {b}, aussi.',
      'l’important n’est pas ce qu’on croit : {b}.',
      '{a}, encore. ça revient toujours.',
      'recule d’un pas : {b}. approche-toi : {a}.',
    ],
    absurdo: [
      '{a}, mais en vrai, {z}.',
      'si tu regardes bien : {z}.',
      '{a}. et aussi, même si ça ne se voit pas, {z}.',
      '{a}. {z}. {b}.',
      'cette œuvre, au fond, c’est {z}. et un peu ça : {a}.',
      '{a}. ça me rappelle {z}.',
    ],
    z: [
      'un chien qui n’est pas là',
      'le ronron du frigo',
      'un après-midi de 1987',
      'la grand-mère de quelqu’un',
      'un dimanche sans foot',
      'une soupe qui a refroidi',
      'la mer, de loin',
      'une erreur exprès',
      'une chanson qui ne finit pas',
      'une permission que personne n’a demandée',
      'une clé qui n’ouvre rien',
      'un bus qui ne s’arrête pas',
      'une sieste interrompue',
      'un nom oublié',
    ],
  },
  ja: {
    literal: [
      '{a}。{b}。{c}。',
      '{a}、そのとなりに{b}。',
      'まず{a}。それから{b}。',
      '{a}。それだけ。',
      'ここに、{a}と{b}。',
    ],
    rama: [
      '{a}、誰も見ていないみたいに。',
      '{a}。たぶん。',
      '誰かがこれを置いていった。{a}。',
      '{a}が待っている。{b}も。',
      '大事なのは見た目じゃない。{b}。',
      'また{a}。いつも戻ってくる。',
      '一歩下がると{b}。近づくと{a}。',
    ],
    absurdo: [
      '{a}。でも本当は{z}。',
      'よく見ると、{z}。',
      '{a}。見えないけど、{z}も。',
      '{a}。{z}。{b}。',
      'この作品は{z}の話。少しだけ{a}の話。',
      '{a}。{z}を思い出す。',
    ],
    z: [
      'いない犬',
      '冷蔵庫の音',
      '1987年のある午後',
      '誰かのおばあちゃん',
      'サッカーのない日曜日',
      '冷めたスープ',
      '遠くの海',
      'わざとの間違い',
      '終わらない歌',
      '誰も頼まなかった許可',
      '何も開けない鍵',
      '止まらないバス',
      '途中で起こされた昼寝',
      '忘れた名前',
    ],
  },
}

let cache: Promise<Miradas> | null = null
/** los textos van aparte: solo se bajan cuando alguien abre una obra */
const cargar = () => (cache ??= import('../data/miradas.json').then((m) => m.default as Miradas))

const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]
const mezclar = <T>(arr: readonly T[]) => [...arr].sort(() => Math.random() - 0.5)

/** una mirada nueva sobre la obra; null si la obra no tiene ninguna */
export async function mirar(id: string, lang: Lang): Promise<string | null> {
  const vistos = (await cargar())[id]?.[lang]
  if (!vistos?.length) return null
  const m = MOLDES[lang]
  // describe, se va por las ramas o mete algo que no está
  const r = Math.random()
  const molde = pick(r < 0.4 ? m.literal : r < 0.75 ? m.rama : m.absurdo)
  const [a, b = a, c = b] = mezclar(vistos)
  return molde.replace('{a}', a).replace('{b}', b).replace('{c}', c).replace('{z}', pick(m.z))
}
