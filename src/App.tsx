import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  Trophy, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Search,
  Filter,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Award,
  ArrowUpRight,
  ShieldCheck,
  UserX,
  FileQuestion
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CANDIDATES, JOB_REQUIREMENTS, Candidate, Verdict } from './types';

const VerdictBadge = ({ verdict }: { verdict: Verdict }) => {
  const styles = {
    'Avanzar': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Considerar': 'bg-amber-100 text-amber-700 border-amber-200',
    'Descartar': 'bg-rose-100 text-rose-700 border-rose-200',
    'Error de lectura/Incompleto': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const icons = {
    'Avanzar': <CheckCircle2 className="w-4 h-4 mr-1" />,
    'Considerar': <AlertCircle className="w-4 h-4 mr-1" />,
    'Descartar': <XCircle className="w-4 h-4 mr-1" />,
    'Error de lectura/Incompleto': <FileQuestion className="w-4 h-4 mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[verdict]}`}>
      {icons[verdict]}
      {verdict}
    </span>
  );
};

const ScoreCircle = ({ score }: { score: number }) => {
  const colorClass = score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-rose-600';
  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-100 bg-white shadow-sm`}>
      <span className={`text-lg font-bold ${colorClass}`}>{score}</span>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'ranking'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<Verdict | 'All'>('All');

  const filteredCandidates = CANDIDATES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterVerdict === 'All' || c.verdict === filterVerdict;
    return matchesSearch && matchesFilter;
  });

  const top3 = CANDIDATES.filter(c => c.isTop3).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Recruitment Screening</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Médico General - Unidad de Cuidado Intermedio</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              {(['overview', 'candidates', 'ranking'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Requirements Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Análisis de Requerimientos (JD)</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {JOB_REQUIREMENTS.map((req) => (
                    <div key={req.type} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${req.type === 'Must-have' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {req.type === 'Must-have' ? <ShieldCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        {req.type}
                      </h3>
                      <ul className="space-y-3">
                        {req.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-600">
                            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${req.type === 'Must-have' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                            <span className="text-sm leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Executive Summary / Top 3 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Resumen Ejecutivo (Top 3)</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {top3.map((candidate, idx) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative bg-white p-6 rounded-2xl border-2 border-amber-100 shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <Trophy className={`w-8 h-8 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600 opacity-50'}`} />
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <ScoreCircle score={candidate.score} />
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{candidate.name}</h3>
                          <VerdictBadge verdict={candidate.verdict} />
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3 italic">
                        "{candidate.strengths}"
                      </p>
                      <button 
                        onClick={() => { setActiveTab('candidates'); setSearchTerm(candidate.name); }}
                        className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Ver Perfil Completo <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Quick Stats */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Candidatos', value: CANDIDATES.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Avanzan', value: CANDIDATES.filter(c => c.verdict === 'Avanzar').length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Considerar', value: CANDIDATES.filter(c => c.verdict === 'Considerar').length, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
                  { label: 'Descartados', value: CANDIDATES.filter(c => c.verdict === 'Descartar').length, icon: UserX, color: 'bg-rose-50 text-rose-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </section>
            </motion.div>
          )}

          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterVerdict}
                    onChange={(e) => setFilterVerdict(e.target.value as any)}
                    className="flex-1 md:w-48 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="All">Todos los Veredictos</option>
                    <option value="Avanzar">Avanzar</option>
                    <option value="Considerar">Considerar</option>
                    <option value="Descartar">Descartar</option>
                  </select>
                </div>
              </div>

              {/* Candidate Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredCandidates.map((candidate) => (
                  <motion.div
                    layout
                    key={candidate.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <ScoreCircle score={candidate.score} />
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{candidate.name}</h3>
                            <VerdictBadge verdict={candidate.verdict} />
                          </div>
                        </div>
                        {candidate.isTop3 && (
                          <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Top Choice
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" /> Justificación Técnica
                          </h4>
                          <ul className="space-y-2">
                            {candidate.justification.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <ChevronRight className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                            <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Fortalezas</h4>
                            <p className="text-xs text-emerald-800 leading-relaxed">{candidate.strengths}</p>
                          </div>
                          <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                            <h4 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-1">Brechas / Riesgos</h4>
                            <p className="text-xs text-rose-800 leading-relaxed">{candidate.gaps}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredCandidates.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No se encontraron candidatos con estos criterios.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setFilterVerdict('All'); }}
                    className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ranking' && (
            <motion.div
              key="ranking"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Candidato</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Score</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Veredicto</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fortaleza Principal</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Brecha Crítica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CANDIDATES.sort((a, b) => b.score - a.score).map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${candidate.isTop3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {candidate.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900">{candidate.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-bold ${candidate.score >= 8 ? 'text-emerald-600' : candidate.score >= 6 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {candidate.score}/10
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <VerdictBadge verdict={candidate.verdict} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 max-w-xs">{candidate.strengths}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-600 max-w-xs">{candidate.gaps}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            Informe de Screening Basado en Evidencia • {new Date().toLocaleDateString()}
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Briefcase className="w-3 h-3" />
              <span>RRHH Technical Assessment</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>ISO 9001 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
