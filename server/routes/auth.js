import { Router } from 'express';
import { google } from 'googleapis';
import { getOAuth2Client, SCOPES } from '../utils/google.js';
import { tokenStore } from '../utils/tokenStore.js';

const router = Router();

router.get('/google', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Missing code param' });

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    tokenStore.set(tokens);

    // Optionally set credentials and test userinfo
    oauth2Client.setCredentials(tokens);
    let email = '';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const me = await oauth2.userinfo.get();
      email = me?.data?.email || '';
    } catch (e) {
      // If identity scopes are not granted, skip userinfo and continue
      console.warn('userinfo.get() failed, continuing without email:', e?.message || e);
    }

    // Redirect back to frontend with a success message
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend}?login=success&user=${encodeURIComponent(email)}`);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  tokenStore.clear();
  res.json({ ok: true });
});

export default router;
