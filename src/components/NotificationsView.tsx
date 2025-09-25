import React, { useState } from 'react';
import { Bell, Mail, MessageCircle, Settings, Send, Check } from 'lucide-react';

const NotificationsView: React.FC = () => {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [emailConfig, setEmailConfig] = useState({
    smtp: 'smtp.gmail.com',
    port: '587',
    user: '',
    password: ''
  });

  const notificationTypes = [
    { id: 'new_assignment', label: 'Nueva tarea asignada', enabled: true },
    { id: 'due_soon', label: 'Tarea próxima a vencer (24h)', enabled: true },
    { id: 'overdue', label: 'Tarea vencida', enabled: true },
    { id: 'grade_posted', label: 'Calificación publicada', enabled: false },
    { id: 'low_performance', label: 'Rendimiento bajo detectado', enabled: true },
  ];

  const recentNotifications = [
    { id: 1, type: 'email', message: 'Notificación de nueva tarea enviada a 25 estudiantes', time: '5 min ago', status: 'sent' },
    { id: 2, type: 'telegram', message: 'Alerta de tarea vencida enviada', time: '1 hour ago', status: 'sent' },
    { id: 3, type: 'email', message: 'Reporte semanal enviado a profesores', time: '2 hours ago', status: 'sent' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Configuración de Notificaciones</h2>
      
      {/* Notification Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Mail className="text-blue-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Email</h3>
            <label className="ml-auto inline-flex items-center">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">Habilitado</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={emailConfig.smtp}
                  onChange={(e) => setEmailConfig({...emailConfig, smtp: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puerto
                </label>
                <input
                  type="text"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="email"
                value={emailConfig.user}
                onChange={(e) => setEmailConfig({...emailConfig, user: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Telegram Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MessageCircle className="text-blue-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
            <label className="ml-auto inline-flex items-center">
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">Habilitado</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="Ingresa tu bot token de Telegram"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Instrucciones:</strong>
                <br />1. Crea un bot con @BotFather en Telegram
                <br />2. Copia el token aquí
                <br />3. Añade el bot a tu grupo o canal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Notificación</h3>
        <div className="space-y-3">
          {notificationTypes.map(type => (
            <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Bell size={18} className="text-gray-500 mr-3" />
                <span className="font-medium text-gray-900">{type.label}</span>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={type.enabled}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones Recientes</h3>
        <div className="space-y-3">
          {recentNotifications.map(notification => (
            <div key={notification.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                {notification.type === 'email' ? (
                  <Mail size={18} className="text-blue-500 mr-3" />
                ) : (
                  <MessageCircle size={18} className="text-blue-500 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
              </div>
              <Check size={18} className="text-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;