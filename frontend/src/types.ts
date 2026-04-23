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
