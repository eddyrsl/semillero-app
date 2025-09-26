import type {
  Student,
  Teacher,
  Course,
  Assignment,
  Submission,
  DashboardStats,
  CohorteStats,
} from '../types';

export const teachers: Teacher[] = [
  { id: 't1', name: 'María García', email: 'maria.garcia@school.edu', courses: [] },
  { id: 't2', name: 'Juan Pérez', email: 'juan.perez@school.edu', courses: [] },
  { id: 't3', name: 'Laura Vega', email: 'laura.vega@school.edu', courses: [] },
];

export const courses: Course[] = [
  { id: 'c-math-1', name: 'Matemáticas I', section: 'A', teacherId: 't1', studentIds: [], cohort: '2024-A' },
  { id: 'c-sci-1',  name: 'Ciencias',     section: 'B', teacherId: 't2', studentIds: [], cohort: '2024-A' },
  { id: 'c-his-1',  name: 'Historia',     section: 'A', teacherId: 't3', studentIds: [], cohort: '2024-B' },
  { id: 'c-lit-1',  name: 'Literatura',   section: 'B', teacherId: 't2', studentIds: [], cohort: '2024-B' },
  { id: 'c-math-2', name: 'Matemáticas II', section: 'C', teacherId: 't1', studentIds: [], cohort: '2024-C' },
];

export const students: Student[] = [
  { id: 's1',  name: 'Ana Torres',   email: 'ana.torres@school.edu',   cohort: '2024-A', enrolledCourses: ['c-math-1', 'c-sci-1'] },
  { id: 's2',  name: 'Luis Díaz',    email: 'luis.diaz@school.edu',    cohort: '2024-A', enrolledCourses: ['c-math-1'] },
  { id: 's3',  name: 'Sofía Ramos',  email: 'sofia.ramos@school.edu',  cohort: '2024-A', enrolledCourses: ['c-sci-1'] },
  { id: 's4',  name: 'Miguel Rojas', email: 'miguel.rojas@school.edu', cohort: '2024-A', enrolledCourses: ['c-math-1', 'c-sci-1'] },

  { id: 's5',  name: 'Valeria León',  email: 'valeria.leon@school.edu',  cohort: '2024-B', enrolledCourses: ['c-his-1', 'c-lit-1'] },
  { id: 's6',  name: 'Diego Flores',  email: 'diego.flores@school.edu',  cohort: '2024-B', enrolledCourses: ['c-his-1'] },
  { id: 's7',  name: 'Paula Gómez',   email: 'paula.gomez@school.edu',   cohort: '2024-B', enrolledCourses: ['c-lit-1'] },
  { id: 's8',  name: 'Carlos Méndez', email: 'carlos.mendez@school.edu', cohort: '2024-B', enrolledCourses: ['c-his-1', 'c-lit-1'] },

  { id: 's9',  name: 'Elena Cruz',   email: 'elena.cruz@school.edu',   cohort: '2024-C', enrolledCourses: ['c-math-2'] },
  { id: 's10', name: 'Jorge Silva',  email: 'jorge.silva@school.edu',  cohort: '2024-C', enrolledCourses: ['c-math-2'] },
  { id: 's11', name: 'Marcos Lara',  email: 'marcos.lara@school.edu',  cohort: '2024-C', enrolledCourses: ['c-math-2'] },
  { id: 's12', name: 'Nadia Ortiz',  email: 'nadia.ortiz@school.edu',  cohort: '2024-C', enrolledCourses: ['c-math-2'] },
];

for (const c of courses) {
  c.studentIds = students.filter(s => s.enrolledCourses.includes(c.id)).map(s => s.id);
}
for (const t of teachers) {
  t.courses = courses.filter(c => c.teacherId === t.id).map(c => c.id);
}

