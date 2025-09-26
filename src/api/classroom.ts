import axios from 'axios';

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export async function getHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export async function listCourses(pageSize?: number) {
  const { data } = await api.get('/api/classroom/courses', { params: { pageSize } });
  return data as { courses: any[]; count: number };
}

export async function listCoursesFiltered(params: { pageSize?: number; cohort?: string; teacherId?: string }) {
  const { data } = await api.get('/api/classroom/courses', { params });
  return data as { courses: any[]; count: number };
}

export function getAuthUrl() {
  // Backend will redirect, we just navigate the browser
  return `${BASE_URL}/auth/google`;
}

export async function listStudents(courseId: string, pageSize?: number) {
  const { data } = await api.get(`/api/classroom/courses/${courseId}/students`, { params: { pageSize } });
  return data as { students: any[]; count: number };
}

export async function listTeachers(courseId: string, pageSize?: number) {
  const { data } = await api.get(`/api/classroom/courses/${courseId}/teachers`, { params: { pageSize } });
  return data as { teachers: any[]; count: number };
}

export async function listCourseWork(courseId: string, pageSize?: number) {
  const { data } = await api.get(`/api/classroom/courses/${courseId}/courseWork`, { params: { pageSize } });
  return data as { courseWork: any[]; count: number };
}

export async function listSubmissions(courseId: string, courseWorkId: string, pageSize?: number) {
  const { data } = await api.get(`/api/classroom/courses/${courseId}/courseWork/${courseWorkId}/submissions`, { params: { pageSize } });
  return data as { studentSubmissions: any[]; count: number };
}

export async function listSubmissionsFiltered(
  courseId: string,
  courseWorkId: string,
  params: { pageSize?: number; status?: 'entregado' | 'atrasado' | 'faltante' | 'reentrega' }
) {
  const { data } = await api.get(`/api/classroom/courses/${courseId}/courseWork/${courseWorkId}/submissions`, { params });
  return data as { studentSubmissions: any[]; count: number };
}

export async function getSummary(params?: { cohort?: string; teacherId?: string; status?: 'entregado' | 'atrasado' | 'faltante' | 'reentrega' }) {
  const { data } = await api.get('/api/classroom/summary', { params });
  return data as {
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
    totalAssignments: number;
    onTimeSubmissions: number;
    lateSubmissions: number;
    pendingSubmissions: number;
  };
}

export async function listAggregatedStudents(params?: { cohort?: string; teacherId?: string }) {
  const { data } = await api.get('/api/classroom/students', { params });
  return data as { students: any[]; count: number };
}

export async function listAggregatedTeachers(params?: { cohort?: string }) {
  const { data } = await api.get('/api/classroom/teachers', { params });
  return data as { teachers: any[]; count: number };
}

export async function listStudentsProgress(params?: { cohort?: string; teacherId?: string }) {
  const { data } = await api.get('/api/classroom/students/progress', { params });
  return data as { students: Array<{ id: string; name: string; email: string; cohort: string; onTimePercentage: number; totals: any }>; count: number };
}

export async function logout() {
  await api.post('/auth/logout');
  return { ok: true } as const;
}
