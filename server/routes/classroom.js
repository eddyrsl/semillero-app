import { Router } from 'express';
import { getOAuth2Client, getClassroomClient } from '../utils/google.js';
import { tokenStore } from '../utils/tokenStore.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

const router = Router();

// Helper: get authenticated Classroom client or 401
async function getAuthedClassroomOr401(res) {
  const tokens = tokenStore.get();
  if (!tokens) {
    res.status(401).json({ error: 'Not authenticated. Visit /auth/google first.' });
    return null;
  }
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return getClassroomClient(oauth2Client);
}

// Helper: list all pages with pagination unless limited by pageSize query
async function listAllPages(listFn, params = {}, limit) {
  const results = [];
  let pageToken = undefined;
  do {
    const { data } = await listFn({ ...params, pageToken });
    // Push known common containers
    if (Array.isArray(data.courses)) results.push(...data.courses);
    if (Array.isArray(data.students)) results.push(...data.students);
    if (Array.isArray(data.teachers)) results.push(...data.teachers);
    if (Array.isArray(data.courseWork)) results.push(...data.courseWork);
    if (Array.isArray(data.studentSubmissions)) results.push(...data.studentSubmissions);

    if (limit && results.length >= limit) {
      return results.slice(0, limit);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return results;
}

// Helper: derive cohort from a course object
function deriveCohort(course) {
  // Prefer section if available, otherwise try name; fallback to 'General'
  return course?.section || course?.name || 'General';
}

// Helper: map submission to a business status
// entregado, atrasado, faltante, reentrega
function mapSubmissionStatus(sub, dueMap) {
  const dueDate = dueMap.get(sub.assignmentId) || null;
  const state = sub.state; // CREATED | TURNED_IN | RETURNED | RECLAIMED_BY_STUDENT
  const late = !!sub.late;
  const now = new Date();

  // Reentrega
  if (state === 'RECLAIMED_BY_STUDENT') return 'reentrega';

  // Entregado (TURNED_IN o RETURNED), distinguir tardío via late
  if (state === 'TURNED_IN' || state === 'RETURNED') {
    return late ? 'atrasado' : 'entregado';
  }

  // Faltante si no hay entrega y ya venció
  if (state === 'CREATED') {
    if (dueDate && new Date(dueDate) < now) return 'faltante';
    return 'pendiente';
  }

  return 'desconocido';
}

router.get('/courses', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;

    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const cacheKey = { pageSize: pageSize || 100 };
    let items = cacheGet('courses:list', cacheKey);
    if (!items) {
      items = await listAllPages(classroom.courses.list.bind(classroom.courses), { pageSize: 100 }, pageSize);
      cacheSet('courses:list', cacheKey, items, 60_000);
    }

    // Optional filtering: cohort and teacherId
    const { cohort, teacherId } = req.query;
    let filtered = items;
    if (cohort) {
      filtered = filtered.filter(c => {
        const ch = deriveCohort(c);
        return String(ch).toLowerCase() === String(cohort).toLowerCase();
      });
    }
    if (teacherId) {
      // Need to fetch teachers per course and filter - this can be heavy; do it only if provided
      const results = [];
      for (const c of filtered) {
        const tCacheKey = { courseId: c.id };
        let teachers = cacheGet('courses:teachers', tCacheKey);
        if (!teachers) {
          teachers = await listAllPages(
            classroom.courses.teachers.list.bind(classroom.courses.teachers),
            { courseId: c.id, pageSize: 100 }
          );
          cacheSet('courses:teachers', tCacheKey, teachers, 60_000);
        }
        if (teachers.some(t => t.userId === teacherId || t.profile?.id === teacherId)) {
          results.push(c);
        }
      }
      filtered = results;
    }

    res.json({ courses: filtered, count: filtered.length });
  } catch (err) {
    next(err);
  }
});

