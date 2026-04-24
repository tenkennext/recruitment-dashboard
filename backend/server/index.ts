import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { candidates, jobRequirements } from './data.ts';
import { StrictCandidateEvaluator } from './evaluator.ts';
import { EVALUATION_SYSTEM_PROMPT } from './evaluation-prompt.ts';

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const app = express();
const evaluator = new StrictCandidateEvaluator();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/status', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/job-requirements', (_req, res) => {
  res.json(jobRequirements);
});

app.get('/api/candidates', (req, res) => {
  const query = String(req.query.q ?? '').trim().toLowerCase();
  const verdict = String(req.query.verdict ?? '').trim().toLowerCase();

  let filtered = candidates;

  if (query) {
    filtered = filtered.filter((candidate) => candidate.name.toLowerCase().includes(query));
  }

  if (verdict && verdict !== 'all') {
    filtered = filtered.filter((candidate) => candidate.verdict.toLowerCase() === verdict);
  }

  // Re-evaluar candidatos con el evaluador riguroso
  const reevaluatedCandidates = filtered.map((candidate) =>
    evaluator.evaluate(candidate, candidates.length)
  );

  // Convertir de vuelta al formato original para compatibilidad frontend
  const formattedCandidates = reevaluatedCandidates.map((evaluation) => ({
    id: evaluation.id,
    name: evaluation.nombre,
    score: evaluation.score,
    verdict: evaluation.veredicto,
    justification: evaluation.justificacion,
    strengths: evaluation.fortaleza_principal,
    gaps: evaluation.brecha_critica,
    isTop3: evaluation.score >= 8,
  }));

  res.json(formattedCandidates);
});

app.get('/api/candidates/:id', (req, res) => {
  const candidate = candidates.find((item) => item.id === req.params.id);

  if (!candidate) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }

  // Re-evaluar con el evaluador riguroso
  const evaluation = evaluator.evaluate(candidate, candidates.length);

  // Convertir de vuelta al formato original
  const formatted = {
    id: evaluation.id,
    name: evaluation.nombre,
    score: evaluation.score,
    verdict: evaluation.veredicto,
    justification: evaluation.justificacion,
    strengths: evaluation.fortaleza_principal,
    gaps: evaluation.brecha_critica,
    isTop3: evaluation.score >= 8,
  };

  res.json(formatted);
});

// Endpoint para ver la evaluación completa y rigurosa (con detalles de autoevaluación)
app.get('/api/candidates/:id/detailed-evaluation', (req, res) => {
  const candidate = candidates.find((item) => item.id === req.params.id);

  if (!candidate) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }

  // Retornar evaluación completa con todos los detalles rigurosos
  const evaluation = evaluator.evaluate(candidate, candidates.length);
  res.json(evaluation);
});

app.get('/api/evaluation-system', (_req, res) => {
  res.json({
    system_prompt: EVALUATION_SYSTEM_PROMPT,
    version: '2.0',
    behavior: 'Rigorous expert evaluator - no invented data',
    rules: [
      'NEVER invent or assume information not in CV',
      'If data is missing, report "No especificado" explicitly',
      'Apply must-have rules strictly',
      'Count only documented bonuses',
      'Perform self-evaluation after each assessment'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
  console.log(`📋 Evaluation system: Rigorous expert-level candidate assessment`);
});
