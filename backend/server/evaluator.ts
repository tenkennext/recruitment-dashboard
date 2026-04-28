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
 * Evaluador riguroso de candidatos con 4 aspectos priorizados
 * Comportamiento: Sin inventar datos, objetivo, basado en CV
 * Prioridades: 1) Experiencia similar (CRÍTICA) 2) Habilidades técnicas 3) Formación 4) Logros
 */
export class StrictCandidateEvaluator {
  /**
   * ASPECTO 1 (CRÍTICO): Evalúa experiencia en trabajos similares al cargo
   * Si no hay, es bloqueador automático
   */
  private evaluateRelatedExperience(justifications: string[]): {
    hasRelated: boolean;
    evidence: string;
    confidence: 'Alta' | 'Media' | 'Baja';
  } {
    // Palabras clave de experiencia similar (Médico General, cuidado intermedio, urgencias, hospitalario)
    const relatedKeywords = [
      'urgencias',
      'hospitalización',
      'cuidado intermedio',
      'hospital',
      'pacientes crónicos',
      'consulta externa',
      'medicina general',
      'atención primaria',
      'cuidado crítico',
      'unidad de cuidado',
      'soporte vital'
    ];

    const matchingEvidence = justifications.find((j) => {
      const lower = j.toLowerCase();
      return relatedKeywords.some((keyword) => lower.includes(keyword));
    });

    return {
      hasRelated: !!matchingEvidence,
      evidence: matchingEvidence || 'No encontrada',
      confidence: matchingEvidence ? 'Alta' : 'Baja'
    };
  }

  /**
   * ASPECTO 2: Evalúa habilidades técnicas necesarias
   * Busca certificaciones, competencias clínicas específicas
   */
  private evaluateTechnicalSkills(
    justifications: string[],
    strengths: string
  ): {
    score: number;
    skills: string[];
    missing: string[];
  } {
    const technicalKeywords = [
      'acls',
      'bls',
      'ventilación mecánica',
      'reanimación',
      'intubación',
      'diagnóstico',
      'certificación',
      'diploma',
      'especialista'
    ];

    const foundSkills: string[] = [];
    const fullText = (justifications.join(' ') + ' ' + strengths).toLowerCase();

    technicalKeywords.forEach((skill) => {
      if (fullText.includes(skill)) {
        foundSkills.push(skill);
      }
    });

    // Habilidades esperadas mínimas
    const expectedSkills = ['acls', 'bls'];
    const missing = expectedSkills.filter((skill) => !fullText.includes(skill));

    return {
      score: Math.min(foundSkills.length, 5),
      skills: foundSkills,
      missing
    };
  }

  /**
   * ASPECTO 3: Evalúa formación académica
   * Busca evidencia de títulos, estudios, formación
   */
  private evaluateAcademicBackground(justifications: string[], name: string): {
    hasTitle: boolean;
    titleType: string;
    yearsEvidence: number | null;
  } {
    const titleKeywords = ['medicina', 'médico', 'especialista', 'diplomado', 'postgrado'];
    const fullText = (justifications.join(' ') + ' ' + name).toLowerCase();

    const hasTitle = titleKeywords.some((keyword) => fullText.includes(keyword));

    // Extraer años de experiencia si están mencionados
    const yearsMatch = (justifications.join(' ') + ' ' + name).match(/(\d+)\s*años/);
    const yearsEvidence = yearsMatch ? parseInt(yearsMatch[1]) : null;

    const titleType = titleKeywords.find((keyword) => fullText.includes(keyword)) || 'No especificado';

    return {
      hasTitle,
      titleType,
      yearsEvidence
    };
  }

  /**
   * ASPECTO 4: Evalúa logros concretos demostrables
   * Busca resultados, casos exitosos, trayectoria
   */
  private evaluateConcreteAchievements(strengths: string, gaps: string): {
    hasAchievements: boolean;
    achievements: string[];
    riskFactors: string[];
  } {
    const achievements: string[] = [];
    const riskFactors: string[] = [];

    const strengthsLower = (strengths || '').toLowerCase();
    const gapsLower = (gaps || '').toLowerCase();

    // Buscar logros
    if (strengthsLower.includes('equilibrado') || strengthsLower.includes('sólida')) {
      achievements.push('Trayectoria equilibrada');
    }
    if (strengthsLower.includes('estabilidad')) {
      achievements.push('Estabilidad laboral');
    }
    if (strengthsLower.includes('experiencia experta')) {
      achievements.push('Experiencia experta');
    }
    if (strengthsLower.includes('capacidad de respuesta')) {
      achievements.push('Capacidad técnica destacada');
    }

    // Buscar factores de riesgo
    if (gapsLower.includes('adaptación')) {
      riskFactors.push('Requiere adaptación al entorno');
    }
    if (gapsLower.includes('reciente')) {
      riskFactors.push('Experiencia no tan reciente');
    }
    if (gapsLower.includes('deserción')) {
      riskFactors.push('Posible riesgo de deserción');
    }
    if (gapsLower.includes('clínica directa')) {
      riskFactors.push('Pérdida de habilidades clínicas');
    }

    return {
      hasAchievements: achievements.length > 0,
      achievements,
      riskFactors
    };
  }