// Aggregated students across courses with optional filters
router.get('/students', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;

    const { cohort, teacherId } = req.query;

    // Courses with optional filters (use cached list)
    let courses = cacheGet('courses:list', { pageSize: 100 });
    if (!courses) {
      courses = await listAllPages(classroom.courses.list.bind(classroom.courses), { pageSize: 100 });
      cacheSet('courses:list', { pageSize: 100 }, courses, 60_000);
    }
    if (cohort) {
      courses = courses.filter(c => String(deriveCohort(c)).toLowerCase() === String(cohort).toLowerCase());
    }
    if (teacherId) {
      const filteredCourses = [];
      for (const c of courses) {
        const tCacheKey = { courseId: c.id };
        let teachers = cacheGet('courses:teachers', tCacheKey);
        if (!teachers) {
          teachers = await listAllPages(
            classroom.courses.teachers.list.bind(classroom.courses.teachers),
            { courseId: c.id, pageSize: 100 }
          );
          cacheSet('courses:teachers', tCacheKey, teachers, 60_000);
        }
        if (teachers.some(t => t.userId === teacherId || t.profile?.id === teacherId)) {
          filteredCourses.push(c);
        }
      }
      courses = filteredCourses;
    }

    // Aggregate students unique by id
    const byId = new Map();
    for (const c of courses) {
      const sCacheKey = { courseId: c.id };
      let students = cacheGet('courses:students', sCacheKey);
      if (!students) {
        students = await listAllPages(
          classroom.courses.students.list.bind(classroom.courses.students),
          { courseId: c.id, pageSize: 100 }
        );
        cacheSet('courses:students', sCacheKey, students, 60_000);
      }
      for (const s of students) {
        const id = s.userId || s.profile?.id || s.profile?.name?.fullName;
        const name = s.profile?.name?.fullName || s.profile?.emailAddress || 'Estudiante';
        const email = s.profile?.emailAddress || '';
        const student = byId.get(id) || { id, name, email, cohort: deriveCohort(c), enrolledCourses: [] };
        if (!student.enrolledCourses.includes(c.id)) student.enrolledCourses.push(c.id);
        // Prefer cohort from the first course matching filter; could be improved if cohort mapping is different
        byId.set(id, student);
      }
    }

    const result = Array.from(byId.values());
    res.json({ students: result, count: result.length });
  } catch (err) {
    next(err);
  }
});

