import React, { useMemo, useState } from 'react';
import { Bell, Mail, MessageCircle, Send, Check, Eye, EyeOff } from 'lucide-react';
import {
  getEmailStatus,
  getTelegramStatus,
  saveEmailConfig,
  saveTelegramConfig,
  testEmail,
  testTelegram,
  type ChannelStatus,
} from '../api/notifications';

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
  const [showPassword, setShowPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState<ChannelStatus | null>(null);
  const [tgStatus, setTgStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState<{ emailSave?: boolean; emailTest?: boolean; tgSave?: boolean; tgTest?: boolean }>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const validateEmailConfig = () => {
    if (!emailConfig.smtp.trim()) return 'El servidor SMTP es requerido';
    const portNum = Number(emailConfig.port);
    if (!Number.isInteger(portNum) || portNum <= 0) return 'Puerto inválido';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailConfig.user.trim())) return 'Usuario debe ser un email válido';
    return null;
  };
  const validateTelegram = () => {
    if (!telegramToken.trim()) return 'El token de Telegram es requerido';
    return null;
  };

  const statusBadge = useMemo(() => {
    return (st?: ChannelStatus | null) => (
      <span
        className={
          'ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
          (st?.enabled
            ? st.healthy
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200')
        }
        title={st?.message || ''}
      >
        {st?.enabled ? (st.healthy ? 'Conectado' : 'Configurado') : 'Deshabilitado'}
      </span>
    );
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

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
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-6 top-6 z-50 rounded-md px-4 py-2 shadow-lg border text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:text-red-300'
              : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Configuración de Notificaciones</h2>
      
      {/* Notification Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Mail className="text-blue-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Email</h3>
            {statusBadge(emailStatus)}
            <label className="ml-auto inline-flex items-center">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Habilitado</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Servidor SMTP
                </label>
                <input
                  type="text"
                  value={emailConfig.smtp}
                  onChange={(e) => setEmailConfig({...emailConfig, smtp: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Puerto
                </label>
                <input
                  type="text"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({...emailConfig, port: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Usuario
                </label>
                <input
                  type="email"
                  value={emailConfig.user}
                  onChange={(e) => setEmailConfig({...emailConfig, user: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                    className="w-full pr-10 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  const err = validateEmailConfig();
                  if (err) return showToast('error', err);
                  setLoading((s) => ({ ...s, emailSave: true }));
                  try {
                    await saveEmailConfig({
                      smtp: emailConfig.smtp.trim(),
                      port: Number(emailConfig.port),
                      user: emailConfig.user.trim(),
                      password: emailConfig.password || undefined,
                      enabled: emailEnabled,
                    });
                    const st = await getEmailStatus();
                    setEmailStatus(st);
                    showToast('success', 'Configuración de Email guardada');
                  } catch (e: any) {
                    showToast('error', 'No se pudo guardar la configuración de Email');
                  } finally {
                    setLoading((s) => ({ ...s, emailSave: false }));
                  }
                }}
                disabled={loading.emailSave}
                className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading.emailSave ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={async () => {
                  const err = validateEmailConfig();
                  if (err) return showToast('error', err);
                  setLoading((s) => ({ ...s, emailTest: true }));
                  try {
                    const res = await testEmail({});
                    showToast('success', res?.message || 'Correo de prueba enviado');
                    const st = await getEmailStatus();
                    setEmailStatus(st);
                  } catch {
                    showToast('error', 'Error al enviar correo de prueba');
                  } finally {
                    setLoading((s) => ({ ...s, emailTest: false }));
                  }
                }}
                disabled={loading.emailTest}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {loading.emailTest ? 'Enviando…' : (
                  <span className="inline-flex items-center gap-2"><Send size={16} /> Enviar prueba</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Telegram Configuration */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <MessageCircle className="text-blue-500 mr-3" size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Telegram</h3>
            {statusBadge(tgStatus)}
            <label className="ml-auto inline-flex items-center">
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">Habilitado</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="Ingresa tu bot token de Telegram"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Instrucciones:</strong>
                <br />1. Crea un bot con @BotFather en Telegram
                <br />2. Copia el token aquí
                <br />3. Añade el bot a tu grupo o canal
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  const err = validateTelegram();
                  if (err) return showToast('error', err);
                  setLoading((s) => ({ ...s, tgSave: true }));
                  try {
                    await saveTelegramConfig({ token: telegramToken.trim(), enabled: telegramEnabled });
                    const st = await getTelegramStatus();
                    setTgStatus(st);
                    showToast('success', 'Configuración de Telegram guardada');
                  } catch {
                    showToast('error', 'No se pudo guardar la configuración de Telegram');
                  } finally {
                    setLoading((s) => ({ ...s, tgSave: false }));
                  }
                }}
                disabled={loading.tgSave}
                className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading.tgSave ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={async () => {
                  const err = validateTelegram();
                  if (err) return showToast('error', err);
                  setLoading((s) => ({ ...s, tgTest: true }));
                  try {
                    const res = await testTelegram({});
                    showToast('success', res?.message || 'Mensaje de prueba enviado');
                    const st = await getTelegramStatus();
                    setTgStatus(st);
                  } catch {
                    showToast('error', 'Error al enviar mensaje de prueba');
                  } finally {
                    setLoading((s) => ({ ...s, tgTest: false }));
                  }
                }}
                disabled={loading.tgTest}
                className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {loading.tgTest ? 'Enviando…' : (
                  <span className="inline-flex items-center gap-2"><Send size={16} /> Enviar prueba</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Tipos de Notificación</h3>
        <div className="space-y-3">
          {notificationTypes.map(type => (
            <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/40 rounded-lg">
              <div className="flex items-center">
                <Bell size={18} className="text-gray-500 dark:text-slate-400 mr-3" />
                <span className="font-medium text-gray-900 dark:text-slate-100">{type.label}</span>
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
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Notificaciones Recientes</h3>
        <div className="space-y-3">
          {recentNotifications.map(notification => (
            <div key={notification.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center">
                {notification.type === 'email' ? (
                  <Mail size={18} className="text-blue-500 mr-3" />
                ) : (
                  <MessageCircle size={18} className="text-blue-500 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{notification.time}</p>
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