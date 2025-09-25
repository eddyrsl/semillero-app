import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentsView from './components/StudentsView';
import TeachersView from './components/TeachersView';
import AssignmentsView from './components/AssignmentsView';
import ReportsView from './components/ReportsView';
import NotificationsView from './components/NotificationsView';
import { Student, Teacher, Assignment, Submission, DashboardStats, CohorteStats } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Mock data - En producción esto vendría de la API de Google Classroom
  const [students] = useState<Student[]>([
    { id: '1', name: 'Ana García', email: 'ana@example.com', cohort: '2024-A', enrolledCourses: ['math', 'science'] },
    { id: '2', name: 'Carlos López', email: 'carlos@example.com', cohort: '2024-A', enrolledCourses: ['math', 'history'] },
    { id: '3', name: 'María Rodríguez', email: 'maria@example.com', cohort: '2024-B', enrolledCourses: ['science', 'art'] },
    { id: '4', name: 'Juan Pérez', email: 'juan@example.com', cohort: '2024-B', enrolledCourses: ['math', 'science', 'history'] },
    { id: '5', name: 'Laura Martínez', email: 'laura@example.com', cohort: '2024-C', enrolledCourses: ['art', 'music'] },
  ]);

  const [teachers] = useState<Teacher[]>([
    { id: '1', name: 'Prof. Roberto Silva', email: 'roberto@school.com', courses: ['math', 'algebra'] },
    { id: '2', name: 'Prof. Carmen Vega', email: 'carmen@school.com', courses: ['science', 'biology'] },
    { id: '3', name: 'Prof. Miguel Torres', email: 'miguel@school.com', courses: ['history', 'geography'] },
  ]);

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Examen de Álgebra',
      description: 'Examen sobre ecuaciones lineales y cuadráticas',
      courseId: 'math',
      dueDate: new Date('2024-02-15'),
      maxPoints: 100,
      createdTime: new Date('2024-01-15'),
      updatedTime: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Proyecto de Ciencias',
      description: 'Investigación sobre el sistema solar',
      courseId: 'science',
      dueDate: new Date('2024-02-20'),
      maxPoints: 150,
      createdTime: new Date('2024-01-10'),
      updatedTime: new Date('2024-01-10')
    },
    {
      id: '3',
      title: 'Ensayo de Historia',
      description: 'Ensayo sobre la revolución industrial',
      courseId: 'history',
      dueDate: new Date('2024-02-25'),
      maxPoints: 80,
      createdTime: new Date('2024-01-20'),
      updatedTime: new Date('2024-01-20')
    }
  ]);

  const [submissions] = useState<Submission[]>([
    { id: '1', assignmentId: '1', studentId: '1', state: 'TURNED_IN', late: false, submissionHistory: [], assignedGrade: 95 },
    { id: '2', assignmentId: '1', studentId: '2', state: 'TURNED_IN', late: true, submissionHistory: [], assignedGrade: 78 },
    { id: '3', assignmentId: '1', studentId: '3', state: 'CREATED', late: false, submissionHistory: [] },
    { id: '4', assignmentId: '2', studentId: '1', state: 'TURNED_IN', late: false, submissionHistory: [], assignedGrade: 88 },
    { id: '5', assignmentId: '2', studentId: '4', state: 'TURNED_IN', late: true, submissionHistory: [], assignedGrade: 72 },
  ]);

  const dashboardStats: DashboardStats = {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalCourses: 6,
    totalAssignments: assignments.length,
    onTimeSubmissions: submissions.filter(s => s.state === 'TURNED_IN' && !s.late).length,
    lateSubmissions: submissions.filter(s => s.late).length,
    pendingSubmissions: submissions.filter(s => s.state === 'CREATED').length
  };

  const cohorteStats: CohorteStats[] = [
    { cohort: '2024-A', onTimePercentage: 85, totalAssignments: 12, studentsCount: 2 },
    { cohort: '2024-B', onTimePercentage: 72, totalAssignments: 12, studentsCount: 2 },
    { cohort: '2024-C', onTimePercentage: 90, totalAssignments: 8, studentsCount: 1 },
  ];

  const cohorts = ['2024-A', '2024-B', '2024-C'];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard stats={dashboardStats} />;
      case 'students':
        return <StudentsView students={students} cohorts={cohorts} />;
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h2>
            <p className="text-gray-600">Panel de configuración en desarrollo</p>
          </div>
        );
      default:
        return <Dashboard stats={dashboardStats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-8">
        {renderActiveSection()}
      </main>
    </div>
  );
}

export default App;