// Aggregated students progress with optional filters (cohort, teacherId)
router.get('/students/progress', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;

    const { cohort, teacherId } = req.query;

    // 1) Courses with optional filters (reuse cached list)
    let courses = cacheGet('courses:list', { pageSize: 100 });
    if (!courses) {
      courses = await listAllPages(classroom.courses.list.bind(classroom.courses), { pageSize: 100 });
      cacheSet('courses:list', { pageSize: 100 }, courses, 60_000);
    }
    if (cohort) {
      courses = courses.filter(c => String(deriveCohort(c)).toLowerCase() === String(cohort).toLowerCase());
    }
    if (teacherId) {
      const filteredCourses = [];
      for (const c of courses) {
        const tCacheKey = { courseId: c.id };
        let teachers = cacheGet('courses:teachers', tCacheKey);
        if (!teachers) {
          teachers = await listAllPages(
            classroom.courses.teachers.list.bind(classroom.courses.teachers),
            { courseId: c.id, pageSize: 100 }
          );
          cacheSet('courses:teachers', tCacheKey, teachers, 60_000);
        }
        if (teachers.some(t => t.userId === teacherId || t.profile?.id === teacherId)) {
          filteredCourses.push(c);
        }
      }
      courses = filteredCourses;
    }

    // 2) Build student directory from course rosters (cached)
    const studentsDir = new Map();
    for (const c of courses) {
      const sCacheKey = { courseId: c.id };
      let students = cacheGet('courses:students', sCacheKey);
      if (!students) {
        students = await listAllPages(
          classroom.courses.students.list.bind(classroom.courses.students),
          { courseId: c.id, pageSize: 100 }
        );
        cacheSet('courses:students', sCacheKey, students, 60_000);
      }
      for (const s of students) {
        const id = s.userId || s.profile?.id || s.profile?.name?.fullName;
        const name = s.profile?.name?.fullName || s.profile?.emailAddress || 'Estudiante';
        const email = s.profile?.emailAddress || '';
        if (!studentsDir.has(id)) {
          studentsDir.set(id, { id, name, email, cohort: deriveCohort(c) });
        }
      }
    }

    // 3) For each course, fetch coursework and submissions, aggregate per student
    const perStudent = new Map();
    for (const c of courses) {
      const cwCacheKey = { courseId: c.id };
      let courseWork = cacheGet('courses:courseWork', cwCacheKey);
      if (!courseWork) {
        courseWork = await listAllPages(
          classroom.courses.courseWork.list.bind(classroom.courses.courseWork),
          { courseId: c.id, pageSize: 100 }
        );
        cacheSet('courses:courseWork', cwCacheKey, courseWork, 60_000);
      }

      // Build dueDate map for this course
      const dueMap = new Map();
      for (const cw of courseWork) {
        let dueIso = null;
        if (cw.dueDate) {
          const { year, month, day } = cw.dueDate;
          const hours = cw.dueTime?.hours ?? 23;
          const minutes = cw.dueTime?.minutes ?? 59;
          const seconds = cw.dueTime?.seconds ?? 59;
          dueIso = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours, minutes, seconds)).toISOString();
        }
        dueMap.set(String(cw.id), dueIso);
      }

      for (const cw of courseWork) {
        const subCacheKey = { courseId: c.id, courseWorkId: cw.id };
        let subs = cacheGet('courseWork:submissions', subCacheKey);
        if (!subs) {
          subs = await listAllPages(
            classroom.courses.courseWork.studentSubmissions.list.bind(classroom.courses.courseWork.studentSubmissions),
            { courseId: c.id, courseWorkId: cw.id, pageSize: 100 }
          );
          cacheSet('courseWork:submissions', subCacheKey, subs, 60_000);
        }

        for (const s of subs) {
          const studentId = s.userId || s.studentId || s.profile?.id;
          if (!studentId) continue;
          const mapped = mapSubmissionStatus({
            assignmentId: String(cw.id),
            state: s.state,
            late: !!s.late,
          }, dueMap);

          const agg = perStudent.get(studentId) || { total: 0, entregado: 0, atrasado: 0, faltante: 0, pendiente: 0, reentrega: 0 };
          agg.total += 1;
          if (mapped === 'entregado') agg.entregado += 1;
          else if (mapped === 'atrasado') agg.atrasado += 1;
          else if (mapped === 'faltante') agg.faltante += 1;
          else if (mapped === 'pendiente') agg.pendiente += 1;
          else if (mapped === 'reentrega') agg.reentrega += 1;
          perStudent.set(studentId, agg);
        }
      }
    }

    // 4) Compose response with identity + stats + onTimePercentage
    const result = [];
    for (const [id, stats] of perStudent.entries()) {
      const identity = studentsDir.get(id) || { id, name: 'Estudiante', email: '', cohort: 'General' };
      const base = Math.max(1, stats.total);
      const onTimePercentage = ((stats.entregado - stats.atrasado) / base) * 100;
      result.push({
        id: String(id),
        name: identity.name,
        email: identity.email,
        cohort: identity.cohort,
        totals: stats,
        onTimePercentage: Number(onTimePercentage.toFixed(2)),
      });
    }

    // Include roster-only students (no submissions)
    for (const [id, identity] of studentsDir.entries()) {
      if (!perStudent.has(id)) {
        result.push({
          id: String(id),
          name: identity.name,
          email: identity.email,
          cohort: identity.cohort,
          totals: { total: 0, entregado: 0, atrasado: 0, faltante: 0, pendiente: 0, reentrega: 0 },
          onTimePercentage: 0,
        });
      }
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ students: result, count: result.length });
  } catch (err) {
    next(err);
  }
});

// Aggregated teachers across courses (unique) with optional filters (cohort)
router.get('/teachers', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;

    const { cohort } = req.query;

    // Courses (use cached list)
    let courses = cacheGet('courses:list', { pageSize: 100 });
    if (!courses) {
      courses = await listAllPages(classroom.courses.list.bind(classroom.courses), { pageSize: 100 });
      cacheSet('courses:list', { pageSize: 100 }, courses, 60_000);
    }
    if (cohort) {
      courses = courses.filter(c => String(deriveCohort(c)).toLowerCase() === String(cohort).toLowerCase());
    }

    const byId = new Map();
    for (const c of courses) {
      const tCacheKey = { courseId: c.id };
      let teachers = cacheGet('courses:teachers', tCacheKey);
      if (!teachers) {
        teachers = await listAllPages(
          classroom.courses.teachers.list.bind(classroom.courses.teachers),
          { courseId: c.id, pageSize: 100 }
        );
        cacheSet('courses:teachers', tCacheKey, teachers, 60_000);
      }
      for (const t of teachers) {
        const id = t.userId || t.profile?.id || t.profile?.name?.fullName;
        const name = t.profile?.name?.fullName || t.profile?.emailAddress || 'Profesor';
        const email = t.profile?.emailAddress || '';
        const teacher = byId.get(id) || { id, name, email, courses: [] };
        if (!teacher.courses.includes(c.id)) teacher.courses.push(c.id);
        byId.set(id, teacher);
      }
    }

    const result = Array.from(byId.values());
    res.json({ teachers: result, count: result.length });
  } catch (err) {
    next(err);
  }
});

