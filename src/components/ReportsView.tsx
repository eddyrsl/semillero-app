import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine, Legend } from 'recharts';
import { CohorteStats } from '../types';
import { courses as seedCourses, assignments as seedAssignments, submissions as seedSubmissions, teachers as seedTeachers, students as seedStudents } from '../data/seed';

interface ReportsViewProps {
  cohorteStats: CohorteStats[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ cohorteStats }) => {
  // Step 2: comparison and drill-down state
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>(() => cohorteStats.map(c => c.cohort));
  const [drillCohort, setDrillCohort] = useState<string | null>(null);
  const submissionData = [
    { name: 'A Tiempo', value: 75, color: '#2CB67D' }, // verde azulado
    { name: 'Tardías', value: 15, color: '#EAB308' },  // mostaza
    { name: 'Pendientes', value: 10, color: '#8B5CF6' }, // violeta
  ];

  const COLORS = submissionData.map(item => item.color);

  const cohortOptions = useMemo(() => cohorteStats.map(c => c.cohort), [cohorteStats]);
  const filteredCohortStats = useMemo(() => {
    const set = new Set(selectedCohorts);
    return cohorteStats.filter(c => set.has(c.cohort));
  }, [cohorteStats, selectedCohorts]);

  // Nota: se removió exportCohortStatsCSV por no usarse actualmente

  // Pivot controls and data (moved out of tooltip)
  const [groupBy, setGroupBy] = useState<'cohort' | 'course' | 'teacher'>('cohort');

  type PivotRow = {
    key: string;
    label: string;
    students: number;
    totalAssignments: number;
    onTime: number;
    late: number;
    pending: number;
    onTimePct: number;
  };

  const pivotData: PivotRow[] = useMemo(() => {
    const rows: PivotRow[] = [];
    if (groupBy === 'cohort') {
      const cohorts = Array.from(new Set(seedCourses.map(c => c.cohort)));
      cohorts.forEach(co => {
        const courses = seedCourses.filter(c => c.cohort === co);
        const aIds = seedAssignments.filter(a => courses.some(c => c.id === a.courseId)).map(a => a.id);
        const subs = seedSubmissions.filter(s => aIds.includes(s.assignmentId));
        const onTime = subs.filter(s => s.state === 'TURNED_IN' && !s.late).length;
        const late = subs.filter(s => (s.state === 'TURNED_IN' && s.late) || (s.state === 'RECLAIMED_BY_STUDENT' && s.late)).length;
        const pending = subs.filter(s => s.state === 'CREATED').length;
        const total = onTime + late + pending;
        const students = new Set(courses.flatMap(c => c.studentIds)).size;
        rows.push({ key: co, label: co, students, totalAssignments: aIds.length, onTime, late, pending, onTimePct: total ? (onTime / total) * 100 : 0 });
      });
    } else if (groupBy === 'course') {
      seedCourses.forEach(c => {
        const aIds = seedAssignments.filter(a => a.courseId === c.id).map(a => a.id);
        const subs = seedSubmissions.filter(s => aIds.includes(s.assignmentId));
        const onTime = subs.filter(s => s.state === 'TURNED_IN' && !s.late).length;
        const late = subs.filter(s => (s.state === 'TURNED_IN' && s.late) || (s.state === 'RECLAIMED_BY_STUDENT' && s.late)).length;
        const pending = subs.filter(s => s.state === 'CREATED').length;
        const total = onTime + late + pending;
        rows.push({ key: c.id, label: c.name, students: c.studentIds.length, totalAssignments: aIds.length, onTime, late, pending, onTimePct: total ? (onTime / total) * 100 : 0 });
      });
    } else {
      seedTeachers.forEach(t => {
        const tCourses = seedCourses.filter(c => t.courses.includes(c.id));
        if (tCourses.length === 0) return;
        const aIds = seedAssignments.filter(a => tCourses.some(c => c.id === a.courseId)).map(a => a.id);
        const subs = seedSubmissions.filter(s => aIds.includes(s.assignmentId));
        const onTime = subs.filter(s => s.state === 'TURNED_IN' && !s.late).length;
        const late = subs.filter(s => (s.state === 'TURNED_IN' && s.late) || (s.state === 'RECLAIMED_BY_STUDENT' && s.late)).length;
        const pending = subs.filter(s => s.state === 'CREATED').length;
        const total = onTime + late + pending;
        const students = new Set(tCourses.flatMap(c => c.studentIds)).size;
        rows.push({ key: t.id, label: t.name, students, totalAssignments: aIds.length, onTime, late, pending, onTimePct: total ? (onTime / total) * 100 : 0 });
      });
    }
    return rows;
  }, [groupBy]);

  // Redesign data: global four-state summary and per-entity breakdowns
  const statusSummary = useMemo(() => {
    const all = seedSubmissions;
    const entregado = all.filter(s => s.state === 'TURNED_IN' && !s.late).length; // entregado a tiempo
    const atrasado = all.filter(s => s.state === 'TURNED_IN' && s.late).length;   // entregado tarde
    const faltante = all.filter(s => s.state === 'CREATED').length;               // aún no entregado
    const reentrega = all.filter(s => s.state === 'RECLAIMED_BY_STUDENT').length; // retirado para reentregar
    const total = entregado + atrasado + faltante + reentrega;
    const pct = (n: number) => (total ? (n / total) * 100 : 0);
    return {
      entregado, atrasado, faltante, reentrega, total,
      data: [
        { name: 'Entregado', value: entregado, color: '#22C55E', pct: pct(entregado) },
        { name: 'Atrasado',  value: atrasado,  color: '#EF4444', pct: pct(atrasado) },
        { name: 'Faltante',  value: faltante,  color: '#93C5FD', pct: pct(faltante) },
        { name: 'Reentrega', value: reentrega, color: '#F59E0B', pct: pct(reentrega) },
      ],
    };
  }, []);

  type StudentRow = {
    id: string;
    name: string;
    entregado: number;
    atrasado: number;
    faltante: number;
    reentrega: number;
    total: number;
    progressPct: number; // (entregado+atrasado)/total
  };

  const studentsProgress: StudentRow[] = useMemo(() => {
    return seedStudents.map((st) => {
      const aIds = seedAssignments.filter(a => st.enrolledCourses.includes(a.courseId)).map(a => a.id);
      const subs = seedSubmissions.filter(s => aIds.includes(s.assignmentId) && s.studentId === st.id);
      const entregado = subs.filter(s => s.state === 'TURNED_IN' && !s.late).length;
      const atrasado = subs.filter(s => s.state === 'TURNED_IN' && s.late).length;
      const faltante = subs.filter(s => s.state === 'CREATED').length;
      const reentrega = subs.filter(s => s.state === 'RECLAIMED_BY_STUDENT').length;
      const total = aIds.length; // total esperado para el alumno
      const progressPct = total ? ((entregado + atrasado) / total) * 100 : 0;
      return { id: st.id, name: st.name, entregado, atrasado, faltante, reentrega, total, progressPct };
    });
  }, []);

  const teachersList = useMemo(() => {
    return seedTeachers.map(t => {
      const tCourses = seedCourses.filter(c => t.courses.includes(c.id));
      const studentsSet = new Set(tCourses.flatMap(c => c.studentIds));
      return {
        id: t.id,
        name: t.name,
        courseCount: tCourses.length,
        totalStudents: studentsSet.size,
        courses: tCourses.map(c => c.name),
      };
    });
  }, []);

  const exportPivotCSV = () => {
    const headers = ['Grupo', 'Estudiantes', 'Total Tareas', 'A tiempo', 'Tardías', 'Pendientes', '% A tiempo'];
    const rows = pivotData.map(r => [r.label, r.students, r.totalAssignments, r.onTime, r.late, r.pending, `${r.onTimePct.toFixed(1)}%`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pivot_report.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      return (
        <div className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
          <div className="font-medium text-gray-900 dark:text-slate-100">Cohorte: {label}</div>
          <div className="text-gray-700 dark:text-slate-300">Entregas a tiempo: {value.toFixed(1)}%</div>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
          <div className="font-medium text-gray-900 dark:text-slate-100">{p.name}</div>
          <div className="text-gray-700 dark:text-slate-300">{p.value}%</div>
        </div>
      );
    }
    return null;
  };

  

  // Classes stacked bars computed from seeds
  const classStacks = seedCourses.map((course) => {
    const courseAssignmentIds = seedAssignments.filter(a => a.courseId === course.id).map(a => a.id);
    const subs = seedSubmissions.filter(s => courseAssignmentIds.includes(s.assignmentId));
    const onTime = subs.filter(s => s.state === 'TURNED_IN' && !s.late).length;
    const late = subs.filter(s => (s.state === 'TURNED_IN' && s.late) || (s.state === 'RECLAIMED_BY_STUDENT' && s.late)).length;
    const pending = subs.filter(s => s.state === 'CREATED').length;
    return { course: course.name, onTime, late, pending };
  });

  // Data for redesigned table: totals and percentages per class
  const classTable = classStacks.map((row) => {
    const total = row.onTime + row.late + row.pending;
    const pct = (n: number) => (total ? (n / total) * 100 : 0);
    return {
      ...row,
      total,
      onTimePct: pct(row.onTime),
      latePct: pct(row.late),
      pendingPct: pct(row.pending),
    };
  });

  const exportClassesCSV = () => {
    const headers = ['Curso', 'A tiempo', 'Tardías', 'Pendientes', 'Total', '% A tiempo', '% Tardías', '% Pendientes'];
    const rows = classTable.map(r => [
      r.course,
      String(r.onTime),
      String(r.late),
      String(r.pending),
      String(r.total),
      `${r.onTimePct.toFixed(1)}%`,
      `${r.latePct.toFixed(1)}%`,
      `${r.pendingPct.toFixed(1)}%`,
    ]);
    const csv = [headers, ...rows].map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'clases_estado_entregas.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Reportes y Analytics</h2>
        {/* Cohort multi-select */}
        <div className="flex flex-wrap items-center gap-2">
          {cohortOptions.map((c) => {
            const checked = selectedCohorts.includes(c);
            return (
              <label key={c} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer select-none ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-100 border-gray-300 dark:border-slate-600'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedCohorts((prev) => e.target.checked ? Array.from(new Set([...prev, c])) : prev.filter(x => x !== c));
                  }}
                />
                {c}
              </label>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Performance Chart */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Rendimiento por Cohorte (% Entregas a Tiempo)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredCohortStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort" />
              <YAxis domain={[0, 100]} />
              <ReferenceLine y={80} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Meta 80%', position: 'insideTopRight', fill: '#10B981' }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="onTimePercentage" radius={[4, 4, 0, 0]} onClick={(d: any) => setDrillCohort(d?.cohort || null)}>
                {/* Colors: light brown, gray, light blue */}
                {filteredCohortStats.map((_, idx) => (
                  <Cell key={`cohort-bar-${idx}`} fill={idx === 0 ? '#C49A6C' : idx === 1 ? '#94A3B8' : '#93C5FD'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">
            Barras: café claro (1ª cohorte), gris (2ª), azul claro (3ª); representan el % de entregas a tiempo por cohorte. Línea discontinua verde: meta del 80%. Eje X: cohortes. Eje Y: porcentaje.
          </p>
        </div>

      {/* Distribución General de Entregas (Pie) */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Distribución General de Entregas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={submissionData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {submissionData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">Verde azulado: entregas a tiempo. Mostaza: entregas tardías. Violeta: entregas pendientes (no enviadas).</p>
      </div>

      {/* Clases por Estado de Entregas (Apiladas) */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Clases por Estado de Entregas</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={classStacks} margin={{ right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="course" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="onTime" name="A tiempo" stackId="a" fill="#22C55E" radius={[4,4,0,0]} />
            <Bar dataKey="late" name="Tardías" stackId="a" fill="#EF4444" radius={[4,4,0,0]} />
            <Bar dataKey="pending" name="Pendientes" stackId="a" fill="#93C5FD" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-xs text-gray-600 dark:text-slate-300 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{background:'#22C55E'}} /> A tiempo: entregas dentro del plazo.</div>
          <div className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{background:'#EF4444'}} /> Tardías: entregas realizadas después del vencimiento.</div>
          <div className="inline-flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{background:'#93C5FD'}} /> Pendientes: aún no entregadas.</div>
        </div>
      </div>

      {/* Clases por Estado de Entregas (100% Horizontal) */}
      {(() => {
        const classStacksPct = classTable.map(r => ({
          course: r.course,
          onTimePct: Number(r.onTimePct.toFixed(2)),
          latePct: Number(r.latePct.toFixed(2)),
          pendingPct: Number(r.pendingPct.toFixed(2)),
          onTime: r.onTime,
          late: r.late,
          pending: r.pending,
          total: r.total,
        }));
        return (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Clases por Estado (Proporción 100%)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={classStacksPct} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="course" width={120} />
                <Tooltip formatter={(value: any, name: any) => [`${Number(value).toFixed(0)}%`, name]} labelFormatter={(label) => `Curso: ${label}`} />
                <Legend />
                <Bar dataKey="onTimePct" name="A tiempo" stackId="p" fill="#22C55E" radius={[0,4,4,0]} />
                <Bar dataKey="latePct" name="Tardías" stackId="p" fill="#EF4444" radius={[0,0,0,0]} />
                <Bar dataKey="pendingPct" name="Pendientes" stackId="p" fill="#93C5FD" radius={[4,0,0,4]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">Cada barra ocupa el 100% y muestra la composición proporcional de entregas por clase: verde (A tiempo), rojo (Tardías), azul claro (Pendientes). Ideal para comparar proporciones entre clases.</p>
          </div>
        );
      })()}

        
      </div>

      {/* Redesigned table mirroring the stacked bars per class */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Tabla por Clase (equivalente a la gráfica)</h3>
          <button onClick={exportClassesCSV} className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700">Exportar CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Curso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Distribución</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">A tiempo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Tardías</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Pendientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {classTable.map((r) => (
                <tr key={r.course} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{r.course}</td>
                  <td className="px-6 py-3">
                    <div className="w-full h-4 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full" style={{ width: `${r.onTimePct}%`, background: '#22C55E' }} />
                      <div className="h-full" style={{ width: `${r.latePct}%`, background: '#EF4444' }} />
                      <div className="h-full" style={{ width: `${r.pendingPct}%`, background: '#93C5FD' }} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:'#22C55E'}} />{r.onTime} ({r.onTimePct.toFixed(0)}%)</span>
                      <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:'#EF4444'}} />{r.late} ({r.latePct.toFixed(0)}%)</span>
                      <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:'#93C5FD'}} />{r.pending} ({r.pendingPct.toFixed(0)}%)</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">{r.onTime}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-500/15 text-rose-600 dark:text-rose-300">{r.late}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-600 dark:text-blue-300">{r.pending}</span>
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">La columna "Distribución" resume visualmente los mismos datos de la gráfica apilada: verde (A tiempo), rojo (Tardías), azul claro (Pendientes).</p>
      </div>

      
      {drillCohort && (
        <div className="relative">
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setDrillCohort(null)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Detalle de {drillCohort}</h4>
              <button className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600" onClick={() => setDrillCohort(null)}>Cerrar</button>
            </div>
            <div className="p-4 space-y-4">
              <section>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Cursos destacados</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span className="text-gray-700 dark:text-slate-300">{drillCohort} - Matemáticas</span><span className="font-medium text-emerald-500">85% a tiempo</span></li>
                  <li className="flex justify-between"><span className="text-gray-700 dark:text-slate-300">{drillCohort} - Ciencias</span><span className="font-medium text-yellow-500">72% a tiempo</span></li>
                  <li className="flex justify-between"><span className="text-gray-700 dark:text-slate-300">{drillCohort} - Historia</span><span className="font-medium text-red-500">61% a tiempo</span></li>
                </ul>
              </section>
              <section>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Profesores con mayor mejora</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span className="text-gray-700 dark:text-slate-300">Prof. García</span><span className="font-medium text-emerald-500">+12% vs semana pasada</span></li>
                  <li className="flex justify-between"><span className="text-gray-700 dark:text-slate-300">Prof. Vega</span><span className="font-medium text-emerald-500">+8%</span></li>
                </ul>
              </section>
              <section>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Acciones sugeridas</h5>
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-slate-300 space-y-1">
                  <li>Revisión de tareas atrasadas en Ciencias.</li>
                  <li>Refuerzo en Historia: enviar recordatorios 48h antes.</li>
                </ul>
              </section>
            </div>
          </aside>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Tabla Dinámica y Barras Agrupadas</h3>
          <div className="flex items-center gap-3">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cohort">Agrupar por Cohorte</option>
              <option value="course">Agrupar por Curso</option>
              <option value="teacher">Agrupar por Profesor</option>
            </select>
            <button
              onClick={exportPivotCSV}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Grouped bars (absolute counts) */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={pivotData} margin={{ right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} angle={0} height={50} tick={{ fill: '#9CA3AF' }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTime" name="A tiempo" fill="#22C55E" radius={[4,4,0,0]} />
              <Bar dataKey="late" name="Tardías" fill="#EF4444" radius={[4,4,0,0]} />
              <Bar dataKey="pending" name="Pendientes" fill="#93C5FD" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-3 text-xs text-gray-600 dark:text-slate-300">
            El gráfico compara, por el agrupamiento seleccionado, la cantidad de entregas a tiempo (verde), tardías (rojo) y pendientes (azul claro).
          </p>
        </div>

        {/* Pivot table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Estudiantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Total Tareas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">A tiempo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Tardías</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Pendientes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">% A tiempo</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {pivotData.map((r) => (
                <tr key={r.key} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{r.label}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-300">{r.students}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-300">{r.totalAssignments}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-300">{r.onTime}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-300">{r.late}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-slate-300">{r.pending}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{r.onTimePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    {/* Estado de las entregas (4 estados) */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 lg:col-span-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Estado de las Entregas</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={statusSummary.data} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name">
              {statusSummary.data.map((d, i) => (
                <Cell key={`s-${i}`} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any, n: any) => [String(v), n]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
          <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{background:'#22C55E'}} />Entregado</div>
          <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{background:'#EF4444'}} />Atrasado</div>
          <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{background:'#93C5FD'}} />Faltante</div>
          <div><span className="inline-block w-3 h-3 rounded-sm align-middle mr-2" style={{background:'#F59E0B'}} />Reentrega</div>
        </div>
      </div>

      {/* Lista de alumnos y su progreso */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Lista de alumnos y su progreso</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Progreso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Entregado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Atrasado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Faltante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Reentrega</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {studentsProgress.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-6 py-3">
                    <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${s.progressPct}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{s.progressPct.toFixed(0)}% completado</div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{s.entregado}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{s.atrasado}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{s.faltante}</td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-slate-100">{s.reentrega}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Lista de profesores y sus clases */}
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Profesores y sus clases</h3>
      <ul className="space-y-4">
        {teachersList.map(t => (
          <li key={t.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-300">Profesor</p>
                <p className="text-base font-semibold text-gray-900 dark:text-slate-100">{t.name}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm"><span className="font-semibold text-gray-900 dark:text-slate-100">{t.courseCount}</span> clases</div>
                <div className="text-sm"><span className="font-semibold text-gray-900 dark:text-slate-100">{t.totalStudents}</span> estudiantes</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.courses.map((c, idx) => (
                <span key={idx} className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40">{c}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
  </div>
</div>
  );
};

export default ReportsView;