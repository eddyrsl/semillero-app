import React from 'react';
import { GraduationCap, Mail, BookOpen } from 'lucide-react';
import { Teacher } from '../types';

interface TeachersViewProps {
  teachers: Teacher[];
}

const TeachersView: React.FC<TeachersViewProps> = ({ teachers }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Profesores</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Profesor
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail size={16} className="mr-2" />
                {teacher.email}
              </div>
              <div className="flex items-center">
                <BookOpen size={16} className="mr-2" />
                {teacher.courses.length} cursos
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachersView;