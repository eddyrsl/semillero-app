import express from 'express';

// In-memory store for demo purposes. Replace with a DB/secret manager in production.
const memory = {
  email: {
    enabled: false,
    smtp: '',
    port: 587,
    user: '',
    // never expose password back to clients
    hasPassword: false,
    healthy: false,
    message: 'No configurado',
    lastTestAt: null,
  },
  telegram: {
    enabled: false,
    tokenSet: false,
    healthy: false,
    message: 'No configurado',
    lastTestAt: null,
  },
};

const router = express.Router();

// Email endpoints
router.post('/email/config', (req, res) => {
  const { smtp, port, user, password, enabled } = req.body || {};
  if (!smtp || !port || !user || typeof enabled !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'Parámetros inválidos' });
  }
  memory.email.smtp = String(smtp);
  memory.email.port = Number(port);
  memory.email.user = String(user);
  if (password) memory.email.hasPassword = true; // store flag only
  memory.email.enabled = enabled;
  // naive health: enabled + has required fields
  memory.email.healthy = Boolean(enabled && smtp && port && user);
  memory.email.message = memory.email.healthy ? 'Configurado' : 'No configurado';
  return res.json({ ok: true });
});

router.get('/email/status', (_req, res) => {
  const st = memory.email;
  res.json({
    enabled: st.enabled,
    healthy: st.healthy,
    message: st.message,
    lastTestAt: st.lastTestAt,
    // never return secrets
  });
});

router.post('/email/test', (req, res) => {
  // In a real impl, send an email using SMTP config. Here we simulate success.
  if (!memory.email.enabled) {
    return res.status(400).json({ ok: false, message: 'Email deshabilitado' });
  }
  if (!memory.email.smtp || !memory.email.user) {
    return res.status(400).json({ ok: false, message: 'Configura SMTP y usuario primero' });
  }
  memory.email.lastTestAt = new Date().toISOString();
  memory.email.healthy = true;
  memory.email.message = 'Conectado';
  return res.json({ ok: true, message: 'Correo de prueba simulado enviado' });
});

// Telegram endpoints
router.post('/telegram/config', (req, res) => {
  const { token, enabled } = req.body || {};
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'Parámetros inválidos' });
  }
  memory.telegram.tokenSet = Boolean(token);
  memory.telegram.enabled = enabled;
  memory.telegram.healthy = Boolean(enabled && token);
  memory.telegram.message = memory.telegram.healthy ? 'Configurado' : 'No configurado';
  return res.json({ ok: true });
});

router.get('/telegram/status', (_req, res) => {
  const st = memory.telegram;
  res.json({
    enabled: st.enabled,
    healthy: st.healthy,
    message: st.message,
    lastTestAt: st.lastTestAt,
  });
});

router.post('/telegram/test', (_req, res) => {
  if (!memory.telegram.enabled) {
    return res.status(400).json({ ok: false, message: 'Telegram deshabilitado' });
  }
  if (!memory.telegram.tokenSet) {
    return res.status(400).json({ ok: false, message: 'Configura el token primero' });
  }
  memory.telegram.lastTestAt = new Date().toISOString();
  memory.telegram.healthy = true;
  memory.telegram.message = 'Conectado';
  return res.json({ ok: true, message: 'Mensaje de prueba simulado enviado' });
});

export default router;
