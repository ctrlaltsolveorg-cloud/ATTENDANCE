import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_STUDENTS, DEFAULT_SUBJECTS, DEFAULT_BRANCH } from '../data/seedData';
import { getSupabaseClient, initSupabaseConfig } from './supabase';

const KEYS = {
  BRANCH: '@pce_attendance_branch',
  STUDENTS: '@pce_attendance_students',
  SUBJECTS: '@pce_attendance_subjects',
  ATTENDANCE: '@pce_attendance_records',
};

/**
 * Initialize storage with default Mechatronics 30 students and timetable subjects if empty
 */
export const initStorage = async () => {
  try {
    await initSupabaseConfig();

    const studentsData = await AsyncStorage.getItem(KEYS.STUDENTS);
    if (!studentsData || !studentsData.includes('S11')) {
      await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }

    const subjectsData = await AsyncStorage.getItem(KEYS.SUBJECTS);
    if (!subjectsData) {
      await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    }

    const branchData = await AsyncStorage.getItem(KEYS.BRANCH);
    if (!branchData) {
      await AsyncStorage.setItem(KEYS.BRANCH, JSON.stringify(DEFAULT_BRANCH));
    }

    const attendanceData = await AsyncStorage.getItem(KEYS.ATTENDANCE);
    if (!attendanceData) {
      await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const getBranchInfo = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BRANCH);
    return data ? JSON.parse(data) : DEFAULT_BRANCH;
  } catch (e) {
    return DEFAULT_BRANCH;
  }
};

export const getStudents = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data: remoteStudents, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_int', { ascending: true });

    if (!error && remoteStudents && remoteStudents.length > 0) {
      const mapped = remoteStudents.map((s) => ({
        id: s.id,
        rollNo: s.roll_no,
        regNo: s.reg_no,
        rollInt: s.roll_int,
        name: s.name,
        fatherName: s.father_name || '',
        motherName: s.mother_name || '',
        dob: s.dob || '',
        branch: s.branch || 'Mechatronics',
        semester: s.semester || '3rd',
      }));
      await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(mapped));
      return mapped;
    }
  } catch (e) {
    // Supabase offline fallback
  }

  try {
    const data = await AsyncStorage.getItem(KEYS.STUDENTS);
    return data ? JSON.parse(data) : DEFAULT_STUDENTS;
  } catch (e) {
    return DEFAULT_STUDENTS;
  }
};

export const saveStudents = async (students) => {
  try {
    await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students:', e);
  }

  try {
    const supabase = getSupabaseClient();
    const rows = students.map((s) => ({
      id: s.id,
      roll_no: s.rollNo,
      reg_no: s.regNo,
      roll_int: s.rollInt,
      name: s.name,
      father_name: s.fatherName,
      mother_name: s.motherName,
      dob: s.dob,
      branch: s.branch || 'Mechatronics',
      semester: s.semester || '3rd',
    }));
    await supabase.from('students').upsert(rows);
  } catch (e) {
    // Supabase sync fallback
  }
};

export const getSubjects = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data: remoteSubjects, error } = await supabase
      .from('subjects')
      .select('*');

    if (!error && remoteSubjects && remoteSubjects.length > 0) {
      const mapped = remoteSubjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        shortName: s.short_name,
        type: s.type,
        faculty: s.faculty,
        icon: s.icon,
      }));
      await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(mapped));
      return mapped;
    }
  } catch (e) {
    // Fallback
  }

  try {
    const data = await AsyncStorage.getItem(KEYS.SUBJECTS);
    return data ? JSON.parse(data) : DEFAULT_SUBJECTS;
  } catch (e) {
    return DEFAULT_SUBJECTS;
  }
};

export const saveSubjects = async (subjects) => {
  try {
    await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('Error saving subjects:', e);
  }
};

