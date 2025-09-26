import React, { useState, useMemo } from 'react';
import { GraduationCap, Mail, BookOpen, Users } from 'lucide-react';
import { Teacher } from '../types';
import { courses as seedCourses } from '../data/seed';
//

interface TeachersViewProps {
  teachers: Teacher[];
}

const TeachersView: React.FC<TeachersViewProps> = ({ teachers }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'coursesDesc' | 'studentsDesc'>('name');
  const [detailId, setDetailId] = useState<string | null>(null);

  const withKpis = useMemo(() => {
    // derive KPIs from seed data (courses and students)
    const map = teachers.map((t) => {
      const tCourses = seedCourses.filter(c => t.courses.includes(c.id));
      const studentIds = new Set<string>();
      tCourses.forEach(c => c.studentIds.forEach(id => studentIds.add(id)));
      return { t, coursesCount: tCourses.length, studentsCount: studentIds.size, courses: tCourses };
    });
    return map;
  }, [teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = withKpis.filter(({ t }) =>
      !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
    list.sort((a, b) => {
      if (sortBy === 'name') return a.t.name.localeCompare(b.t.name);
      if (sortBy === 'coursesDesc') return b.coursesCount - a.coursesCount;
      return b.studentsCount - a.studentsCount;
    });
    return list;
  }, [withKpis, search, sortBy]);

  const exportCSV = () => {
    const headers = ['ID','Nombre','Email','# Cursos','# Estudiantes'];
    const rows = filtered.map(row => [row.t.id, row.t.name, row.t.email, String(row.coursesCount), String(row.studentsCount)]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'profesores.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Profesores
          <span className="ml-2 align-middle text-sm font-normal text-gray-500 dark:text-slate-400">({filtered.length})</span>
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email"
              className="pl-3 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Orden: Nombre</option>
            <option value="coursesDesc">Orden: # Cursos ↓</option>
            <option value="studentsDesc">Orden: # Estudiantes ↓</option>
          </select>
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl shadow-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm">Exportar CSV</button>
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center text-gray-700 dark:text-slate-300">
          <p className="mb-3">No se encontraron profesores con los filtros actuales.</p>
          <button
            className="px-3 py-2 rounded-xl shadow-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
            onClick={() => setSearch('')}
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(({ t, coursesCount, studentsCount }) => (
          <div key={t.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setDetailId(t.id)}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{t.name}</h3>
                <span className="inline-block bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs px-2 py-1 rounded-full">
                  Profesor
                </span>
              </div>
            </div>
            <div className="h-px bg-gray-200 dark:bg-slate-700 my-3" />
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" />
                {t.email}
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2" />
                {coursesCount} cursos
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-2" />
                {studentsCount} estudiantes
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {detailId && (() => {
        const row = filtered.find(r => r.t.id === detailId);
        if (!row) return null;
        const { t, courses } = row;
        return (
          <div className="relative">
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDetailId(null)} />
            <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t.name}</h4>
                <button className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => setDetailId(null)}>Cerrar</button>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-700 dark:text-slate-300">
                  <div className="mb-1"><span className="font-medium">Email:</span> {t.email}</div>
                  <div className="mb-1"><span className="font-medium">Cursos:</span> {courses.length}</div>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Cursos asignados</h5>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-slate-300">
                    {courses.map(c => (
                      <li key={c.id} className="flex justify-between">
                        <span>{c.name} ({c.section || '—'})</span>
                        <span className="text-xs text-gray-500">Cohorte: {c.cohort}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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

export default TeachersView;