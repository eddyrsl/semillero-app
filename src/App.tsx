import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentsView from './components/StudentsView';
import TeachersView from './components/TeachersView';
import AssignmentsView from './components/AssignmentsView';
import ReportsView from './components/ReportsView';
import NotificationsView from './components/NotificationsView';
import { Student, Teacher, Assignment, Submission, DashboardStats, CohorteStats } from './types';
import { getHealth, listCourses, getSummary, listAggregatedTeachers, listAggregatedStudents, listStudentsProgress, logout } from './api/classroom';
import Login from './components/Login';
import ThemeSwitch from './components/ThemeSwitch';
import {
  students as seedStudents,
  teachers as seedTeachers,
  courses as seedCourses,
  assignments as seedAssignments,
  submissions as seedSubmissions,
  computeDashboardStats,
  cohortStats as seedCohorteStats,
} from './data/seed';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [backendOk, setBackendOk] = useState<boolean>(false);

  // Seed data (mock) - reemplazable por datos reales del backend
  const [students, setStudents] = useState<Student[]>(seedStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(seedTeachers);
  const [assignments] = useState<Assignment[]>(seedAssignments);
  const [submissions] = useState<Submission[]>(seedSubmissions);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(() =>
    computeDashboardStats(students, teachers, seedCourses, assignments, submissions)
  );

  const cohorteStats: CohorteStats[] = seedCohorteStats;

  const [cohorts, setCohorts] = useState<string[]>(
    Array.from(new Set(seedCourses.map(c => c.cohort))).sort()
  );
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [studentProgress, setStudentProgress] = useState<Record<string, number>>({});
  const [studentProgressTotals, setStudentProgressTotals] = useState<Record<string, { total: number; entregado: number; atrasado: number; faltante: number; pendiente: number; reentrega: number }>>({});

  const handleCohortChange = (c: string) => setSelectedCohort(c);
  const handleTeacherChange = (t: string) => setSelectedTeacherId(t);

  useEffect(() => {
    // Quick health check and auth probe (no bloquea el uso de seeds)
    (async () => {
      try {
        const health = await getHealth();
        setBackendOk(Boolean(health?.ok));
      } catch {
        setBackendOk(false);
      }
      try {
        await listCourses(1);
        setIsAuthed(true);
      } catch (err: any) {
        if (err?.response?.status === 401) setIsAuthed(false);
        else setIsAuthed(null);
      }
    })();
  }, []);

  useEffect(() => {
    // Si hay backend y auth, intenta reemplazar stats; si falla o no aplica, usa seeds filtrados
    (async () => {
      const filteredCourses = seedCourses.filter(c => (selectedCohort ? c.cohort === selectedCohort : true));
      const courseIds = new Set(filteredCourses.map(c => c.id));

      const filteredTeachers = seedTeachers.filter(t => {
        const teachesSelected = t.courses.some(cid => courseIds.has(cid));
        return selectedTeacherId ? t.id === selectedTeacherId : teachesSelected || !selectedCohort;
      });
      const teacherIds = new Set(filteredTeachers.map(t => t.id));

      const filteredStudents = seedStudents.filter(s => (selectedCohort ? s.cohort === selectedCohort : true));

      const filteredAssignments = seedAssignments.filter(a => courseIds.has(a.courseId));
      const filteredSubmissions = seedSubmissions.filter(sub => filteredAssignments.some(a => a.id === sub.assignmentId));

      // Fallback local
      setDashboardStats(
        computeDashboardStats(filteredStudents, filteredTeachers, filteredCourses, filteredAssignments, filteredSubmissions)
      );

      if (backendOk && isAuthed) {
        try {
          const params: any = {};
          if (selectedCohort) params.cohort = selectedCohort;
          if (selectedTeacherId) params.teacherId = selectedTeacherId;
          const summary = await getSummary(Object.keys(params).length ? params : undefined);
          if (summary) {
            const hasData =
              (Number(summary.totalStudents) || 0) +
              (Number(summary.totalTeachers) || 0) +
              (Number(summary.totalCourses) || 0) +
              (Number(summary.totalAssignments) || 0) +
              (Number(summary.onTimeSubmissions) || 0) +
              (Number(summary.lateSubmissions) || 0) +
              (Number(summary.pendingSubmissions) || 0) > 0;
            if (hasData) setDashboardStats(summary);
          }
        } catch {
          // mantener fallback local
        }
      }
    })();
  }, [backendOk, isAuthed, selectedCohort, selectedTeacherId]);

  // Load cohorts (from courses), teachers and filtered students from backend when authenticated
  useEffect(() => {
    (async () => {
      if (!backendOk || !isAuthed) return;
      try {
        // Derive cohorts from courses list
        const { courses } = await listCourses();
        const deriveCohort = (course: any) => course?.section || course?.name || 'General';
        const unique = Array.from(new Set((courses || []).map((c: any) => String(deriveCohort(c)))));
        unique.sort();
        setCohorts(unique);
      } catch {}

      try {
        const { teachers: aggTeachers } = await listAggregatedTeachers(selectedCohort ? { cohort: selectedCohort } : undefined);
        const mapped: Teacher[] = (aggTeachers || []).map((t: any) => ({
          id: String(t.id),
          name: t.name || t.email || 'Profesor',
          email: t.email || '',
          courses: t.courses || [],
        }));
        if ((mapped?.length || 0) > 0) {
          setTeachers(mapped);
          if (selectedTeacherId && !mapped.find(t => t.id === selectedTeacherId)) {
            setSelectedTeacherId('');
          }
        } else {
          // Fallback a seeds filtrados por cohorte
          const filteredSeedTeachers = seedTeachers.filter(t => {
            if (!selectedCohort) return true;
            const teachesCohort = seedCourses
              .filter(c => c.cohort === selectedCohort)
              .some(c => t.courses.includes(c.id));
            return teachesCohort;
          });
          setTeachers(filteredSeedTeachers);
        }
      } catch {
        const filteredSeedTeachers = seedTeachers.filter(t => {
          if (!selectedCohort) return true;
          const teachesCohort = seedCourses
            .filter(c => c.cohort === selectedCohort)
            .some(c => t.courses.includes(c.id));
          return teachesCohort;
        });
        setTeachers(filteredSeedTeachers);
      }

      try {
        const params: any = {};
        if (selectedCohort) params.cohort = selectedCohort;
        if (selectedTeacherId) params.teacherId = selectedTeacherId;
        const { students: aggStudents } = await listAggregatedStudents(Object.keys(params).length ? params : undefined);
        const mapped: Student[] = (aggStudents || []).map((s: any) => ({
          id: String(s.id),
          name: s.name || s.email || 'Estudiante',
          email: s.email || '',
          cohort: s.cohort || 'General',
          enrolledCourses: s.enrolledCourses || [],
        }));
        if ((mapped?.length || 0) > 0) {
          setStudents(mapped);
        } else {
          // Fallback a seeds filtrados por cohorte/profesor
          const filteredSeedStudents = seedStudents.filter(s => (selectedCohort ? s.cohort === selectedCohort : true)).filter(s => {
            if (!selectedTeacherId) return true;
            // estudiante pertenece a algun curso del profesor seleccionado
            const teacher = seedTeachers.find(t => t.id === selectedTeacherId);
            if (!teacher) return true;
            return s.enrolledCourses.some(cid => teacher.courses.includes(cid));
          });
          setStudents(filteredSeedStudents);
        }
        // Fetch progress map
        try {
          const { students: progressList } = await listStudentsProgress(Object.keys(params).length ? params : undefined);
          const prog: Record<string, number> = {};
          const totals: Record<string, { total: number; entregado: number; atrasado: number; faltante: number; pendiente: number; reentrega: number }> = {};
          (progressList || []).forEach((p: any) => {
            const id = String(p.id);
            prog[id] = Number(p.onTimePercentage) || 0;
            if (p.totals) {
              totals[id] = {
                total: Number(p.totals.total) || 0,
                entregado: Number(p.totals.entregado) || 0,
                atrasado: Number(p.totals.atrasado) || 0,
                faltante: Number(p.totals.faltante) || 0,
                pendiente: Number(p.totals.pendiente) || 0,
                reentrega: Number(p.totals.reentrega) || 0,
              };
            }
          });
          setStudentProgress(prog);
          setStudentProgressTotals(totals);
        } catch {
          setStudentProgress({});
          setStudentProgressTotals({});
        }
      } catch {
        // fallback a seeds si falla llamada
        const filteredSeedStudents = seedStudents.filter(s => (selectedCohort ? s.cohort === selectedCohort : true)).filter(s => {
          if (!selectedTeacherId) return true;
          const teacher = seedTeachers.find(t => t.id === selectedTeacherId);
          if (!teacher) return true;
          return s.enrolledCourses.some(cid => teacher.courses.includes(cid));
        });
        setStudents(filteredSeedStudents);
      }
    })();
  }, [backendOk, isAuthed, selectedCohort, selectedTeacherId]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard stats={dashboardStats} />;
      case 'students':
        return (
          <StudentsView
            students={students}
            cohorts={cohorts}
            selectedCohort={selectedCohort}
            onCohortChange={handleCohortChange}
            teachers={teachers}
            selectedTeacherId={selectedTeacherId}
            onTeacherChange={handleTeacherChange}
            progressMap={studentProgress}
            progressTotals={studentProgressTotals}
          />
        );
      case 'teachers':
        return <TeachersView teachers={teachers} />;
      case 'assignments':
        return <AssignmentsView assignments={assignments} submissions={submissions} />;
      case 'reports':
        return <ReportsView cohorteStats={cohorteStats} />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return (
          <div className="max-w-3xl mx-auto py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cuenta</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cierra tu sesión actual y elimina las credenciales almacenadas temporalmente en el servidor.
              </p>
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } finally {
                    setIsAuthed(false);
                    setStudents([]);
                    setTeachers([]);
                    setStudentProgress({});
                    setStudentProgressTotals({});
                    setSelectedCohort('');
                    setSelectedTeacherId('');
                    setDashboardStats(prev => ({
                      ...prev,
                      totalStudents: 0,
                      totalTeachers: 0,
                      totalCourses: 0,
                      totalAssignments: 0,
                      onTimeSubmissions: 0,
                      lateSubmissions: 0,
                      pendingSubmissions: 0,
                    }));
                    setActiveSection('dashboard');
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferencias</h3>
              <p className="text-sm text-gray-600">Próximamente: idioma, tema visual, periodo por defecto, etc.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard stats={dashboardStats} />;
    }
  };

  return (
    // If not authenticated, show a clean login screen without sidebar or filters
    !isAuthed ? (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
        <div className="max-w-5xl mx-auto mb-6 flex justify-end">
          <ThemeSwitch />
        </div>
        <Login buttonVariant="primary" />
      </div>
    ) : (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-8">
        <div className="mb-6 flex justify-end">
          <ThemeSwitch />
        </div>
        
        {renderActiveSection()}
      </main>
    </div>
    )
  );
}

export default App;