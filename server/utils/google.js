import { google } from 'googleapis';

export const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  // Read-only access to coursework and submissions for all students
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
  // Optional: read-only access to the signed-in user's coursework (kept for completeness)
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  // Identity scopes required for oauth2.userinfo.get()
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/oauth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getClassroomClient(auth) {
  return google.classroom({ version: 'v1', auth });
}
