/**
 * Gente mirando: siluetas recortadas de una foto. Cada una tiene su altura real
 * en metros, y en la sala todas se dibujan a la misma escala (como paradas en
 * la misma línea frente a la pared): un nene de 1,35 m mide exactamente
 * 1,35/1,82 de lo que mide el hombre de 1,82 m.
 *
 * `quien` agrupa siluetas que se leen como el mismo personaje (los dos nenes
 * con gorra): de cada grupo entra uno solo, para que nadie parezca repetido.
 */
export type Persona = { file: string; ratio: number; metros: number; quien: string }

export const GENTE: Persona[] = [
  { file: '01.png', ratio: 0.339, metros: 1.78, quien: 'hombre con buzo' },
  { file: '02.png', ratio: 0.2921, metros: 1.65, quien: 'mujer con cola de caballo' },
  { file: '03.png', ratio: 0.3212, metros: 1.35, quien: 'nene con gorra' },
  { file: '04.png', ratio: 0.351, metros: 1.58, quien: 'señora mayor' },
  { file: '05.png', ratio: 0.33, metros: 1.75, quien: 'muchacho de rulos' },
  { file: '06.png', ratio: 0.2919, metros: 1.25, quien: 'nena de colitas' },
  { file: '07.png', ratio: 0.2947, metros: 1.68, quien: 'mujer de pelo largo' },
  { file: '08.png', ratio: 0.328, metros: 1.82, quien: 'hombre de barba' },
  { file: '09.png', ratio: 0.3178, metros: 1.66, quien: 'mujer con cartera' },
  { file: '10.png', ratio: 0.3057, metros: 1.5, quien: 'nene con gorra' },
  { file: '11.png', ratio: 0.378, metros: 1.72, quien: 'señor con bastón' },
  { file: '12.png', ratio: 0.2946, metros: 1.5, quien: 'nena de pollera' },
]