export const assignments: Assignment[] = [
  {
    id: 'a1',
    title: 'Examen de Álgebra',
    description: 'Ecuaciones lineales y cuadráticas',
    courseId: 'c-math-1',
    dueDate: new Date('2025-10-05'),
    maxPoints: 100,
    createdTime: new Date('2025-09-10'),
    updatedTime: new Date('2025-09-15'),
  },
  {
    id: 'a2',
    title: 'Proyecto de Ciencias',
    description: 'Investigación sobre el sistema solar',
    courseId: 'c-sci-1',
    dueDate: new Date('2025-10-02'),
    maxPoints: 100,
    createdTime: new Date('2025-09-08'),
    updatedTime: new Date('2025-09-20'),
  },
  {
    id: 'a3',
    title: 'Ensayo de Historia',
    description: 'Revolución industrial: impactos sociales',
    courseId: 'c-his-1',
    dueDate: new Date('2025-10-08'),
    maxPoints: 50,
    createdTime: new Date('2025-09-12'),
    updatedTime: new Date('2025-09-18'),
  },
  {
    id: 'a4',
    title: 'Lectura Comentada',
    description: 'Análisis de “El Quijote”',
    courseId: 'c-lit-1',
    dueDate: new Date('2025-10-01'),
    maxPoints: 20,
    createdTime: new Date('2025-09-07'),
    updatedTime: new Date('2025-09-17'),
  },
  {
    id: 'a5',
    title: 'Trigonometría I',
    description: 'Identidades trigonométricas básicas',
    courseId: 'c-math-1',
    dueDate: new Date('2025-10-12'),
    maxPoints: 100,
    createdTime: new Date('2025-09-16'),
    updatedTime: new Date('2025-09-22'),
  },
  {
    id: 'a6',
    title: 'Laboratorio: Reacciones',
    description: 'Ácido-base, seguridad en laboratorio',
    courseId: 'c-sci-1',
    dueDate: new Date('2025-10-10'),
    maxPoints: 80,
    createdTime: new Date('2025-09-14'),
    updatedTime: new Date('2025-09-21'),
  },
  {
    id: 'a7',
    title: 'Exposición Literaria',
    description: 'Poesía del siglo XX',
    courseId: 'c-lit-1',
    dueDate: new Date('2025-10-06'),
    maxPoints: 40,
    createdTime: new Date('2025-09-11'),
    updatedTime: new Date('2025-09-19'),
  },
  {
    id: 'a8',
    title: 'Cálculo Diferencial',
    description: 'Límites y derivadas',
    courseId: 'c-math-2',
    dueDate: new Date('2025-10-04'),
    maxPoints: 100,
    createdTime: new Date('2025-09-09'),
    updatedTime: new Date('2025-09-23'),
  },
];

const sh = (state: Submission['state'], dt: string) => ({
  stateHistory: { state, timestamp: new Date(dt) },
});

