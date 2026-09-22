/**
 * Gente mirando: siluetas recortadas de una foto, con su altura relativa
 * (1 = la persona más alta del grupo) para que chicos y adultos convivan.
 */
export type Persona = { file: string; ratio: number; alto: number }

export const GENTE: Persona[] = [
  { file: '01.png', ratio: 0.3380, alto: 1.000 },
  { file: '02.png', ratio: 0.2921, alto: 0.932 },
  { file: '03.png', ratio: 0.3212, alto: 0.712 },
  { file: '04.png', ratio: 0.3490, alto: 0.889 },
  { file: '05.png', ratio: 0.3293, alto: 0.984 },
  { file: '06.png', ratio: 0.2911, alto: 0.785 },
  { file: '07.png', ratio: 0.2937, alto: 0.920 },
  { file: '08.png', ratio: 0.3280, alto: 0.994 },
  { file: '09.png', ratio: 0.3168, alto: 0.960 },
  { file: '10.png', ratio: 0.3057, alto: 0.839 },
  { file: '11.png', ratio: 0.3768, alto: 0.944 },
  { file: '12.png', ratio: 0.2946, alto: 0.803 },
]