// List students in a course
router.get('/courses/:courseId/students', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;
    const { courseId } = req.params;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const sCacheKey = { courseId, pageSize: pageSize || 100 };
    let items = cacheGet('courses:students', sCacheKey);
    if (!items) {
      items = await listAllPages(
        classroom.courses.students.list.bind(classroom.courses.students),
        { courseId, pageSize: 100 },
        pageSize
      );
      cacheSet('courses:students', sCacheKey, items, 60_000);
    }
    res.json({ students: items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// List teachers in a course
router.get('/courses/:courseId/teachers', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;
    const { courseId } = req.params;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const tCacheKey = { courseId, pageSize: pageSize || 100 };
    let items = cacheGet('courses:teachers', tCacheKey);
    if (!items) {
      items = await listAllPages(
        classroom.courses.teachers.list.bind(classroom.courses.teachers),
        { courseId, pageSize: 100 },
        pageSize
      );
      cacheSet('courses:teachers', tCacheKey, items, 60_000);
    }
    res.json({ teachers: items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// List coursework for a course
router.get('/courses/:courseId/courseWork', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;
    const { courseId } = req.params;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const cwCacheKey = { courseId, pageSize: pageSize || 100 };
    let items = cacheGet('courses:courseWork', cwCacheKey);
    if (!items) {
      items = await listAllPages(
        classroom.courses.courseWork.list.bind(classroom.courses.courseWork),
        { courseId, pageSize: 100 },
        pageSize
      );
      cacheSet('courses:courseWork', cwCacheKey, items, 60_000);
    }
    res.json({ courseWork: items, count: items.length });
  } catch (err) {
    next(err);
  }
});

// List submissions for a specific coursework in a course
router.get('/courses/:courseId/courseWork/:courseWorkId/submissions', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;
    const { courseId, courseWorkId } = req.params;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const subCacheKey = { courseId, courseWorkId, pageSize: pageSize || 100 };
    let items = cacheGet('courseWork:submissions', subCacheKey);
    if (!items) {
      items = await listAllPages(
        classroom.courses.courseWork.studentSubmissions.list.bind(classroom.courses.courseWork.studentSubmissions),
        { courseId, courseWorkId, pageSize: 100 },
        pageSize
      );
      cacheSet('courseWork:submissions', subCacheKey, items, 60_000);
    }

    // Optional filter by status derived from submission and coursework dueDate
    const { status } = req.query; // entregado | atrasado | faltante | reentrega
    if (!status) {
      return res.json({ studentSubmissions: items, count: items.length });
    }

    // Fetch coursework to build a dueDate map
    const cwRes = await classroom.courses.courseWork.get({ courseId, id: courseWorkId }).catch(() => null);
    const dueMap = new Map();
    if (cwRes?.data) {
      const cw = cwRes.data;
      // Classroom due date is split; assemble ISO if present
      let dueIso = null;
      if (cw.dueDate) {
        const { year, month, day } = cw.dueDate;
        const hours = cw.dueTime?.hours ?? 23;
        const minutes = cw.dueTime?.minutes ?? 59;
        const seconds = cw.dueTime?.seconds ?? 59;
        dueIso = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours, minutes, seconds)).toISOString();
      }
      dueMap.set(String(courseWorkId), dueIso);
    }

    const filtered = items.filter(s => mapSubmissionStatus({
      assignmentId: String(courseWorkId),
      state: s.state,
      late: !!s.late,
    }, dueMap) === String(status));

    res.json({ studentSubmissions: filtered, count: filtered.length });
  } catch (err) {
    next(err);
  }
});

