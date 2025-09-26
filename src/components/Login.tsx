import React, { useState } from 'react';
import { LogIn, Shield, CheckCircle2, Info } from 'lucide-react';
import { getAuthUrl } from '../api/classroom';

interface LoginProps {
  title?: string;
  subtitle?: string;
  buttonVariant?: 'primary' | 'google';
}

const Login: React.FC<LoginProps> = ({
  title = 'Conecta tu cuenta de Google',
  subtitle = 'Autoriza el acceso de solo lectura a Google Classroom para cargar cursos, estudiantes, profesores y tareas.',
  buttonVariant = 'primary',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setError(null);
    setLoading(true);
    try {
      // Redirige al backend para iniciar el flujo OAuth
      window.location.href = getAuthUrl();
    } catch (e) {
      setLoading(false);
      setError('No se pudo iniciar la conexión. Intenta nuevamente.');
    }
  };

  const scopes = [
    'Cursos (read-only)',
    'Rosters (read-only)',
    'Tareas (read-only)',
    'Entregas (read-only)'
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: beneficios */}
        <section className="order-2 lg:order-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">{title}</h1>
          <p className="text-gray-600 dark:text-slate-300 mb-6 max-w-prose">{subtitle}</p>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
              <p className="text-gray-700 dark:text-slate-200"><strong>Solo lectura:</strong> no modificamos información en Classroom.</p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
              <p className="text-gray-700 dark:text-slate-200"><strong>Todo en un lugar:</strong> cursos, estudiantes, profesores y entregas.</p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
              <p className="text-gray-700 dark:text-slate-200"><strong>Insights rápidos:</strong> métricas y visualizaciones para tus clases.</p>
            </li>
          </ul>

          <div className="mt-6 text-sm text-gray-500 dark:text-slate-400 flex items-start gap-2">
            <Info size={16} className="mt-0.5 text-blue-600" />
            <p>
              Puedes desconectar tu cuenta en cualquier momento desde <span className="text-gray-700 dark:text-slate-200 font-medium">Ajustes</span>.
            </p>
          </div>
        </section>

        {/* Columna derecha: tarjeta de acción */}
        <section className="order-1 lg:order-2">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center mr-3">
                <Shield className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Acceso seguro con Google</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              Usaremos acceso <span className="font-medium text-gray-800 dark:text-slate-100">de solo lectura</span> para analizar tu Classroom.
            </p>

            <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3 mb-6">
              {scopes.map((s) => (
                <span key={s} className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 text-xs text-gray-700 dark:text-slate-200 shadow-sm">
                  {s}
                </span>
              ))}
            </div>

            {buttonVariant === 'primary' ? (
              <button
                onClick={handleConnect}
                disabled={loading}
                aria-busy={loading}
                aria-live="polite"
                className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {/* Google G icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.799,6.053,29.139,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.799,6.053,29.139,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.62-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.994,5.57 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.996,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent" />
                    Conectando…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <LogIn size={18} />
                    Conectar con Google
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                aria-busy={loading}
                aria-live="polite"
                className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {/* Google G icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.799,6.053,29.139,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.799,6.053,29.139,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.62-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.994,5.57 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.996,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 rounded-full border-2 border-gray-300 dark:border-slate-500 border-t-transparent" />
                    Conectando…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <LogIn size={18} />
                    Conectar con Google
                  </span>
                )}
              </button>
            )}

            {error && (
              <div className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}

            <div className="mt-4 text-[11px] text-gray-500">
              <p>Serás redirigido a Google para autorizar. No pedimos permisos de escritura.</p>
              <p className="mt-1">
                <a className="underline underline-offset-2 text-gray-600 hover:text-gray-800" href="#" onClick={(e) => e.preventDefault()}>Ver qué datos usamos y por qué</a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
