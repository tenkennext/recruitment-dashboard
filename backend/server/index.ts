import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import * as fs from 'fs';
import { candidates, jobRequirements } from './data.ts';
import { StrictCandidateEvaluator } from './evaluator.ts';
import { EVALUATION_SYSTEM_PROMPT } from './evaluation-prompt.ts';
import { processFile, FileProcessingResult } from './file-processor.ts';

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const app = express();
const evaluator = new StrictCandidateEvaluator();

// Configurar multer para almacenamiento temporal de archivos
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, Word y TXT.'));
    }
  },
});

app.use(express.json());
app.use(express.text({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Endpoint para procesar un archivo CV
app.post('/api/process-cv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await processFile(req.file.path);

    // Eliminar el archivo temporal después de procesarlo
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json(result);
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error processing file',
    });
  }
});

// Endpoint para procesar múltiples archivos CV (base64)
app.post('/api/process-cvs', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { files } = req.body as { files: Array<{ name: string; data: string }> };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const results: FileProcessingResult[] = [];
    const tempFiles: string[] = [];

    // Procesar todos los archivos en paralelo
    const processPromises = files.map(async (file) => {
      try {
        const tempPath = path.join(uploadDir, `temp-${Date.now()}-${Math.random()}.${getExtensionFromName(file.name)}`);
        const buffer = Buffer.from(file.data, 'base64');
        fs.writeFileSync(tempPath, buffer);
        tempFiles.push(tempPath);

        const result = await processFile(tempPath);
        return result;
      } catch (error) {
        return {
          filename: file.name,
          fileType: 'txt' as const,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Error processing file',
        };
      }
    });

    const processedResults = await Promise.all(processPromises);
    results.push(...processedResults);

    // Limpiar archivos temporales
    tempFiles.forEach((file) => {
      fs.unlink(file, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });

    res.json({
      total: files.length,
      processed: processedResults.filter((r) => r.status === 'success').length,
      scannedPDF: processedResults.filter((r) => r.status === 'scanned-pdf').length,
      errors: processedResults.filter((r) => r.status === 'error').length,
      results: processedResults,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error processing files',
    });
  }
});

function getExtensionFromName(filename: string): string {
  const ext = path.extname(filename).toLowerCase().substring(1);
  return ext || 'txt';
}

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
