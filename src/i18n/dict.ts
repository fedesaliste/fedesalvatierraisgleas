export const LANGS = ['es', 'en', 'it', 'fr', 'ja'] as const
export type Lang = (typeof LANGS)[number]

export type Dict = {
  langName: string
  rotulo: string
  origen: string
  roles: string
  visita: string
  repetir: string
  otroAzar: string
  hint: string
  scrollHint: string
  sinTitulo: string
  obra: string
  cerrar: string
  sedimento: string
  sedimentoSub: string
  manifiesto: string
  statement: string[]
  bio: string
  contacto: string
  escribime: string
  creditos: string
  fragmentos: string[]
  luz: {
    titulo: string
    sub: string
    pasos: [string, string, string, string]
    frases: [string, string, string, string]
    escala: string
    registro: string
    registroSub: string
  }
}

export const dict: Record<Lang, Dict> = {
  es: {
    langName: 'Español',
    rotulo: 'arte plástico digital',
    origen: 'Uruguay',
    roles: 'arquitecto · artista',
    visita: 'visita',
    repetir: 'repetir este azar',
    otroAzar: 'otro azar',
    hint: 'arrastrá · soltá · dejá que pase',
    scrollHint: 'scrolleá para sacudir',
    sinTitulo: 'sin título',
    obra: 'obra',
    cerrar: 'cerrar',
    sedimento: 'sedimento',
    sedimentoSub: 'lo que quedó',
    manifiesto: 'manifiesto',
    statement: [
      'El arte nace sin pedir permiso.',
      'No nace para satisfacer una necesidad: nace del impulso.',
      'Me interesa lo que queda plasmado sin querer. El azar como coautor.',
      'Mezclo técnicas plásticas —collage, serigrafía, pintura sobre tela y papel— con lo digital como medio para la perpetuidad de lo efímero.',
    ],
    bio: 'Federico Salvatierra Isgleas (Uruguay). Arquitecto y artista visual. Trabaja bajo el rótulo de arte plástico digital.',
    contacto: 'contacto',
    escribime: 'escribime',
    creditos: 'cada visita es distinta. esta fue la',
    luz: {
      titulo: 'luz',
      sub: 'cómo se hace',
      pasos: ['recolectar', 'componer', 'fotografiar', 'proyectar'],
      frases: [
        'fragmentos de vidrio, papel, aluminio: restos que por distintas circunstancias terminan cruzándose en mi camino.',
        'no se planea. se reorganiza lo que apareció, como quien recoge huellas.',
        'luz natural, exposición rapidísima. la obra puede romperse o desaparecer; la imagen queda.',
        'lo pequeño se vuelve inmenso. lo accidental, paisaje. lo descartado, visible.',
      ],
      escala: 'cabe en una mano',
      registro: 'en sala',
      registroSub: 'así podría verse: lo que cabe en una mano, del tamaño de una pared',
    },
    fragmentos: [
      'el arte nace sin pedir permiso',
      'no nace para satisfacer una necesidad',
      'nace del impulso',
      'lo que queda plasmado sin querer',
      'el azar también firma',
      'lo digital como perpetuidad de lo efímero',
      'nada de esto fue planeado',
      'esto también va a desaparecer',
      'tocá, movélo, rompélo',
      'cada visita es otra',
      'no hay orden, hay acumulación',
    ],
  },
  en: {
    langName: 'English',
    rotulo: 'digital plastic art',
    origen: 'Uruguay',
    roles: 'architect · artist',
    visita: 'visit',
    repetir: 'replay this chance',
    otroAzar: 'another chance',
    hint: 'drag · drop · let it happen',
    scrollHint: 'scroll to shake',
    sinTitulo: 'untitled',
    obra: 'work',
    cerrar: 'close',
    sedimento: 'sediment',
    sedimentoSub: 'what remained',
    manifiesto: 'manifesto',
    statement: [
      'Art is born without asking permission.',
      'It is not born to satisfy a need: it is born from impulse.',
      'I am drawn to what gets fixed by accident. Chance as co-author.',
      'I mix plastic techniques —collage, screen printing, paint on canvas and paper— with the digital as a means for the permanence of the ephemeral.',
    ],
    bio: 'Federico Salvatierra Isgleas (Uruguay). Architect and visual artist. Works under the label of digital plastic art.',
    contacto: 'contact',
    escribime: 'write me',
    creditos: 'every visit is different. this one was',
    luz: {
      titulo: 'light',
      sub: 'how it is made',
      pasos: ['collect', 'compose', 'photograph', 'project'],
      frases: [
        'shards of glass, paper, aluminium: remains that, for one reason or another, cross my path.',
        'nothing is planned. what showed up gets rearranged, like picking up traces.',
        'natural light, a very fast exposure. the piece may break or vanish; the image stays.',
        'the small becomes immense. the accidental, a landscape. the discarded, visible.',
      ],
      escala: 'fits in one hand',
      registro: 'in the room',
      registroSub: 'how it could look: what fits in one hand, the size of a wall',
    },
    fragmentos: [
      'art is born without asking permission',
      'it is not born to satisfy a need',
      'it is born from impulse',
      'what gets fixed by accident',
      'chance also signs',
      'the digital as permanence of the ephemeral',
      'none of this was planned',
      'this too will disappear',
      'touch it, move it, break it',
      'every visit is another one',
      'there is no order, there is accumulation',
    ],
  },
  it: {
    langName: 'Italiano',
    rotulo: 'arte plastica digitale',
    origen: 'Uruguay',
    roles: 'architetto · artista',
    visita: 'visita',
    repetir: 'ripeti questo caso',
    otroAzar: 'un altro caso',
    hint: 'trascina · lascia · lascia che accada',
    scrollHint: 'scorri per scuotere',
    sinTitulo: 'senza titolo',
    obra: 'opera',
    cerrar: 'chiudi',
    sedimento: 'sedimento',
    sedimentoSub: 'ciò che è rimasto',
    manifiesto: 'manifesto',
    statement: [
      "L'arte nasce senza chiedere permesso.",
      "Non nasce per soddisfare un bisogno: nasce dall'impulso.",
      "Mi interessa ciò che resta fissato senza volerlo. Il caso come coautore.",
      'Mescolo tecniche plastiche —collage, serigrafia, pittura su tela e carta— con il digitale come mezzo per la perpetuità dell\'effimero.',
    ],
    bio: "Federico Salvatierra Isgleas (Uruguay). Architetto e artista visivo. Lavora sotto l'etichetta di arte plastica digitale.",
    contacto: 'contatto',
    escribime: 'scrivimi',
    creditos: 'ogni visita è diversa. questa è stata la',
    luz: {
      titulo: 'luce',
      sub: 'come si fa',
      pasos: ['raccogliere', 'comporre', 'fotografare', 'proiettare'],
      frases: [
        'frammenti di vetro, carta, alluminio: resti che per circostanze diverse incrociano la mia strada.',
        'non si pianifica. si riorganizza ciò che è apparso, come chi raccoglie tracce.',
        'luce naturale, esposizione rapidissima. l’opera può rompersi o sparire; l’immagine resta.',
        'il piccolo diventa immenso. l’accidentale, paesaggio. lo scartato, visibile.',
      ],
      escala: 'sta in una mano',
      registro: 'in sala',
      registroSub: 'come potrebbe vedersi: ciò che sta in una mano, grande come una parete',
    },
    fragmentos: [
      "l'arte nasce senza chiedere permesso",
      'non nasce per soddisfare un bisogno',
      "nasce dall'impulso",
      'ciò che resta fissato senza volerlo',
      'anche il caso firma',
      "il digitale come perpetuità dell'effimero",
      'niente di questo era previsto',
      'anche questo sparirà',
      'tocca, muovi, rompi',
      "ogni visita è un'altra",
      "non c'è ordine, c'è accumulo",
    ],
  },
  fr: {
    langName: 'Français',
    rotulo: 'art plastique numérique',
    origen: 'Uruguay',
    roles: 'architecte · artiste',
    visita: 'visite',
    repetir: 'rejouer ce hasard',
    otroAzar: 'un autre hasard',
    hint: 'glisse · lâche · laisse faire',
    scrollHint: 'scrolle pour secouer',
    sinTitulo: 'sans titre',
    obra: 'œuvre',
    cerrar: 'fermer',
    sedimento: 'sédiment',
    sedimentoSub: 'ce qui est resté',
    manifiesto: 'manifeste',
    statement: [
      "L'art naît sans demander la permission.",
      "Il ne naît pas pour satisfaire un besoin : il naît de l'impulsion.",
      "Ce qui m'intéresse, c'est ce qui se fixe sans le vouloir. Le hasard comme coauteur.",
      "Je mêle des techniques plastiques —collage, sérigraphie, peinture sur toile et papier— au numérique comme moyen de perpétuer l'éphémère.",
    ],
    bio: "Federico Salvatierra Isgleas (Uruguay). Architecte et artiste visuel. Travaille sous l'étiquette d'art plastique numérique.",
    contacto: 'contact',
    escribime: 'écris-moi',
    creditos: 'chaque visite est différente. celle-ci était la',
    luz: {
      titulo: 'lumière',
      sub: 'comment ça se fait',
      pasos: ['ramasser', 'composer', 'photographier', 'projeter'],
      frases: [
        'éclats de verre, papier, aluminium : des restes qui, par hasard, croisent mon chemin.',
        'rien n’est planifié. on réorganise ce qui est apparu, comme on ramasse des traces.',
        'lumière naturelle, exposition très rapide. l’œuvre peut se casser ou disparaître ; l’image reste.',
        'le petit devient immense. l’accidentel, paysage. le rebut, visible.',
      ],
      escala: 'tient dans une main',
      registro: 'en salle',
      registroSub: 'comment ça pourrait se voir : ce qui tient dans une main, à la taille d’un mur',
    },
    fragmentos: [
      "l'art naît sans demander la permission",
      'il ne naît pas pour satisfaire un besoin',
      "il naît de l'impulsion",
      'ce qui se fixe sans le vouloir',
      'le hasard signe aussi',
      "le numérique comme perpétuité de l'éphémère",
      "rien de tout ça n'était prévu",
      'ceci aussi va disparaître',
      'touche, bouge, casse',
      'chaque visite en est une autre',
      "il n'y a pas d'ordre, il y a accumulation",
    ],
  },
  ja: {
    langName: '日本語',
    rotulo: 'デジタル造形芸術',
    origen: 'ウルグアイ',
    roles: '建築家 · アーティスト',
    visita: '訪問',
    repetir: 'この偶然をもう一度',
    otroAzar: '別の偶然',
    hint: 'つかむ · はなす · なりゆきにまかせる',
    scrollHint: 'スクロールして揺らす',
    sinTitulo: '無題',
    obra: '作品',
    cerrar: '閉じる',
    sedimento: '堆積',
    sedimentoSub: '残ったもの',
    manifiesto: 'マニフェスト',
    statement: [
      '芸術は許しを求めずに生まれる。',
      '必要を満たすために生まれるのではない。衝動から生まれる。',
      '意図せず刻まれたものに惹かれる。偶然は共作者だ。',
      'コラージュ、シルクスクリーン、布や紙への絵画といった造形技法と、儚いものを永続させる手段としてのデジタルを混ぜ合わせる。',
    ],
    bio: 'フェデリコ・サルバティエラ・イスグレアス（ウルグアイ）。建築家、ビジュアルアーティスト。「デジタル造形芸術」の名のもとに制作。',
    contacto: '連絡',
    escribime: 'メールを送る',
    creditos: '訪問はそれぞれ違う。これは',
    luz: {
      titulo: '光',
      sub: 'つくりかた',
      pasos: ['拾う', '組む', '撮る', '投影する'],
      frases: [
        'ガラスの破片、紙、アルミ。さまざまな偶然で私の道に現れた残骸。',
        '計画はしない。現れたものを並べ直す。痕跡を拾うように。',
        '自然光、きわめて速い露光。作品は壊れ消えるかもしれないが、像は残る。',
        '小さなものが巨大になる。偶然が風景に。捨てられたものが見えるものに。',
      ],
      escala: '手のひらに収まる',
      registro: '展示室で',
      registroSub: 'こう見えるかもしれない。手のひらに収まるものが、壁の大きさに',
    },
    fragmentos: [
      '芸術は許しを求めずに生まれる',
      '必要を満たすために生まれるのではない',
      '衝動から生まれる',
      '意図せず刻まれたもの',
      '偶然もまた署名する',
      '儚いものを永続させるデジタル',
      'どれも計画されていない',
      'これも消えていく',
      '触って、動かして、壊して',
      '訪問はいつも別のもの',
      '秩序はない、堆積がある',
    ],
  },
}
