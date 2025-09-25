import React from 'react';
import { BarChart3, Users, GraduationCap, FileText, Settings, Bell, Home } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'teachers', label: 'Profesores', icon: GraduationCap },
    { id: 'assignments', label: 'Tareas', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen text-white">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-400">ClassroomPro</h1>
        <p className="text-slate-400 text-sm mt-1">Analytics Dashboard</p>
      </div>
      
      <nav className="mt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-600 border-r-4 border-blue-400'
                  : 'hover:bg-slate-800'
              }`}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;