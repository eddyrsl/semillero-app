import React, { useMemo } from 'react';
import { Users, GraduationCap, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types';
import { dashboardStatsExample as baseline } from '../data/seed';

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const statCards = [
    { key: 'totalStudents', title: 'Estudiantes', value: stats.totalStudents, base: baseline.totalStudents, icon: Users, gradient: 'from-blue-500 to-blue-400' },
    { key: 'totalTeachers', title: 'Profesores', value: stats.totalTeachers, base: baseline.totalTeachers, icon: GraduationCap, gradient: 'from-emerald-500 to-emerald-400' },
    { key: 'totalCourses',  title: 'Cursos', value: stats.totalCourses, base: baseline.totalCourses, icon: FileText, gradient: 'from-purple-500 to-purple-400' },
    { key: 'totalAssignments', title: 'Tareas', value: stats.totalAssignments, base: baseline.totalAssignments, icon: TrendingUp, gradient: 'from-orange-500 to-orange-400' },
  ];

  const submissionStats = [
    { key: 'onTimeSubmissions', title: 'A Tiempo', value: stats.onTimeSubmissions, base: baseline.onTimeSubmissions, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-400' },
    { key: 'lateSubmissions', title: 'Tardías', value: stats.lateSubmissions, base: baseline.lateSubmissions, icon: Clock, gradient: 'from-amber-500 to-amber-400' },
    { key: 'pendingSubmissions', title: 'Pendientes', value: stats.pendingSubmissions, base: baseline.pendingSubmissions, icon: AlertTriangle, gradient: 'from-rose-500 to-rose-400' },
  ];

  const computeDelta = (current: number, base: number) => {
    if (!base) return { label: '—', cls: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300' };
    const diff = ((current - base) / base) * 100;
    const formatted = `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
    const cls = diff >= 0
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300';
    return { label: `vs. base ${formatted}`, cls };
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard General</h2>
          <button className="px-3 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">
            Exportar CSV
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-full mr-4 shadow-inner`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-slate-300 text-sm">{stat.title}</p>
                      <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100 leading-tight">{stat.value}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  {(() => {
                    const delta = computeDelta(stat.value as number, stat.base as number);
                    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${delta.cls}`}>{delta.label}</span>;
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submission Stats */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Estado de Entregas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {submissionStats.map((stat) => {
              const Icon = stat.icon;
              const delta = computeDelta(stat.value as number, stat.base as number);
              return (
                <div key={stat.title} className="flex items-center justify-between bg-white/0 rounded-lg">
                  <div className="flex items-center">
                    <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-full mr-3`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-slate-300 text-sm">{stat.title}</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">{stat.value}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${delta.cls}`}>{delta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;