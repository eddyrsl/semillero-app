import { api } from './classroom';

export type ChannelStatus = {
  enabled: boolean;
  healthy: boolean;
  message?: string;
  lastTestAt?: string;
};

export async function saveEmailConfig(payload: { smtp: string; port: number; user: string; password?: string; enabled: boolean }) {
  const { data } = await api.post('/api/notifications/email/config', payload);
  return data as { ok: boolean };
}

export async function testEmail(payload: { to?: string }) {
  const { data } = await api.post('/api/notifications/email/test', payload);
  return data as { ok: boolean; message?: string };
}

export async function getEmailStatus() {
  const { data } = await api.get('/api/notifications/email/status');
  return data as ChannelStatus;
}

export async function saveTelegramConfig(payload: { token: string; enabled: boolean }) {
  const { data } = await api.post('/api/notifications/telegram/config', payload);
  return data as { ok: boolean };
}

export async function testTelegram(payload: { chatId?: string }) {
  const { data } = await api.post('/api/notifications/telegram/test', payload);
  return data as { ok: boolean; message?: string };
}

export async function getTelegramStatus() {
  const { data } = await api.get('/api/notifications/telegram/status');
  return data as ChannelStatus;
}