// Aggregated summary for dashboard with filters: cohort, teacherId, status
router.get('/summary', async (req, res, next) => {
  try {
    const classroom = await getAuthedClassroomOr401(res);
    if (!classroom) return;

    const { cohort, teacherId, status } = req.query;

    // 1) Courses (optionally filter by cohort and teacher)
    let courses = cacheGet('courses:list', { pageSize: 100 });
    if (!courses) {
      courses = await listAllPages(classroom.courses.list.bind(classroom.courses), { pageSize: 100 });
      cacheSet('courses:list', { pageSize: 100 }, courses, 60_000);
    }
    if (cohort) {
      courses = courses.filter(c => String(deriveCohort(c)).toLowerCase() === String(cohort).toLowerCase());
    }
    if (teacherId) {
      const filteredCourses = [];
      for (const c of courses) {
        const teachers = await listAllPages(
          classroom.courses.teachers.list.bind(classroom.courses.teachers),
          { courseId: c.id, pageSize: 100 }
        );
        if (teachers.some(t => t.userId === teacherId || t.profile?.id === teacherId)) {
          filteredCourses.push(c);
        }
      }
      courses = filteredCourses;
    }

    // 2) Aggregate teachers and students (unique counts)
    const teacherIds = new Set();
    const studentIds = new Set();
    for (const c of courses) {
      const [teachers, students] = await Promise.all([
        listAllPages(classroom.courses.teachers.list.bind(classroom.courses.teachers), { courseId: c.id, pageSize: 100 }),
        listAllPages(classroom.courses.students.list.bind(classroom.courses.students), { courseId: c.id, pageSize: 100 }),
      ]);
      teachers.forEach(t => teacherIds.add(t.userId || t.profile?.id || t.profile?.name?.fullName));
      students.forEach(s => studentIds.add(s.userId || s.profile?.id || s.profile?.name?.fullName));
    }

    // 3) Coursework and submissions
    let totalAssignments = 0;
    let onTimeSubmissions = 0;
    let lateSubmissions = 0;
    let pendingSubmissions = 0;

    for (const c of courses) {
      const courseWork = await listAllPages(
        classroom.courses.courseWork.list.bind(classroom.courses.courseWork),
        { courseId: c.id, pageSize: 100 }
      );
      totalAssignments += courseWork.length;

      // Build dueDate map for this course
      const dueMap = new Map();
      for (const cw of courseWork) {
        let dueIso = null;
        if (cw.dueDate) {
          const { year, month, day } = cw.dueDate;
          const hours = cw.dueTime?.hours ?? 23;
          const minutes = cw.dueTime?.minutes ?? 59;
          const seconds = cw.dueTime?.seconds ?? 59;
          dueIso = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours, minutes, seconds)).toISOString();
        }
        dueMap.set(String(cw.id), dueIso);
      }

      // Submissions per coursework
      for (const cw of courseWork) {
        const subs = await listAllPages(
          classroom.courses.courseWork.studentSubmissions.list.bind(classroom.courses.courseWork.studentSubmissions),
          { courseId: c.id, courseWorkId: cw.id, pageSize: 100 }
        );

        for (const s of subs) {
          const mapped = mapSubmissionStatus({
            assignmentId: String(cw.id),
            state: s.state,
            late: !!s.late,
          }, dueMap);

          if (!status) {
            // accumulate general stats
            if (mapped === 'entregado') onTimeSubmissions += 1;
            else if (mapped === 'atrasado') lateSubmissions += 1;
            else if (mapped === 'faltante' || mapped === 'pendiente') pendingSubmissions += 1;
          } else if (mapped === String(status)) {
            // if filtered by status we still compute totals the same way
            if (mapped === 'entregado') onTimeSubmissions += 1;
            else if (mapped === 'atrasado') lateSubmissions += 1;
            else if (mapped === 'faltante' || mapped === 'pendiente') pendingSubmissions += 1;
          }
        }
      }
    }

    const payload = {
      totalStudents: studentIds.size,
      totalTeachers: teacherIds.size,
      totalCourses: courses.length,
      totalAssignments,
      onTimeSubmissions,
      lateSubmissions,
      pendingSubmissions,
    };

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
