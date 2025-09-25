import { Router } from 'express';
import { getOAuth2Client, getClassroomClient } from '../utils/google.js';
import { tokenStore } from '../utils/tokenStore.js';

const router = Router();

router.get('/courses', async (req, res, next) => {
  try {
    const tokens = tokenStore.get();
    if (!tokens) return res.status(401).json({ error: 'Not authenticated. Visit /auth/google first.' });

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    const classroom = getClassroomClient(oauth2Client);
    const { data } = await classroom.courses.list({ pageSize: 50 });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
