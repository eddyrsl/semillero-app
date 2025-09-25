import React from 'react';
import { Users, GraduationCap, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const statCards = [
    { title: 'Estudiantes', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { title: 'Profesores', value: stats.totalTeachers, icon: GraduationCap, color: 'bg-green-500' },
    { title: 'Cursos', value: stats.totalCourses, icon: FileText, color: 'bg-purple-500' },
    { title: 'Tareas', value: stats.totalAssignments, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const submissionStats = [
    { title: 'A Tiempo', value: stats.onTimeSubmissions, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Tardías', value: stats.lateSubmissions, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Pendientes', value: stats.pendingSubmissions, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard General</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg mr-4`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submission Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Entregas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {submissionStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="flex items-center">
                  <div className={`${stat.color} p-2 rounded-lg mr-3`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
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