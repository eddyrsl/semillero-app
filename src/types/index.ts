export interface Student {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  cohort: string;
  enrolledCourses: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  courses: string[];
}

export interface Course {
  id: string;
  name: string;
  section?: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  cohort: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  dueDate?: Date;
  maxPoints?: number;
  createdTime: Date;
  updatedTime: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  state: 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT';
  late: boolean;
  submissionHistory: Array<{
    stateHistory: {
      state: string;
      timestamp: Date;
    };
  }>;
  assignedGrade?: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalAssignments: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  pendingSubmissions: number;
}

export interface CohorteStats {
  cohort: string;
  onTimePercentage: number;
  totalAssignments: number;
  studentsCount: number;
}