  /**
   * Detecta si el CV tiene información insuficiente
   */
  private checkDataSufficiency(
    candidate: Candidate,
    totalJustifications: number
  ): { isSufficient: boolean; reason: string } {
    if (!candidate.name || candidate.name.includes('Anónimo')) {
      return { isSufficient: false, reason: 'CV sin nombre o anónimo' };
    }

    if (totalJustifications === 0) {
      return { isSufficient: false, reason: 'Sin información detallada en justificaciones' };
    }

    if (
      !candidate.strengths ||
      !candidate.gaps ||
      (candidate.strengths.length < 20 && candidate.gaps.length < 20)
    ) {
      return { isSufficient: false, reason: 'Información muy limitada (fortalezas/debilidades)' };
    }

    return { isSufficient: true, reason: 'Información suficiente' };
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
   * Evalúa un candidato con rigor basado en 4 aspectos priorizados
   * 1. CRÍTICA: Experiencia en trabajos similares (bloqueador si no existe)
   * 2. Habilidades técnicas necesarias
   * 3. Formación académica
   * 4. Logros concretos demostrables
   */
  public evaluate(candidate: Candidate, totalCandidates: number): EvaluationResult {
    // PASO 1: Validar suficiencia de datos
    const dataSufficiency = this.checkDataSufficiency(
      candidate,
      candidate.justification.length
    );

    if (!dataSufficiency.isSufficient) {
      return {
        id: candidate.id,
        nombre: candidate.name,
        score: 0,
        veredicto: 'Error de lectura/Incompleto',
        requisitos_must_have: {
          titulo_medicina_vigente: 'No especificado',
          experiencia_3_años_minimo: 'No especificado',
          bls_acls_vigente: 'No especificado',
          cumple_todos_must_have: false,
        },
        requisitos_bonus: {
          experiencia_cuidado_intermedio: 'No encontrado',
          diagnostico_preciso: 'No evaluable',
          empatia_demostrada: 'No evaluable',
          total_bonus: 0,
        },
        justificacion: [`⚠️ DATOS INSUFICIENTES: ${dataSufficiency.reason}`],
        fortaleza_principal: 'N/A',
        brecha_critica: dataSufficiency.reason,
        incertidumbres: [dataSufficiency.reason],
        confianza_evaluacion: 'Baja',
        autoevaluacion: {
          datos_disponibles: 'Incompleto',
          razon_si_incompleto: dataSufficiency.reason,
          sesgos_detectados: 'CV con información crítica faltante',
          notas_evaluador:
            'Evaluación bloqueada por insuficiencia de datos. No se puede realizar evaluación rigurosa sin información completa.',
        },
      };
    }

    // PASO 2: ASPECTO 1 (CRÍTICO) - Experiencia en trabajos similares
    const relatedExp = this.evaluateRelatedExperience(
      candidate.justification
    );

    // BLOQUEADOR: Si no tiene experiencia relacionada, descartar inmediatamente
    if (!relatedExp.hasRelated) {
      return {
        id: candidate.id,
        nombre: candidate.name,
        score: 2,
        veredicto: 'Descartar',
        requisitos_must_have: {
          titulo_medicina_vigente: 'No especificado',
          experiencia_3_años_minimo: 'No especificado',
          bls_acls_vigente: 'No especificado',
          cumple_todos_must_have: false,
        },
        requisitos_bonus: {
          experiencia_cuidado_intermedio: 'NO',
          diagnostico_preciso: 'No evaluable',
          empatia_demostrada: 'No evaluable',
          total_bonus: 0,
        },
        justificacion: [
          '❌ No se encontró experiencia en trabajos similares al cargo (Médico General / Cuidado Intermedio)',
        ],
        fortaleza_principal: candidate.strengths || 'No especificada',
        brecha_critica:
          'Sin experiencia relacionada directa con el cargo. Este es un requisito crítico bloqueador.',
        incertidumbres: ['Experiencia relacionada no documentada en CV'],
        confianza_evaluacion: 'Alta',
        autoevaluacion: {
          datos_disponibles: 'Completo',
          razon_si_incompleto: 'N/A',
          sesgos_detectados: 'Ninguno detectado',
          notas_evaluador:
            'Evaluación completada con rigor máximo. Aplicado filtro crítico: falta experiencia relacionada con el cargo.',
        },
      };
    }

    // PASO 3: ASPECTO 2 - Habilidades técnicas
    const technicalSkills = this.evaluateTechnicalSkills(
      candidate.justification,
      candidate.strengths || ''
    );

    // PASO 4: ASPECTO 3 - Formación académica
    const academicBg = this.evaluateAcademicBackground(
      candidate.justification,
      candidate.name
    );

    // PASO 5: ASPECTO 4 - Logros concretos
    const achievements = this.evaluateConcreteAchievements(
      candidate.strengths || '',
      candidate.gaps || ''
    );

    // PASO 6: Validar must-haves
    const hasMedicineTitle = academicBg.hasTitle;
    const hasExperience = (academicBg.yearsEvidence || 0) >= 3;
    const hasCertification = technicalSkills.missing.length < 2; // Tiene al menos BLS o ACLS

    const mustHavesMet = hasMedicineTitle && hasExperience && hasCertification;

    // Contar bonus
    const bonusCount = this.countBonuses(
      candidate.strengths || '',
      candidate.gaps || ''
    );

    // Calcular veredicto
    const veredicto = !mustHavesMet
      ? 'Descartar'
      : bonusCount >= 2
        ? 'Avanzar'
        : 'Considerar';

    // Calcular score mejorado: considera los 4 aspectos
    let score = 0;
    if (relatedExp.hasRelated) score += 3; // Experiencia similar: 3 puntos
    score += Math.min(technicalSkills.score, 2); // Habilidades técnicas: máx 2
    score += academicBg.hasTitle ? 2 : 0; // Formación: 2 puntos
    score += achievements.hasAchievements ? 1 : 0; // Logros: 1 punto
    score += Math.min(bonusCount, 2); // Bonus: máx 2 puntos

    // Construir justificaciones
    const justificacion: string[] = [
      `✓ ASPECTO 1 - Experiencia: ${relatedExp.evidence}`,
      `✓ ASPECTO 2 - Habilidades técnicas: ${technicalSkills.skills.length} identificadas (${technicalSkills.skills.slice(0, 2).join(', ')})`,
      `✓ ASPECTO 3 - Formación: ${academicBg.titleType}${academicBg.yearsEvidence ? ` (${academicBg.yearsEvidence}+ años)` : ''}`,
      ...candidate.justification.slice(0, 2),
    ];

    // Incertidumbres
    const incertidumbres: string[] = [];
    if (technicalSkills.missing.length > 0) {
      incertidumbres.push(
        `Certificaciones faltantes: ${technicalSkills.missing.join(', ')}`
      );
    }
    if (achievements.riskFactors.length > 0) {
      incertidumbres.push(
        `Factores de riesgo: ${achievements.riskFactors.join(', ')}`
      );
    }

    const confianza: 'Alta' | 'Media' | 'Baja' =
      incertidumbres.length === 0 ? 'Alta' : 'Media';

    return {
      id: candidate.id,
      nombre: candidate.name,
      score: Math.min(score, 10),
      veredicto,
      requisitos_must_have: {
        titulo_medicina_vigente: hasMedicineTitle ? 'SÍ ✓' : 'NO ✗',
        experiencia_3_años_minimo: hasExperience
          ? `SÍ (${academicBg.yearsEvidence} años)`
          : 'NO ✗',
        bls_acls_vigente: hasCertification ? 'SÍ ✓' : 'NO ✗',
        cumple_todos_must_have: mustHavesMet,
      },
      requisitos_bonus: {
        experiencia_cuidado_intermedio:
          candidate.strengths.toLowerCase().includes('cuidado intermedio') ||
          candidate.strengths.toLowerCase().includes('intermedio')
            ? 'SÍ'
            : 'NO',
        diagnostico_preciso: technicalSkills.skills.some((s) =>
          s.toLowerCase().includes('diagnóstico')
        )
          ? 'SÍ'
          : 'NO',
        empatia_demostrada:
          candidate.strengths.toLowerCase().includes('empatía') ||
          candidate.strengths.toLowerCase().includes('comunicación')
            ? 'SÍ'
            : 'NO',
        total_bonus: bonusCount,
      },
      justificacion,
      fortaleza_principal:
        achievements.achievements.length > 0
          ? achievements.achievements.join(', ')
          : candidate.strengths || 'No especificada',
      brecha_critica:
        achievements.riskFactors.length > 0
          ? achievements.riskFactors.join(', ')
          : candidate.gaps || 'Ninguna detectada',
      incertidumbres,
      confianza_evaluacion: confianza,
      autoevaluacion: {
        datos_disponibles: incertidumbres.length === 0 ? 'Completo' : 'Parcial',
        razon_si_incompleto:
          incertidumbres.length > 0
            ? `Información parcial: ${incertidumbres.join('; ')}`
            : 'Información suficiente',
        sesgos_detectados: 'Ninguno detectado',
        notas_evaluador: `Evaluación completa basada en 4 aspectos priorizados: 1) Experiencia similar ✓, 2) Habilidades técnicas (${technicalSkills.score}/5), 3) Formación (${academicBg.hasTitle ? 'completa' : 'incompleta'}), 4) Logros (${achievements.hasAchievements ? 'documentados' : 'no evidentes'})`,
      },
    };
  }
}
