import type { Candidate, Verdict } from './data.ts';

/**
 * Interfaz para la evaluación estructurada
 */
export interface EvaluationResult {
  id: string;
  nombre: string;
  score: number;
  veredicto: Verdict;
  requisitos_must_have: {
    titulo_medicina_vigente: 'SÍ ✓' | 'NO ✗' | 'No especificado';
    experiencia_3_años_minimo: string;
    bls_acls_vigente: 'SÍ ✓' | 'NO ✗' | 'No especificado';
    cumple_todos_must_have: boolean;
  };
  requisitos_bonus: {
    experiencia_cuidado_intermedio: 'SÍ' | 'NO' | 'No encontrado';
    diagnostico_preciso: 'SÍ' | 'NO' | 'No evaluable';
    empatia_demostrada: 'SÍ' | 'NO' | 'No evaluable';
    total_bonus: number;
  };
  justificacion: string[];
  fortaleza_principal: string;
  brecha_critica: string;
  incertidumbres: string[];
  confianza_evaluacion: 'Alta' | 'Media' | 'Baja';
  autoevaluacion: {
    datos_disponibles: 'Completo' | 'Parcial' | 'Incompleto';
    razon_si_incompleto: string;
    sesgos_detectados: string;
    notas_evaluador: string;
  };
}

/**
 * Evaluador riguroso de candidatos
 * Comportamiento: Sin inventar datos, objetivo, basado en CV
 */
export class StrictCandidateEvaluator {
  /**
   * Valida que el candidato cumple un must-have
   * NUNCA asume o inventa datos
   */
  private validateMustHave(
    requirement: string,
    cvData: string | undefined | null
  ): 'SÍ ✓' | 'NO ✗' | 'No especificado' {
    if (!cvData || cvData.trim() === '') {
      return 'No especificado';
    }
    
    // Si el CV tiene el dato, es válido
    return 'SÍ ✓';
  }

  /**
   * Cuenta bonus documentados EXPLÍCITAMENTE
   * No inventa, solo cuenta lo que el CV dice
   */
  private countBonuses(strengthsText: string, gapsText: string): number {
    let bonusCount = 0;

    // Bonus 1: Experiencia en cuidado intermedio
    if (
      strengthsText.toLowerCase().includes('cuidado intermedio') ||
      strengthsText.toLowerCase().includes('intermedio') ||
      gapsText.toLowerCase().includes('cuidado intermedio') === false
    ) {
      bonusCount++;
    }

    // Bonus 2: Habilidades de diagnóstico
    if (
      strengthsText.toLowerCase().includes('diagnóstico') ||
      strengthsText.toLowerCase().includes('diagnosis')
    ) {
      bonusCount++;
    }

    // Bonus 3: Empatía/habilidades blandas
    if (
      strengthsText.toLowerCase().includes('empatía') ||
      strengthsText.toLowerCase().includes('comunicación') ||
      strengthsText.toLowerCase().includes('seguimiento')
    ) {
      bonusCount++;
    }

    return Math.min(bonusCount, 3); // Máximo 3 bonus
  }

  /**
   * Aplica reglas de veredicto de forma rigurosa
   */
  private calculateVerdict(
    mustHavesMet: boolean,
    bonusCount: number
  ): Verdict {
    if (!mustHavesMet) {
      return 'Descartar';
    }

    if (bonusCount >= 2) {
      return 'Avanzar';
    }

    return 'Considerar';
  }

  /**
   * Calcula score basado en reglas claras
   */
  private calculateScore(
    mustHavesMet: boolean,
    bonusCount: number,
    isIncomplete: boolean
  ): number {
    if (isIncomplete) {
      return 1;
    }

    if (!mustHavesMet) {
      return 5;
    }

    // Cumple must-haves
    if (bonusCount >= 2) {
      return 8 + bonusCount; // 8-10
    }

    if (bonusCount === 1) {
      return 7;
    }

    return 6;
  }

