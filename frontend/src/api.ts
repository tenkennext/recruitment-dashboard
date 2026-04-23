/// <reference types="vite/client" />
import type { Candidate, JobRequirement, Verdict } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getJobRequirements(): Promise<JobRequirement[]> {
  return fetchJson<JobRequirement[]>('/api/job-requirements');
}

export function getCandidates(query?: {
  q?: string;
  verdict?: Verdict | 'All';
}): Promise<Candidate[]> {
  const params = new URLSearchParams();
  if (query?.q) params.append('q', query.q);
  if (query?.verdict) params.append('verdict', query.verdict);
  const queryString = params.toString();
  return fetchJson<Candidate[]>(`/api/candidates${queryString ? `?${queryString}` : ''}`);
}

export function getCandidate(id: string): Promise<Candidate> {
  return fetchJson<Candidate>(`/api/candidates/${id}`);
}
