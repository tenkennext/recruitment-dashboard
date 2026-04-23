export type Verdict = 'Avanzar' | 'Considerar' | 'Descartar' | 'Error de lectura/Incompleto';

export interface Candidate {
  id: string;
  name: string;
  score: number;
  verdict: Verdict;
  justification: string[];
  strengths: string;
  gaps: string;
  isTop3?: boolean;
}

export interface JobRequirement {
  type: 'Must-have' | 'Nice-to-have';
  items: string[];
}

export const jobRequirements: JobRequirement[] = [
  {
    type: 'Must-have',
    items: [
      'Título en Medicina con registro vigente',
      'Mínimo 3 años de experiencia (hospitalaria o pacientes crónicos)',
      'Certificación BLS/ACLS vigente'
    ]
  },
  {
    type: 'Nice-to-have',
    items: [
      'Experiencia en cuidado intermedio',
      'Habilidades en diagnóstico preciso',
      'Empatía'
    ]
  }
];

export const candidates: Candidate[] = [
  {
    id: '1',
    name: 'Dra. Elena Rodríguez',
    score: 10,
    verdict: 'Avanzar',
    justification: [
      '8 años de experiencia en urgencias y hospitalización de alta complejidad.',
      'Certificaciones ACLS y BLS actualizadas a 2025.',
      'Posee un Diplomado en Cuidado Crítico, ideal para la Unidad de Cuidado Intermedio.'
    ],
    strengths: 'Perfil equilibrado entre urgencias, pacientes críticos y seguimiento de crónicos.',
    gaps: 'Ninguna detectada frente al JD.',
    isTop3: true
  },
  {
    id: '2',
    name: 'Dra. Claudia Villamizar',
    score: 9,
    verdict: 'Avanzar',
    justification: [
      '6 años de experiencia en "Home Care" y cuidado paliativo.',
      'Experiencia técnica en ventilación mecánica básica (clave para cuidado intermedio).',
      'Certificaciones BLS/ACLS vigentes.'
    ],
    strengths: 'Experiencia sólida en pacientes crónicos y manejo de dolor.',
    gaps: 'Su experiencia es mayormente domiciliaria, requerirá adaptación al ritmo hospitalario.',
    isTop3: true
  },
  {
    id: '3',
    name: 'Dra. Patricia Hoyos',
    score: 8,
    verdict: 'Avanzar',
    justification: [
      '12 años de experiencia en consulta externa y programas de hipertensión/diabetes.',
      'ACLS vigente.',
      'Estabilidad laboral demostrada (12 años en la misma institución).'
    ],
    strengths: 'Experiencia experta en manejo de pacientes crónicos y consulta externa.',
    gaps: 'Poca mención a experiencia hospitalaria reciente o cuidado intermedio.',
    isTop3: true
  },
  {
    id: '4',
    name: 'Dr. Marcos López',
    score: 7,
    verdict: 'Considerar',
    justification: [
      '4 años de experiencia en Soporte Vital Avanzado (ambulancias).',
      'Habilidades técnicas críticas: intubación y reanimación.'
    ],
    strengths: 'Excelente capacidad de respuesta ante emergencias.',
    gaps: 'Poca experiencia en consulta externa y seguimiento a largo plazo de pacientes.',
  },
  {
    id: '5',
    name: 'Dr. Roberto Gómez',
    score: 6,
    verdict: 'Considerar',
    justification: [
      'Especialista en Neurocirugía con 15 años de experiencia.'
    ],
    strengths: 'Altísima capacidad técnica y académica.',
    gaps: 'Sobreperfilado. El cargo es para Médico General; riesgo de deserción.',
  },
  {
    id: '6',
    name: 'Dr. Julián Castro',
    score: 5,
    verdict: 'Descartar',
    justification: [
      'Recién egresado (1 año de servicio social).',
      'ACLS en proceso de renovación (no vigente actualmente).'
    ],
    strengths: 'Formación en universidad de prestigio y actitud de aprendizaje.',
    gaps: 'No cumple con los 3 años de experiencia mínima requerida.',
  },
  {
    id: '7',
    name: 'Dra. Mónica Suárez',
    score: 4,
    verdict: 'Descartar',
    justification: [
      '5 años en Auditoría y Gestión de Calidad.',
      'No ha realizado práctica clínica directa en los últimos 4 años.'
    ],
    strengths: 'Conocimiento administrativo y de procesos.',
    gaps: 'Pérdida de vigencia en habilidades clínicas directas.',
  },
  {
    id: '8',
    name: 'Dr. Ahmed Mansour',
    score: 2,
    verdict: 'Descartar',
    justification: [
      'No cuenta con registro médico pleno en el país (título en convalidación).'
    ],
    strengths: '10 años de experiencia internacional.',
    gaps: 'Incumplimiento legal del requisito de registro vigente.',
  },
  {
    id: '9',
    name: 'ID_Candidato_05 (Anónimo)',
    score: 1,
    verdict: 'Error de lectura/Incompleto',
    justification: [
      'CV incompleto: sin nombre, fechas, ni soporte de certificaciones.'
    ],
    strengths: 'N/A',
    gaps: 'CV incompleto.',
  },
  {
    id: '10',
    name: 'Lic. Sandra Peña',
    score: 0,
    verdict: 'Descartar',
    justification: [
      'Es Enfermera Jefe, no Médico.'
    ],
    strengths: 'N/A',
    gaps: 'No cumple con el título profesional requerido.',
  }
];
