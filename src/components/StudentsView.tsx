import React, { useMemo, useState } from 'react';
import { Search, Filter, User, Mail, CheckCircle, Clock, AlertTriangle, RefreshCcw, XCircle } from 'lucide-react';
import { Student, Teacher } from '../types';

interface StudentsViewProps {
  students: Student[];
  cohorts: string[];
  selectedCohort?: string;
  onCohortChange?: (cohort: string) => void;
  teachers?: Teacher[];
  selectedTeacherId?: string;
  onTeacherChange?: (teacherId: string) => void;
  progressMap?: Record<string, number>;
  progressTotals?: Record<string, { total: number; entregado: number; atrasado: number; faltante: number; pendiente: number; reentrega: number }>;
}

const StudentsView: React.FC<StudentsViewProps> = ({ students, cohorts, selectedCohort = '', onCohortChange, teachers = [], selectedTeacherId = '', onTeacherChange, progressMap = {}, progressTotals = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progressDesc' | 'progressAsc'>('name');
  const [detailId, setDetailId] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const base = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCohort = !selectedCohort || student.cohort === selectedCohort;
      return matchesSearch && matchesCohort;
    });
    const enriched = base.map(s => ({ s, progress: typeof progressMap[s.id] === 'number' ? progressMap[s.id] : -1 }));
    enriched.sort((a,b) => {
      if (sortBy === 'name') return a.s.name.localeCompare(b.s.name);
      if (sortBy === 'progressDesc') return (b.progress) - (a.progress);
      return (a.progress) - (b.progress);
    });
    return enriched.map(e => e.s);
  }, [students, selectedCohort, searchTerm, sortBy, progressMap]);

  const exportCSV = () => {
    const headers = ['ID','Nombre','Email','Cohorte','Cursos','% A tiempo'];
    const rows = filteredStudents.map(s => [
      s.id,
      s.name,
      s.email,
      s.cohort,
      String(s.enrolledCourses.length),
      typeof progressMap[s.id] === 'number' ? `${progressMap[s.id].toFixed(1)}%` : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'estudiantes.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Estudiantes
          <span className="ml-2 align-middle text-sm font-normal text-gray-500 dark:text-slate-400">({filteredStudents.length})</span>
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Cohort Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={selectedCohort}
              onChange={(e) => onCohortChange?.(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todas las cohortes</option>
              {cohorts.map(cohort => (
                <option key={cohort} value={cohort}>{cohort}</option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={selectedTeacherId}
              onChange={(e) => onTeacherChange?.(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos los profesores</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.email}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Orden: Nombre</option>
            <option value="progressDesc">Orden: % a tiempo ↓</option>
            <option value="progressAsc">Orden: % a tiempo ↑</option>
          </select>

          {/* Export */}
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl shadow-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">Exportar CSV</button>
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center text-gray-700 dark:text-slate-300">
          <p className="mb-3">No se encontraron estudiantes con los filtros actuales.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-3 py-2 rounded-xl shadow-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
              onClick={() => {
                setSearchTerm('');
                onCohortChange?.('');
                onTeacherChange?.('');
              }}
            >
              Limpiar filtros
            </button>
            <button
              className="px-3 py-2 rounded-xl shadow-sm bg-blue-600 text-white hover:bg-blue-700 text-sm"
              onClick={() => setSearchTerm('')}
            >
              Ver todos
            </button>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDetailId(student.id)}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <User className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{student.name}</h3>
                <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                  {student.cohort}
                </span>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-slate-700 my-3" />
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" />
                {student.email}
              </div>
              <div className="mt-3">
                {typeof progressMap[student.id] === 'number' ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Entregas a tiempo</p>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, progressMap[student.id]))}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 font-medium">{progressMap[student.id].toFixed(1)}%</p>
                    {/* Breakdown */}
                    {progressTotals[student.id] && (
                      <div className="grid grid-cols-5 gap-2 mt-2 text-[10px] text-gray-600 dark:text-slate-300">
                        <div className="flex items-center" title="Entregado">
                          <CheckCircle size={12} className="text-green-600 mr-1" /> {progressTotals[student.id].entregado}
                        </div>
                        <div className="flex items-center" title="Atrasado">
                          <Clock size={12} className="text-yellow-600 mr-1" /> {progressTotals[student.id].atrasado}
                        </div>
                        <div className="flex items-center" title="Faltante">
                          <XCircle size={12} className="text-red-600 mr-1" /> {progressTotals[student.id].faltante}
                        </div>
                        <div className="flex items-center" title="Pendiente">
                          <AlertTriangle size={12} className="text-orange-600 mr-1" /> {progressTotals[student.id].pendiente}
                        </div>
                        <div className="flex items-center" title="Reentrega">
                          <RefreshCcw size={12} className="text-blue-600 mr-1" /> {progressTotals[student.id].reentrega}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Cursos inscritos: {student.enrolledCourses.length}</p>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (student.enrolledCourses.length / 6) * 100)}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {detailId && (() => {
        const s = students.find(x => x.id === detailId);
        if (!s) return null;
        const prog = typeof progressMap[s.id] === 'number' ? progressMap[s.id] : undefined;
        return (
          <div className="relative">
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDetailId(null)} />
            <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{s.name}</h4>
                <button className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => setDetailId(null)}>Cerrar</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-700 dark:text-slate-300">
                  <div className="mb-1"><span className="font-medium">Email:</span> {s.email}</div>
                  <div className="mb-1"><span className="font-medium">Cohorte:</span> {s.cohort}</div>
                  <div><span className="font-medium">Cursos:</span> {s.enrolledCourses.join(', ') || '—'}</div>
                </div>
                {prog !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Entregas a tiempo</p>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, prog))}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 font-medium">{prog.toFixed(1)}%</p>
                  </div>
                )}
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Acciones</h5>
                  <div className="flex gap-2">
                    <button className="text-sm rounded-md border border-gray-300 dark:border-slate-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">Enviar recordatorio</button>
                    <button onClick={exportCSV} className="text-sm rounded-md border border-gray-300 dark:border-slate-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">Exportar CSV</button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        );
      })()}
    </div>
  );
};

export default StudentsView;