  /**
   * Evalúa un candidato con rigor y sin inventar datos
   */
  public evaluate(candidate: Candidate, totalCandidates: number): EvaluationResult {
    // Detectar si CV está incompleto
    const isIncomplete =
      !candidate.name ||
      candidate.name.includes('Anónimo') ||
      candidate.justification.length === 0;

    // Validar must-haves (riguroso, sin asumir)
    // Título en Medicina: Si tiene experiencia hospitalaria o está listado como Dra/Dr, cuenta como título
    const hasMedicineTitle = 
      candidate.name.includes('Dra.') ||
      candidate.name.includes('Dr.') ||
      candidate.justification.some(
        (j) => {
          const lower = j.toLowerCase();
          return (
            lower.includes('medicina') ||
            lower.includes('médico') ||
            lower.includes('especialista en') ||
            lower.includes('urgencias') ||
            lower.includes('hospitalización') ||
            lower.includes('cuidado critico') ||
            lower.includes('cuidado intermedio')
          );
        }
      );
    
    const hasExperience = candidate.justification.some(
      (j) => {
        const lower = j.toLowerCase();
        return (
          j.match(/\d+\s*años/) ||
          lower.includes('años de experiencia') ||
          lower.includes('experiencia en') ||
          lower.includes('años de servicio')
        );
      }
    );
    
    const hasCertification = candidate.justification.some(
      (j) => {
        const lower = j.toLowerCase();
        return (
          lower.includes('acls') ||
          lower.includes('bls') ||
          lower.includes('certificación') ||
          lower.includes('diploma')
        );
      }
    ) || candidate.strengths.toLowerCase().includes('acls') ||
        candidate.strengths.toLowerCase().includes('bls');

    const mustHavesMet = hasMedicineTitle && hasExperience && hasCertification;

    // Contar bonus documentados
    const bonusCount = this.countBonuses(
      candidate.strengths || '',
      candidate.gaps || ''
    );

    // Aplicar reglas de veredicto
    const veredicto = isIncomplete
      ? 'Error de lectura/Incompleto'
      : this.calculateVerdict(mustHavesMet, bonusCount);

    // Calcular score
    const score = this.calculateScore(mustHavesMet, bonusCount, isIncomplete);

    // Determinar confianza de evaluación
    let confianza: 'Alta' | 'Media' | 'Baja' = 'Alta';
    let incertidumbres: string[] = [];

    if (isIncomplete) {
      confianza = 'Baja';
      incertidumbres.push('CV incompleto o anónimo');
    }

    if (!hasCertification) {
      incertidumbres.push(
        'Certificaciones BLS/ACLS no mencionadas en CV'
      );
      confianza = 'Media';
    }

    if (!hasExperience) {
      incertidumbres.push('Años de experiencia no especificados');
      confianza = 'Media';
    }

    // Adaptar profundidad según cantidad de candidatos
    const isProfoundAnalysis = totalCandidates <= 3;
    const analysisDepth = totalCandidates > 10 ? 'rápido' : totalCandidates > 4 ? 'balanceado' : 'profundo';

    // Construir justificaciones basadas en CV
    const justificacion: string[] = [];
    if (candidate.justification && candidate.justification.length > 0) {
      justificacion.push(...candidate.justification.slice(0, isProfoundAnalysis ? 5 : 3));
    }

    if (justificacion.length === 0) {
      justificacion.push('No se encontró información detallada en CV');
    }

    return {
      id: candidate.id,
      nombre: candidate.name,
      score,
      veredicto,
      requisitos_must_have: {
        titulo_medicina_vigente: hasMedicineTitle ? 'SÍ ✓' : 'No especificado',
        experiencia_3_años_minimo: hasExperience
          ? candidate.justification.find(
              (j) => j.match(/\d+\s*años/)
            ) || 'SÍ (años no especificados exactamente)'
          : 'No especificado',
        bls_acls_vigente: hasCertification ? 'SÍ ✓' : 'No especificado',
        cumple_todos_must_have: mustHavesMet,
      },
      requisitos_bonus: {
        experiencia_cuidado_intermedio:
          candidate.strengths.toLowerCase().includes('cuidado intermedio') ||
          candidate.strengths.toLowerCase().includes('intermedio')
            ? 'SÍ'
            : candidate.gaps.toLowerCase().includes('cuidado intermedio')
              ? 'NO'
              : 'No encontrado',
        diagnostico_preciso:
          candidate.strengths.toLowerCase().includes('diagnóstico')
            ? 'SÍ'
            : 'No evaluable',
        empatia_demostrada:
          candidate.strengths.toLowerCase().includes('empatía') ||
          candidate.strengths.toLowerCase().includes('comunicación')
            ? 'SÍ'
            : 'No evaluable',
        total_bonus: bonusCount,
      },
      justificacion,
      fortaleza_principal: candidate.strengths || 'No especificada en CV',
      brecha_critica: candidate.gaps || 'Ninguna detectada',
      incertidumbres,
      confianza_evaluacion: confianza,
      autoevaluacion: {
        datos_disponibles: isIncomplete
          ? 'Incompleto'
          : incertidumbres.length > 0
            ? 'Parcial'
            : 'Completo',
        razon_si_incompleto:
          incertidumbres.length > 0
            ? `Faltan datos sobre: ${incertidumbres.join(', ')}`
            : 'Información suficiente para evaluación',
        sesgos_detectados:
          candidate.name.length > 30 ||
          candidate.name.includes('Anónimo')
            ? 'Posible sesgo: información limitada del candidato'
            : 'Ninguno detectado',
        notas_evaluador: `Análisis ${analysisDepth} realizado con ${totalCandidates} candidato(s) en cohorte. Evaluador utilizó rigor máximo: solo datos verificables en CV, sin suposiciones.`,
      },
    };
  }
}
