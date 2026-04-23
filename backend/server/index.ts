import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { candidates, jobRequirements } from './data.ts';

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

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

  res.json(filtered);
});

app.get('/api/candidates/:id', (req, res) => {
  const candidate = candidates.find((item) => item.id === req.params.id);

  if (!candidate) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }

  res.json(candidate);
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