export const submissions: Submission[] = [
  { id: 'sub-a1-s1', assignmentId: 'a1', studentId: 's1', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-12'), sh('TURNED_IN','2025-09-30')], assignedGrade: 92 },
  { id: 'sub-a1-s2', assignmentId: 'a1', studentId: 's2', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-12'), sh('TURNED_IN','2025-10-06')], assignedGrade: 78 },
  { id: 'sub-a1-s3', assignmentId: 'a1', studentId: 's3', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-13')] },
  { id: 'sub-a1-s4', assignmentId: 'a1', studentId: 's4', state: 'RECLAIMED_BY_STUDENT', late: true, submissionHistory: [sh('CREATED','2025-09-12'), sh('TURNED_IN','2025-10-07'), sh('RECLAIMED_BY_STUDENT','2025-10-08')] },

  { id: 'sub-a2-s1', assignmentId: 'a2', studentId: 's1', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-09-28')], assignedGrade: 95 },
  { id: 'sub-a2-s3', assignmentId: 'a2', studentId: 's3', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-10-03')] },
  { id: 'sub-a2-s4', assignmentId: 'a2', studentId: 's4', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-11')] },

  { id: 'sub-a3-s5', assignmentId: 'a3', studentId: 's5', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-13'), sh('TURNED_IN','2025-10-02')] },
  { id: 'sub-a3-s6', assignmentId: 'a3', studentId: 's6', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-13'), sh('TURNED_IN','2025-10-01')] },
  { id: 'sub-a3-s7', assignmentId: 'a3', studentId: 's7', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-14')] },
  { id: 'sub-a3-s8', assignmentId: 'a3', studentId: 's8', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-14'), sh('TURNED_IN','2025-10-10')] },

  { id: 'sub-a4-s5', assignmentId: 'a4', studentId: 's5', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-09'), sh('TURNED_IN','2025-09-28')] },
  { id: 'sub-a4-s7', assignmentId: 'a4', studentId: 's7', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-09')] },
  { id: 'sub-a4-s8', assignmentId: 'a4', studentId: 's8', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-10-02')] },

  { id: 'sub-a5-s1', assignmentId: 'a5', studentId: 's1', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-18')] },
  { id: 'sub-a5-s2', assignmentId: 'a5', studentId: 's2', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-18')] },
  { id: 'sub-a5-s4', assignmentId: 'a5', studentId: 's4', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-18')] },

  { id: 'sub-a6-s3', assignmentId: 'a6', studentId: 's3', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-16'), sh('TURNED_IN','2025-10-08')] },
  { id: 'sub-a6-s4', assignmentId: 'a6', studentId: 's4', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-16'), sh('TURNED_IN','2025-10-12')] },

  { id: 'sub-a7-s5', assignmentId: 'a7', studentId: 's5', state: 'RECLAIMED_BY_STUDENT', late: true, submissionHistory: [sh('CREATED','2025-09-12'), sh('TURNED_IN','2025-10-08'), sh('RECLAIMED_BY_STUDENT','2025-10-09')] },
  { id: 'sub-a7-s7', assignmentId: 'a7', studentId: 's7', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-12')] },

  { id: 'sub-a8-s9',  assignmentId: 'a8', studentId: 's9',  state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-09-30')] },
  { id: 'sub-a8-s10', assignmentId: 'a8', studentId: 's10', state: 'TURNED_IN', late: false, submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-10-02')] },
  { id: 'sub-a8-s11', assignmentId: 'a8', studentId: 's11', state: 'CREATED',    late: false, submissionHistory: [sh('CREATED','2025-09-10')] },
  { id: 'sub-a8-s12', assignmentId: 'a8', studentId: 's12', state: 'TURNED_IN', late: true,  submissionHistory: [sh('CREATED','2025-09-10'), sh('TURNED_IN','2025-10-06')] },
];

export const computeDashboardStats = (
  allStudents: Student[],
  allTeachers: Teacher[],
  allCourses: Course[],
  allAssignments: Assignment[],
  allSubmissions: Submission[],
): DashboardStats => {
  const onTime = allSubmissions.filter(s => s.state === 'TURNED_IN' && !s.late).length;
  const late = allSubmissions.filter(s => (s.state === 'TURNED_IN' && s.late) || (s.state === 'RECLAIMED_BY_STUDENT' && s.late)).length;
  const pending = allSubmissions.filter(s => s.state === 'CREATED').length;

  return {
    totalStudents: allStudents.length,
    totalTeachers: allTeachers.length,
    totalCourses: allCourses.length,
    totalAssignments: allAssignments.length,
    onTimeSubmissions: onTime,
    lateSubmissions: late,
    pendingSubmissions: pending,
  };
};

export const cohortStats: CohorteStats[] = [
  { cohort: '2025-A', onTimePercentage: 78.5, totalAssignments: 4, studentsCount: 4 },
  { cohort: '2025-B', onTimePercentage: 71.2, totalAssignments: 3, studentsCount: 4 },
  { cohort: '2025-C', onTimePercentage: 86.0, totalAssignments: 1, studentsCount: 4 },
];

export const dashboardStatsExample: DashboardStats = computeDashboardStats(students, teachers, courses, assignments, submissions);