export const getAttendanceRecords = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data: remoteRecords, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && remoteRecords) {
      const mapped = remoteRecords.map((r) => {
        const presentList = typeof r.present_student_ids === 'string'
          ? JSON.parse(r.present_student_ids)
          : (r.present_student_ids || []);
        
        const isHolidayFromList = Array.isArray(presentList) && presentList.includes('__HOLIDAY__');
        const isHolidayFromTime = typeof r.time === 'string' && r.time.startsWith('HOLIDAY:');
        const isHoliday = Boolean(r.is_holiday || isHolidayFromList || isHolidayFromTime);

        let holidayReason = r.holiday_reason || '';
        if (!holidayReason && isHolidayFromTime) {
          holidayReason = r.time.replace('HOLIDAY:', '').trim();
        }

        return {
          id: r.id,
          subjectId: r.subject_id,
          date: r.date,
          time: r.time || '',
          presentStudentIds: isHoliday ? [] : presentList.filter((id) => id !== '__HOLIDAY__'),
          totalStudents: r.total_students || 30,
          isHoliday,
          holidayReason: holidayReason || 'College Holiday',
          createdAt: r.created_at,
        };
      });
      await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(mapped));
      return mapped;
    }
  } catch (e) {
    // Offline fallback
  }

  try {
    const data = await AsyncStorage.getItem(KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Save an attendance session for a subject and date
 */
export const saveAttendanceSession = async (session) => {
  let updated = [];
  let syncedCloud = false;

  try {
    const existing = await getAttendanceRecords();
    // Remove any existing records for the exact same subject & date to prevent duplicate sessions
    const filtered = existing.filter(
      (r) => !(r.subjectId === session.subjectId && r.date === session.date)
    );
    updated = [session, ...filtered];
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving attendance session locally:', e);
  }

  try {
    const supabase = getSupabaseClient();
    // Clear out any old duplicate sessions for this subject & date in Supabase Cloud DB
    await supabase
      .from('attendance_records')
      .delete()
      .eq('subject_id', session.subjectId)
      .eq('date', session.date);

    const basePayload = {
      id: session.id,
      subject_id: session.subjectId,
      date: session.date,
      time: session.isHoliday ? `HOLIDAY: ${session.holidayReason || 'College Closed'}` : (session.time || ''),
      present_student_ids: session.isHoliday ? ['__HOLIDAY__'] : (session.presentStudentIds || []),
      total_students: session.totalStudents || 30,
    };

    // Attempt upsert with extra schema columns first
    let { error } = await supabase.from('attendance_records').upsert({
      ...basePayload,
      is_holiday: session.isHoliday || false,
      holiday_reason: session.holidayReason || '',
    });

    if (error) {
      // Fallback: If remote table does not have is_holiday / holiday_reason columns yet, upsert basePayload without throwing 400 Bad Request
      const fallbackRes = await supabase.from('attendance_records').upsert(basePayload);
      if (!fallbackRes.error) {
        syncedCloud = true;
      }
    } else {
      syncedCloud = true;
    }
  } catch (e) {
    syncedCloud = false;
  }

  return { updated, syncedCloud };
};

export const deleteAttendanceSession = async (sessionId) => {
  let updated = [];
  try {
    const existing = await getAttendanceRecords();
    updated = existing.filter((r) => r.id !== sessionId);
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting session locally:', e);
  }

  try {
    const supabase = getSupabaseClient();
    await supabase.from('attendance_records').delete().eq('id', sessionId);
  } catch (e) {}

  return updated;
};

/**
 * Reset data back to default 30 Mechatronics students and 11 subjects
 */
export const resetToDefaultData = async () => {
  try {
    await AsyncStorage.setItem(KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    await AsyncStorage.setItem(KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    await AsyncStorage.setItem(KEYS.BRANCH, JSON.stringify(DEFAULT_BRANCH));
    await AsyncStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
  } catch (e) {
    console.error('Error resetting data:', e);
  }
};

/**
 * Calculate full analytics stats
 */
export const calculateStats = (students, subjects, records) => {
  // Only non-holiday records count towards attendance sessions
  const activeRecords = records.filter((r) => !r.isHoliday);
  const totalSessions = activeRecords.length;
  
  // Calculate total student attendances
  let totalPresentMarks = 0;
  let totalPossibleMarks = 0;

  // Map of studentId -> { presentCount, totalClasses }
  const studentStats = {};
  students.forEach((stu) => {
    studentStats[stu.id] = { present: 0, total: 0 };
  });

  // Map of subjectId -> { sessionsCount, totalPresentMarks, totalPossibleMarks }
  const subjectStats = {};
  subjects.forEach((sub) => {
    subjectStats[sub.id] = { sessions: 0, present: 0, totalPossible: 0 };
  });

  records.forEach((rec) => {
    // Skip holidays - they should NOT count as absent nor affect attendance percentages
    if (rec.isHoliday) return;

    const subId = rec.subjectId;
    const presentList = rec.presentStudentIds || [];
    const classSize = rec.totalStudents || students.length;

    if (subjectStats[subId]) {
      subjectStats[subId].sessions += 1;
      subjectStats[subId].present += presentList.length;
      subjectStats[subId].totalPossible += classSize;
    }

    students.forEach((stu) => {
      if (studentStats[stu.id]) {
        studentStats[stu.id].total += 1;
        if (presentList.includes(stu.id)) {
          studentStats[stu.id].present += 1;
        }
      }
    });

    totalPresentMarks += presentList.length;
    totalPossibleMarks += classSize;
  });

  const overallPercentage = totalPossibleMarks > 0 ? Math.round((totalPresentMarks / totalPossibleMarks) * 100) : 0;

  // Low attendance / Detained students: Students who have < 75% attendance in ANY subject
  const lowAttendanceStudents = students
    .map((stu) => {
      const detainedSubjects = [];
      let totalAttendedAll = 0;
      let totalHeldAll = 0;

      subjects.forEach((sub) => {
        const subRecords = activeRecords.filter((r) => r.subjectId === sub.id);
        const totalHeld = subRecords.length;
        if (totalHeld > 0) {
          const attended = subRecords.filter((r) => (r.presentStudentIds || []).includes(stu.id)).length;
          const pct = Math.round((attended / totalHeld) * 100);
          totalAttendedAll += attended;
          totalHeldAll += totalHeld;
          if (pct < 75) {
            detainedSubjects.push({
              subjectId: sub.id,
              name: sub.name,
              shortName: sub.shortName,
              percentage: pct,
              attended,
              totalHeld,
            });
          }
        }
      });

      return {
        ...stu,
        detainedSubjects,
        detainedCount: detainedSubjects.length,
        present: totalAttendedAll,
        total: totalHeldAll,
      };
    })
    .filter((stu) => stu.detainedCount > 0);

  // Top 5 Highest Attendance Students
  const topStudents = students
    .map((stu) => {
      const stats = studentStats[stu.id] || { present: 0, total: 0 };
      const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      return {
        ...stu,
        present: stats.present,
        total: stats.total,
        percentage: pct,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || a.rollInt - b.rollInt)
    .slice(0, 5);

  return {
    totalSessions,
    totalStudents: students.length,
    overallPercentage,
    studentStats,
    subjectStats,
    lowAttendanceStudents,
    topStudents,
  };
};

export const generateCSVReport = (students, subjects, records) => {
  // Headers: Roll No, Name, [Subject-wise Attended/Total (%) columns]
  const headers = [
    'Roll No',
    'Name',
    ...subjects.map((s) => `${s.shortName} (%)`),
  ];

  const rows = students.map((stu) => {
    const subjectCells = subjects.map((sub) => {
      const subRecords = records.filter((r) => r.subjectId === sub.id && !r.isHoliday);
      const totalSub = subRecords.length;
      if (totalSub === 0) return '"0/0 (N/A)"';
      const attended = subRecords.filter((r) =>
        (r.presentStudentIds || []).includes(stu.id)
      ).length;
      const pct = Math.round((attended / totalSub) * 100);
      return `"${attended}/${totalSub} (${pct}%)"`;
    });

    return [
      `"${stu.rollNo}"`,
      `"${stu.name}"`,
      ...subjectCells,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Generate Printable College Attendance Register HTML format for PDF Print
 * Supports Subject-Wise filter & Fixed 1-to-31 Days Monthly Calendar Grid for individual teachers.
 */
export const generatePrintableHTMLRegister = (students, subjects, records, branchInfo, selectedSubjectId = 'ALL') => {
  // Filter records by subject if selected
  const filteredRecords = selectedSubjectId === 'ALL'
    ? records
    : records.filter((r) => r.subjectId === selectedSubjectId);

  const selectedSubject = selectedSubjectId === 'ALL'
    ? null
    : subjects.find((s) => s.id === selectedSubjectId);

  // Group records by Month (YYYY-MM)
  const monthGroups = {};
  const sortedRecords = [...filteredRecords].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedRecords.forEach((rec) => {
    if (!rec.date) return;
    const parts = rec.date.split('-');
    if (parts.length < 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-12
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const dObj = new Date(year, month - 1, 1);
    const monthLabel = dObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        year,
        month, // 1-indexed
        label: monthLabel,
        records: [],
      };
    }
    monthGroups[monthKey].records.push(rec);
  });

  const monthKeys = Object.keys(monthGroups);

  // Fallback if no records exist yet
  if (monthKeys.length === 0) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    monthGroups[monthKey] = {
      year,
      month,
      label: monthLabel,
      records: [],
    };
    monthKeys.push(monthKey);
  }

  // Generate HTML for each month page with fixed 1-to-31 day columns
  const pagesHTML = monthKeys.map((mKey, pageIdx) => {
    const monthObj = monthGroups[mKey];
    const { year, month, records: monthRecords } = monthObj;

    // Number of days in this month (28, 29, 30, or 31)
    const daysInMonth = new Date(year, month, 0).getDate();

    // Day Header Columns (1, 2, 3, ... daysInMonth)
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const hasClass = monthRecords.some((r) => r.date === dateStr);
      return `<th style="width:20px;text-align:center;${hasClass ? 'background-color:#E0E7FF;color:#3730A3;font-weight:bold;' : ''}">${dayNum}</th>`;
    }).join('');

    // Pre-calculate session totals for percentage calculation
    const totalMonthSessions = monthRecords.length;

    // Generate student rows
    const rowsHTML = students.map((stu, index) => {
      let presentCount = 0;
      let absentCount = 0;

      // Day Cells (1 to daysInMonth)
      const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayRecs = monthRecords.filter((r) => r.date === dateStr);

        if (dayRecs.length === 0) {
          // No class held on this date
          return `<td style="text-align:center;color:#CBD5E1;font-size:9px;">-</td>`;
        }

        // Check if any record on this date was marked as Holiday
        const isHoliday = dayRecs.some((r) => r.isHoliday);
        if (isHoliday) {
          return `<td style="color:#8B5CF6;font-weight:bold;text-align:center;background-color:rgba(139,92,246,0.12);" title="Holiday">H</td>`;
        }

        // Check if student was present in class(es) on this date
        const isPresent = dayRecs.some((r) => (r.presentStudentIds || []).includes(stu.id));

        if (isPresent) {
          presentCount++;
          return `<td style="color:#10B981;font-weight:bold;text-align:center;background-color:rgba(16,185,129,0.08);">P</td>`;
        } else {
          absentCount++;
          return `<td style="color:#EF4444;font-weight:bold;text-align:center;background-color:rgba(239,68,68,0.08);">A</td>`;
        }
      }).join('');

      const totalHeld = presentCount + absentCount;
      const monthPct = totalHeld > 0 ? Math.round((presentCount / totalHeld) * 100) : 0;
      const pctColor = monthPct >= 75 ? '#10B981' : monthPct >= 60 ? '#F59E0B' : '#EF4444';

      return `
        <tr>
          <td style="text-align:center;font-size:10px;">${index + 1}</td>
          <td style="font-weight:bold;text-align:center;font-size:10px;">${stu.rollNo}</td>
          <td style="font-weight:600;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;">${stu.name}</td>
          ${dayCells}
          <td style="font-weight:bold;color:#10B981;text-align:center;font-size:10px;">${presentCount}</td>
          <td style="font-weight:bold;color:#EF4444;text-align:center;font-size:10px;">${absentCount}</td>
          <td style="font-weight:bold;color:${pctColor};text-align:center;font-size:10px;">${totalHeld > 0 ? `${monthPct}%` : 'N/A'}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="page ${pageIdx < monthKeys.length - 1 ? 'page-break' : ''}">
        <div class="header">
          <h1>PURNEA COLLEGE OF ENGINEERING, PURNEA</h1>
          <h2>DEPARTMENT OF MECHATRONICS ENGINEERING (M.T.E)</h2>
          <p>B.Tech 3rd Semester (2025-2029) &bull; Room No: 202 &bull; Capacity: ${students.length} Registered Seats</p>

          <div class="subject-box">
            <span class="sub-name">
              SUBJECT: ${selectedSubject ? `${selectedSubject.name} (${selectedSubject.shortName})` : 'ALL SUBJECTS COMBINED'}
            </span>
            ${selectedSubject?.faculty ? `<span class="sub-faculty">&bull; FACULTY: ${selectedSubject.faculty}</span>` : ''}
          </div>

          <div class="month-title">OFFICIAL CLASS ATTENDANCE REGISTER &ndash; ${monthObj.label.toUpperCase()} (${daysInMonth} DAYS)</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:25px;">S.No</th>
              <th style="width:65px;">Roll No</th>
              <th style="width:130px;">Student Name</th>
              ${dayHeaders}
              <th style="width:35px;">Tot P</th>
              <th style="width:35px;">Tot A</th>
              <th style="width:45px;">Month %</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <p>_______________________</p>
            <p>${selectedSubject?.faculty ? `Subject Faculty (${selectedSubject.shortName})` : 'Course Faculty'}</p>
          </div>
          <div>
            <p>_______________________</p>
            <p>H.O.D (M.T.E Department)</p>
          </div>
          <div>
            <p>_______________________</p>
            <p>Principal, P.C.E. Purnea</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Attendance Register ${selectedSubject ? `- ${selectedSubject.shortName}` : ''}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #1E293B;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        .page {
          padding: 10px;
          box-sizing: border-box;
        }
        .page-break {
          page-break-after: always;
          break-after: page;
        }
        .header {
          text-align: center;
          margin-bottom: 12px;
          border-bottom: 3px double #0F172A;
          padding-bottom: 8px;
        }
        .header h1 {
          margin: 0;
          font-size: 18px;
          color: #0F172A;
          letter-spacing: 0.5px;
        }
        .header h2 {
          margin: 3px 0;
          font-size: 13px;
          color: #334155;
        }
        .header p {
          margin: 2px 0;
          font-size: 10px;
          color: #64748B;
        }
        .subject-box {
          background: #EEF2FF;
          border: 1px solid #C7D2FE;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
          color: #3730A3;
          margin-top: 6px;
          display: inline-block;
        }
        .month-title {
          background: #0F172A;
          color: #FFFFFF;
          padding: 5px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.5px;
          margin-top: 6px;
          display: inline-block;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          table-layout: fixed;
        }
        th, td {
          border: 1px solid #94A3B8;
          padding: 4px 2px;
        }
        th {
          background-color: #F1F5F9;
          color: #0F172A;
          font-size: 9px;
          text-transform: uppercase;
        }
        tr:nth-child(even) {
          background-color: #F8FAFC;
        }
        .signatures {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
};
