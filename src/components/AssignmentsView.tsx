import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Assignment, Submission } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AssignmentsViewProps {
  assignments: Assignment[];
  submissions: Submission[];
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments, submissions }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'entregado' | 'atrasado' | 'faltante' | 'reentrega' | 'pendiente'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'dueAsc' | 'dueDesc' | 'onTimeDesc' | 'onTimeAsc'>('dueAsc');
  const [detailId, setDetailId] = useState<string | null>(null);

  const getSubmissionStats = (assignmentId: string) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
    const turned_in = assignmentSubmissions.filter(s => s.state === 'TURNED_IN').length;
    const late = assignmentSubmissions.filter(s => s.late).length;
    const pending = assignmentSubmissions.filter(s => s.state === 'CREATED').length;
    
    return { turned_in, late, pending, total: assignmentSubmissions.length };
  };

  const mapSubmissionStatus = (s: Submission, dueDate?: Date | null): 'entregado' | 'atrasado' | 'faltante' | 'reentrega' | 'pendiente' | 'desconocido' => {
    if (s.state === 'RECLAIMED_BY_STUDENT') return 'reentrega';
    if (s.state === 'TURNED_IN' || s.state === 'RETURNED') {
      return s.late ? 'atrasado' : 'entregado';
    }
    if (s.state === 'CREATED') {
      if (dueDate) {
        const now = new Date();
        return now > dueDate ? 'faltante' : 'pendiente';
      }
      return 'pendiente';
    }
    return 'desconocido';
  };

  const getStatusColor = (stats: ReturnType<typeof getSubmissionStats>) => {
    const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;
    if (onTimeRate >= 80) return 'bg-green-500';
    if (onTimeRate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGlobalBadge = (dueDate?: Date | null) => {
    if (!dueDate) return { label: 'En curso', cls: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200' };
    const now = new Date();
    const ms = dueDate.getTime() - now.getTime();
    const hrs = ms / (1000 * 60 * 60);
    if (ms < 0) return { label: 'Vencida', cls: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' };
    if (hrs <= 48) return { label: 'Próx. a vencer', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' };
    return { label: 'En curso', cls: 'bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300' };
  };

  const filteredAssignments = useMemo(() => {
    const base = assignments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    const byStatus = statusFilter === 'all' ? base : base.filter(assignment => {
      const dueDate = assignment.dueDate ?? null;
      const relevant = submissions.filter(s => s.assignmentId === assignment.id);
      return relevant.some(s => mapSubmissionStatus(s, dueDate) === statusFilter);
    });
    const withStats = byStatus.map(a => {
      const stats = getSubmissionStats(a.id);
      const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;
      return { a, onTimeRate };
    });
    withStats.sort((x, y) => {
      if (sortBy === 'dueAsc') return (x.a.dueDate?.getTime() || 0) - (y.a.dueDate?.getTime() || 0);
      if (sortBy === 'dueDesc') return (y.a.dueDate?.getTime() || 0) - (x.a.dueDate?.getTime() || 0);
      if (sortBy === 'onTimeDesc') return y.onTimeRate - x.onTimeRate;
      return x.onTimeRate - y.onTimeRate;
    });
    return withStats.map(x => x.a);
  }, [assignments, submissions, statusFilter, search, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Tareas</h2>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="entregado">Entregado</option>
            <option value="atrasado">Atrasado</option>
            <option value="faltante">Faltante</option>
            <option value="pendiente">Pendiente</option>
            <option value="reentrega">Reentrega</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dueAsc">Vencimiento ↑</option>
            <option value="dueDesc">Vencimiento ↓</option>
            <option value="onTimeDesc">% a tiempo ↓</option>
            <option value="onTimeAsc">% a tiempo ↑</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map(assignment => {
          const stats = getSubmissionStats(assignment.id);
          const statusColor = getStatusColor(stats);
          const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;
          const badge = getGlobalBadge(assignment.dueDate ?? null);

          return (
            <div key={assignment.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{assignment.title}</h3>
                    {assignment.dueDate && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-slate-300 mt-1">
                        <Calendar size={14} className="mr-1" />
                        {format(assignment.dueDate, 'dd MMM yyyy', { locale: es })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                  <div className={`w-3 h-3 ${statusColor} rounded-full`} title={`% a tiempo: ${onTimeRate.toFixed(1)}%`}></div>
                </div>
              </div>

              {assignment.description && (
                <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">{assignment.description}</p>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-slate-300">Tasa de entrega a tiempo</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{onTimeRate.toFixed(1)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2" title={`${stats.turned_in - stats.late} a tiempo · ${stats.late} tardías · ${stats.pending} pendientes`}>
                  <div 
                    className={`${statusColor} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${onTimeRate}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center">
                    <CheckCircle size={14} className="text-green-500 mr-1" />
                    <span>{stats.turned_in} entregadas</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="text-yellow-500 mr-1" />
                    <span>{stats.late} tardías</span>
                  </div>
                  <div className="flex items-center">
                    <AlertTriangle size={14} className="text-red-500 mr-1" />
                    <span>{stats.pending} pendientes</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button onClick={() => setDetailId(assignment.id)} className="text-sm rounded-md border border-gray-300 dark:border-slate-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-100">Ver detalle</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {detailId && (() => {
        const a = assignments.find(x => x.id === detailId);
        const due = a?.dueDate ? format(a.dueDate, 'dd MMM yyyy', { locale: es }) : 'Sin fecha';
        const rel = submissions.filter(s => s.assignmentId === detailId);
        return (
          <div className="relative">
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDetailId(null)} />
            <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{a?.title}</h4>
                <button className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => setDetailId(null)}>Cerrar</button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-600 dark:text-slate-300">Vence: {due}</p>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Submissions</h5>
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-200 dark:divide-slate-700">
                  {rel.map((s) => {
                    const st = mapSubmissionStatus(s, a?.dueDate ?? null);
                    const color = st === 'entregado' ? 'text-emerald-600' : st === 'atrasado' ? 'text-amber-600' : st === 'faltante' || st === 'pendiente' ? 'text-red-600' : 'text-gray-600';
                    return (
                      <div key={s.id} className="py-2 text-sm flex items-center justify-between">
                        <span className="text-gray-800 dark:text-slate-100">Estudiante #{s.studentId}</span>
                        <span className={`font-medium ${color}`}>{st}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        );
      })()}
    </div>
  );
};

export default AssignmentsView;