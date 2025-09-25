import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Assignment, Submission } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AssignmentsViewProps {
  assignments: Assignment[];
  submissions: Submission[];
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments, submissions }) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const getSubmissionStats = (assignmentId: string) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
    const turned_in = assignmentSubmissions.filter(s => s.state === 'TURNED_IN').length;
    const late = assignmentSubmissions.filter(s => s.late).length;
    const pending = assignmentSubmissions.filter(s => s.state === 'CREATED').length;
    
    return { turned_in, late, pending, total: assignmentSubmissions.length };
  };

  const getStatusColor = (stats: ReturnType<typeof getSubmissionStats>) => {
    const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;
    if (onTimeRate >= 80) return 'bg-green-500';
    if (onTimeRate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter === 'all') return true;
    const stats = getSubmissionStats(assignment.id);
    const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;
    
    if (statusFilter === 'good') return onTimeRate >= 80;
    if (statusFilter === 'warning') return onTimeRate >= 60 && onTimeRate < 80;
    if (statusFilter === 'critical') return onTimeRate < 60;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todas las tareas</option>
          <option value="good">Buen rendimiento (≥80%)</option>
          <option value="warning">Rendimiento medio (60-80%)</option>
          <option value="critical">Rendimiento bajo (&lt;60%)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map(assignment => {
          const stats = getSubmissionStats(assignment.id);
          const statusColor = getStatusColor(stats);
          const onTimeRate = stats.total > 0 ? ((stats.turned_in - stats.late) / stats.total) * 100 : 0;

          return (
            <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.dueDate && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar size={14} className="mr-1" />
                        {format(assignment.dueDate, 'dd MMM yyyy', { locale: es })}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`w-3 h-3 ${statusColor} rounded-full`}></div>
              </div>

              {assignment.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tasa de entrega a tiempo</span>
                  <span className="font-semibold">{onTimeRate.toFixed(1)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentsView;