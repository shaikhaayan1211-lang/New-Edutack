/* =========================================================================
   EDU-Track local server  (AUTO-GENERATED, do not edit by hand)
   Lets the website run on its own: the "backend" runs inside the browser and keeps
   its data in localStorage. Same logic as the Node backend, so nothing else changes.
   ========================================================================= */
(function () {
  'use strict';
  const sources = {};

  sources["config.js"] = function (module, exports, require, process) {
// Central configuration for the EDU-Track backend.
module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  // IMPORTANT: set EDUTRACK_SECRET to a long random string in production.
  SECRET: process.env.EDUTRACK_SECRET || 'edutrack-dev-secret-change-me',
  TOKEN_TTL_HOURS: 12,
  COLLEGE: {
    name: 'MPSPS College',
    short: 'MPSPS',
    session: '2026-27',
  },
  CHECKIN_CUTOFF: '09:30',   // check-ins after this time are marked "late"
  MIN_ATTENDANCE: 75,        // minimum attendance percentage required
  MAX_PHOTO_BYTES: 450 * 1024,
};

  };

  sources["seed.js"] = function (module, exports, require, process) {
// Generates realistic demo data for MPSPS College.  Run:  npm run seed
// (The server also runs this automatically if data/db.json does not exist.)
const { hashPassword } = require('./lib/auth');
const { DEPARTMENTS, STAFF_SECTIONS, DAYS, PERIODS, CURRENT_SEMESTER } = require('./lib/structure');
const { dateStr, addDays, dayName, pad } = require('./lib/util');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STUDENT_NAMES = [
  ['Aarav Sharma', 'M'], ['Ananya Verma', 'F'], ['Rohan Patil', 'M'], ['Priya Nair', 'F'], ['Kabir Singh', 'M'],
  ['Isha Kulkarni', 'F'], ['Arjun Mehta', 'M'], ['Diya Joshi', 'F'], ['Vihaan Gupta', 'M'], ['Saanvi Reddy', 'F'],
  ['Aditya Desai', 'M'], ['Meera Iyer', 'F'], ['Rahul Yadav', 'M'], ['Sneha Pawar', 'F'], ['Karan Malhotra', 'M'],
  ['Pooja Shah', 'F'], ['Nikhil Chavan', 'M'], ['Riya Bansal', 'F'], ['Siddharth Rao', 'M'], ['Tanvi Kapoor', 'F'],
  ['Yash Thakur', 'M'], ['Nisha Pillai', 'F'], ['Manav Bhatt', 'M'], ['Kavya Menon', 'F'], ['Harsh Jain', 'M'],
  ['Simran Kaur', 'F'], ['Devansh Tiwari', 'M'], ['Aisha Khan', 'F'], ['Omkar Jadhav', 'M'], ['Shreya Ghosh', 'F'],
  ['Varun Agarwal', 'M'], ['Neha Saxena', 'F'], ['Parth Solanki', 'M'], ['Ritika Dubey', 'F'], ['Aman Shukla', 'M'],
  ['Payal Mishra', 'F'], ['Tushar Naik', 'M'], ['Kritika Sinha', 'F'], ['Ishaan Bose', 'M'], ['Anjali Rane', 'F'],
];
const TEACHER_NAMES = [
  'Dr. Sunita Rao', 'Prof. Anil Deshmukh', 'Ms. Rekha Kulkarni',
  'Dr. Vikram Sethi', 'Prof. Meenal Joshi', 'Mr. Sanjay Pandey',
  'Dr. Lata Bhosale', 'Prof. Rajesh Nambiar', 'Ms. Farah Sheikh',
  'Dr. Ashok Trivedi', 'Prof. Kiran Wagh', 'Ms. Deepa Menon',
  'Dr. Naveen Prabhu', 'Prof. Shalini Ahuja', 'Mr. Girish Kamat',
];
const TEACHER_ROLES = ['Professor and Head of Department', 'Associate Professor', 'Assistant Professor'];
const TEACHER_QUALS = {
  CA: ['Ph.D. (Computer Science)', 'MCA, UGC-NET', 'M.Sc. (IT)'],
  COM: ['Ph.D. (Commerce)', 'M.Com, MBA', 'M.Com, UGC-NET'],
  BBA: ['Ph.D. (Management)', 'MBA (Finance)', 'MBA (HR), UGC-NET'],
  SCI: ['Ph.D. (Physics)', 'M.Sc. (Chemistry), SET', 'M.Sc. (Mathematics)'],
  ART: ['Ph.D. (English)', 'M.A. (History), NET', 'M.A. (Political Science)'],
};
const STAFF = [
  ['Ramesh Patkar', 'Administrative Officer'], ['Sheetal More', 'Senior Accountant'],
  ['Imran Qureshi', 'Librarian'], ['Neelam Chopra', 'Examination Clerk'], ['Dinesh Yadav', 'Lab Technician'],
];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'O-', 'B-', 'A-'];
const CITIES = ['Pune', 'Nashik', 'Thane', 'Nagpur', 'Mumbai', 'Aurangabad', 'Kolhapur', 'Satara'];
const FATHERS = ['Suresh', 'Mahesh', 'Ramesh', 'Dilip', 'Prakash', 'Anand', 'Vijay', 'Sunil', 'Ashok', 'Manoj'];

function build() {
  const rng = mulberry32(20260920);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const phone = () => `+91 9${String(Math.floor(rng() * 1e9)).padStart(9, '0')}`;
  const slug = (n) => n.toLowerCase().replace(/^(dr|prof|mr|ms)\.\s*/, '').replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.');
  const address = () => `Flat ${Math.floor(rng() * 40) + 1}, ${pick(['Shanti', 'Gokul', 'Sai', 'Laxmi', 'Ganesh'])} ${pick(['Nagar', 'Residency', 'Colony', 'Heights'])}, ${pick(CITIES)}`;

  const db = {
    meta: { createdAt: new Date().toISOString(), seededOn: dateStr() },
    departments: [], students: [], teachers: [], staff: [],
    timetable: {}, classAttendance: [], checkins: [], marks: [],
  };

  // ---------- Teachers + departments ----------
  let tIndex = 0;
  DEPARTMENTS.forEach((d, di) => {
    const dept = { ...d, currentSemester: CURRENT_SEMESTER, subjectTeachers: {} };
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const name = TEACHER_NAMES[tIndex];
      const id = `TCH${101 + tIndex}`;
      ids.push(id);
      db.teachers.push({
        id, name, password: hashPassword('teacher123'), department: d.code,
        designation: TEACHER_ROLES[i], qualification: TEACHER_QUALS[d.code][i],
        experience: `${[18, 11, 5][i]} years`, phone: phone(), email: `${slug(name)}@mpsps.example`,
        bloodGroup: pick(BLOOD), address: address(),
        emergency: { name: `${pick(FATHERS)} ${name.split(' ').pop()}`, phone: phone() },
        joined: `${2026 - [18, 11, 5][i]}-06-15`, validUpto: '2027-03-31', photo: null,
      });
      tIndex++;
    }
    const subs = [...d.subjects[CURRENT_SEMESTER], d.lab];
    // teacher 0: subjects 0,1 | teacher 1: subject 2 | teacher 2: subject 3 + lab
    dept.subjectTeachers[subs[0]] = ids[0];
    dept.subjectTeachers[subs[1]] = ids[0];
    dept.subjectTeachers[subs[2]] = ids[1];
    dept.subjectTeachers[subs[3]] = ids[2];
    dept.subjectTeachers[subs[4]] = ids[2];
    db.departments.push(dept);

    // ---------- Timetable ----------
    const tt = {};
    DAYS.forEach((day, dIdx) => {
      const order = subs.map((_, i) => subs[(i + dIdx) % subs.length]);
      const roomFor = (s) => { const i = subs.indexOf(s); return i === 4 ? `Lab ${di + 1}` : `Room ${(di + 1) * 100 + i + 1}`; };
      const slots = [];
      let classNo = 0;
      PERIODS.forEach((p) => {
        if (p.type === 'break') { slots.push({ period: 0, type: 'break', subject: 'Break', room: 'Canteen' }); return; }
        if (day === 'Saturday' && p.no > 4) return;
        if (day === 'Saturday' && p.no === 4) { slots.push({ period: p.no, type: 'other', subject: 'Activity Hour', room: 'Seminar Hall' }); return; }
        if (p.no === 6) { slots.push({ period: p.no, type: 'other', subject: 'Library and Mentoring', room: 'Library' }); return; }
        const subject = order[classNo++];
        slots.push({ period: p.no, type: 'class', subject, room: roomFor(subject) });
      });
      tt[day] = slots;
    });
    db.timetable[d.code] = tt;

    // ---------- Students ----------
    const prefix = d.course.replace('.', '').toUpperCase();
    const cohort = [];
    for (let i = 0; i < 8; i++) {
      const [name, gender] = STUDENT_NAMES[di * 8 + i];
      const num = String(i + 1).padStart(3, '0');
      const st = {
        id: `${prefix}24${num}`, name, password: hashPassword('student123'), course: d.course,
        rollNo: `${prefix}/24/${num}`, gender,
        dob: `${2004 + Math.floor(rng() * 2)}-${pad(Math.floor(rng() * 12) + 1)}-${pad(Math.floor(rng() * 27) + 1)}`,
        bloodGroup: pick(BLOOD), phone: phone(), email: `${slug(name)}@student.mpsps.example`,
        address: address(), admissionYear: 2024, validUpto: '2027-06-30', photo: null,
        guardian: { name: `${pick(FATHERS)} ${name.split(' ')[1]}`, relation: 'Father', phone: phone() },
        _p: 0.66 + rng() * 0.32, _a: 0.55 + rng() * 0.4,
      };
      cohort.push(st);
    }
    db.students.push(...cohort);
  });

  // ---------- Class attendance (last ~6 weeks) ----------
  const today = dateStr();
  for (let back = 45; back >= 1; back--) {
    const date = addDays(today, -back);
    const day = dayName(date);
    if (day === 'Sunday') continue;
    for (const dept of db.departments) {
      const subjectsToday = [...new Set(db.timetable[dept.code][day].filter((s) => s.type === 'class').map((s) => s.subject))];
      const cohort = db.students.filter((s) => s.course === dept.course);
      for (const subject of subjectsToday) {
        const records = {};
        cohort.forEach((st) => { records[st.id] = rng() < st._p ? 'P' : 'A'; });
        db.classAttendance.push({
          date, department: dept.code, subject, markedBy: dept.subjectTeachers[subject],
          markedAt: `${date}T10:00:00`, records,
        });
      }
    }
  }

  // ---------- Marks ----------
  const clamp = (x) => Math.max(0.42, Math.min(0.98, x));
  for (const st of db.students) {
    const dept = db.departments.find((d) => d.course === st.course);
    for (let sem = 1; sem <= CURRENT_SEMESTER; sem++) {
      for (const subject of dept.subjects[sem]) {
        db.marks.push({
          studentId: st.id, semester: sem, subject,
          internal: Math.round(30 * clamp(st._a + (rng() - 0.5) * 0.16)),
          external: sem < CURRENT_SEMESTER ? Math.round(70 * clamp(st._a + (rng() - 0.5) * 0.16)) : null,
        });
      }
    }
  }

  // ---------- Staff ----------
  STAFF.forEach(([name, designation], i) => {
    db.staff.push({
      id: `STF${101 + i}`, name, password: hashPassword('staff123'), section: STAFF_SECTIONS[i], designation,
      phone: phone(), email: `${slug(name)}@mpsps.example`, bloodGroup: pick(BLOOD), address: address(),
      emergency: { name: `${pick(FATHERS)} ${name.split(' ')[1]}`, phone: phone() },
      joined: `${2026 - [14, 9, 12, 6, 4][i]}-04-01`, validUpto: '2027-03-31', photo: null,
    });
  });

  // ---------- Self check-ins (last 30 days) ----------
  const people = [
    ...db.students.map((u) => ['student', u.id, 0.78 + rng() * 0.2]),
    ...db.teachers.map((u) => ['teacher', u.id, 0.93 + rng() * 0.06]),
    ...db.staff.map((u) => ['staff', u.id, 0.93 + rng() * 0.06]),
  ];
  for (const [role, userId, p] of people) {
    for (let back = 30; back >= 1; back--) {
      const date = addDays(today, -back);
      if (dayName(date) === 'Sunday' || rng() > p) continue;
      const mins = 8 * 60 + 35 + Math.floor(rng() * 70);
      const time = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      db.checkins.push({ role, userId, date, time, late: time > '09:30', selfie: false });
    }
  }

  db.students.forEach((s) => { delete s._p; delete s._a; });

  return db;
}

// Node only: write the generated data to data/db.json
function run() {
  const fs = require('fs');
  const path = require('path');
  const db = build();
  const file = path.join(__dirname, 'data', 'db.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(db));
  console.log(`Seeded ${db.students.length} students, ${db.teachers.length} teachers, ${db.staff.length} staff -> ${file}`);
}

module.exports = { build, run };
if (require.main === module) run();

  };

  sources["lib/structure.js"] = function (module, exports, require, process) {
// Academic structure of MPSPS College: departments, courses, subjects, periods.
// Each department offers one course. Students of a course share the same timetable.

const CURRENT_SEMESTER = 3;

const DEPARTMENTS = [
  {
    code: 'CA', name: 'Computer Applications', course: 'BCA', courseName: 'Bachelor of Computer Applications',
    lab: 'DBMS and Web Lab',
    subjects: {
      1: ['Programming in C', 'Digital Electronics', 'Mathematics I', 'Communication Skills'],
      2: ['Data Structures', 'Computer Organization', 'Discrete Mathematics', 'Environmental Studies'],
      3: ['Database Management Systems', 'Object Oriented Programming', 'Operating Systems', 'Web Technologies'],
    },
  },
  {
    code: 'COM', name: 'Commerce', course: 'B.Com', courseName: 'Bachelor of Commerce',
    lab: 'Tally and Computer Lab',
    subjects: {
      1: ['Financial Accounting', 'Business Economics', 'Business Law', 'Business Communication'],
      2: ['Corporate Accounting', 'Macro Economics', 'Business Statistics', 'Environmental Studies'],
      3: ['Cost Accounting', 'Income Tax Law', 'Company Law', 'Banking and Insurance'],
    },
  },
  {
    code: 'BBA', name: 'Management', course: 'BBA', courseName: 'Bachelor of Business Administration',
    lab: 'Case Study Workshop',
    subjects: {
      1: ['Principles of Management', 'Business Accounting', 'Managerial Economics', 'Business Communication'],
      2: ['Organizational Behaviour', 'Business Mathematics', 'Marketing Management', 'Environmental Studies'],
      3: ['Financial Management', 'Human Resource Management', 'Business Research Methods', 'Operations Management'],
    },
  },
  {
    code: 'SCI', name: 'Science', course: 'B.Sc', courseName: 'Bachelor of Science',
    lab: 'Science Practical Lab',
    subjects: {
      1: ['Physics I', 'Chemistry I', 'Mathematics I', 'English Communication'],
      2: ['Physics II', 'Chemistry II', 'Mathematics II', 'Environmental Studies'],
      3: ['Thermodynamics', 'Organic Chemistry', 'Linear Algebra', 'Statistics'],
    },
  },
  {
    code: 'ART', name: 'Arts and Humanities', course: 'BA', courseName: 'Bachelor of Arts',
    lab: 'Seminar and Library Hour',
    subjects: {
      1: ['English Literature I', 'Political Science I', 'History of India I', 'Sociology I'],
      2: ['English Literature II', 'Political Science II', 'History of India II', 'Environmental Studies'],
      3: ['Indian Constitution', 'Modern World History', 'Public Administration', 'Social Research Methods'],
    },
  },
];

const STAFF_SECTIONS = [
  'Administration Office',
  'Accounts Section',
  'Library',
  'Examination Cell',
  'Computer Lab',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIODS = [
  { no: 1, start: '09:00', end: '09:50' },
  { no: 2, start: '09:50', end: '10:40' },
  { no: 3, start: '10:40', end: '11:30' },
  { no: 0, start: '11:30', end: '12:00', type: 'break', label: 'Break' },
  { no: 4, start: '12:00', end: '12:50' },
  { no: 5, start: '12:50', end: '13:40' },
  { no: 6, start: '13:40', end: '14:30' },
];

module.exports = { CURRENT_SEMESTER, DEPARTMENTS, STAFF_SECTIONS, DAYS, ALL_DAYS, PERIODS };

  };

  sources["lib/util.js"] = function (module, exports, require, process) {
const { ALL_DAYS } = require('./structure');
const { MAX_PHOTO_BYTES } = require('../config');

const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeStr = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDate = (s) => new Date(`${s}T00:00:00`);
const isValidDate = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(parseDate(s).getTime()) && dateStr(parseDate(s)) === s;
const dayName = (s) => ALL_DAYS[parseDate(s).getDay()];
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); };
const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;

function gradeFor(total) {
  if (total >= 90) return { grade: 'O', points: 10 };
  if (total >= 80) return { grade: 'A+', points: 9 };
  if (total >= 70) return { grade: 'A', points: 8 };
  if (total >= 60) return { grade: 'B+', points: 7 };
  if (total >= 50) return { grade: 'B', points: 6 };
  if (total >= 40) return { grade: 'C', points: 5 };
  return { grade: 'F', points: 0 };
}

// Accepts only small image data-URLs (what the browser camera widget produces).
function validPhoto(photo) {
  return typeof photo === 'string' &&
    photo.length <= MAX_PHOTO_BYTES * 1.4 &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo);
}

const clean = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = {
  pad, dateStr, timeStr, parseDate, isValidDate, dayName, addDays, round1, round2,
  gradeFor, validPhoto, clean,
};

  };

  sources["lib/records.js"] = function (module, exports, require, process) {
// Shared business logic: attendance statistics, academic records, profiles, check-ins.
const { MIN_ATTENDANCE, CHECKIN_CUTOFF, COLLEGE } = require('../config');
const { dateStr, timeStr, dayName, addDays, round1, round2, gradeFor } = require('./util');

const deptByCourse = (db, course) => db.departments.find((d) => d.course === course);
const deptByCode = (db, code) => db.departments.find((d) => d.code === code);
const classSubjects = (dept) => [...dept.subjects[dept.currentSemester], dept.lab];
const teacherSubjects = (dept, teacherId) =>
  classSubjects(dept).filter((s) => dept.subjectTeachers[s] === teacherId);

function publicProfile(db, role, user) {
  const { password, ...p } = user;
  if (role === 'student') {
    const dept = deptByCourse(db, user.course);
    return { ...p, courseName: dept.courseName, department: dept.name, departmentCode: dept.code,
      semester: dept.currentSemester, session: COLLEGE.session };
  }
  if (role === 'teacher') {
    const dept = deptByCode(db, user.department);
    return { ...p, departmentCode: dept.code, department: dept.name, course: dept.course,
      subjects: teacherSubjects(dept, user.id) };
  }
  return p;
}

function studentAttendance(db, student) {
  const dept = deptByCourse(db, student.course);
  const bySubject = {};
  classSubjects(dept).forEach((s) => { bySubject[s] = { subject: s, held: 0, attended: 0 }; });

  const recs = db.classAttendance
    .filter((r) => r.department === dept.code && r.records[student.id])
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  let held = 0; let attended = 0;
  for (const r of recs) {
    const present = r.records[student.id] === 'P';
    const s = bySubject[r.subject] || (bySubject[r.subject] = { subject: r.subject, held: 0, attended: 0 });
    s.held += 1; held += 1;
    if (present) { s.attended += 1; attended += 1; }
  }

  const subjects = Object.values(bySubject).map((s) => {
    const t = db.teachers.find((x) => x.id === dept.subjectTeachers[s.subject]);
    return { ...s, pct: s.held ? round1((s.attended / s.held) * 100) : null, teacher: t ? t.name : null };
  });

  const pct = held ? round1((attended / held) * 100) : null;
  const ratio = MIN_ATTENDANCE / 100;
  let canSkip = null; let needToAttend = null;
  if (held) {
    if (pct >= MIN_ATTENDANCE) canSkip = Math.max(0, Math.floor(attended / ratio - held));
    else needToAttend = Math.ceil((ratio * held - attended) / (1 - ratio));
  }

  return {
    held, attended, absent: held - attended, pct, min: MIN_ATTENDANCE, canSkip, needToAttend, subjects,
    recent: recs.slice(0, 40).map((r) => ({
      date: r.date, day: dayName(r.date), subject: r.subject, status: r.records[student.id],
    })),
  };
}

function academics(db, student, viewerTeacherId) {
  const dept = deptByCourse(db, student.course);
  const semesters = [];
  for (let s = 1; s <= dept.currentSemester; s++) {
    const subjects = dept.subjects[s].map((name) => {
      const m = db.marks.find((x) => x.studentId === student.id && x.semester === s && x.subject === name);
      const internal = m && typeof m.internal === 'number' ? m.internal : null;
      const external = m && typeof m.external === 'number' ? m.external : null;
      const total = internal !== null && external !== null ? internal + external : null;
      const g = total !== null ? gradeFor(total) : null;
      return {
        name, internal, external, total,
        grade: g ? g.grade : null, points: g ? g.points : null,
        pass: total !== null ? total >= 40 : null,
        editable: viewerTeacherId ? dept.subjectTeachers[name] === viewerTeacherId : false,
      };
    });
    const complete = subjects.every((x) => x.total !== null);
    const sum = subjects.reduce((a, x) => a + (x.total || 0), 0);
    semesters.push({
      semester: s, current: s === dept.currentSemester, subjects, complete,
      sgpa: complete ? round2(subjects.reduce((a, x) => a + x.points, 0) / subjects.length) : null,
      total: complete ? sum : null, max: subjects.length * 100,
      percentage: complete ? round1((sum / (subjects.length * 100)) * 100) : null,
    });
  }
  const done = semesters.filter((s) => s.complete);
  return {
    maxInternal: 30, maxExternal: 70, currentSemester: dept.currentSemester, semesters,
    cgpa: done.length ? round2(done.reduce((a, s) => a + s.sgpa, 0) / done.length) : null,
  };
}

function studentDetail(db, student, viewerTeacherId) {
  return {
    profile: publicProfile(db, 'student', student),
    attendance: studentAttendance(db, student),
    academics: academics(db, student, viewerTeacherId),
  };
}

function studentRows(db, students) {
  return students.map((st) => {
    const a = studentAttendance(db, st);
    const ac = academics(db, st);
    return {
      id: st.id, name: st.name, rollNo: st.rollNo, course: st.course, photo: null,
      pct: a.pct, held: a.held, attended: a.attended, cgpa: ac.cgpa,
    };
  });
}

function performCheckin(db, role, userId, selfie) {
  const today = dateStr();
  const existing = db.checkins.find((c) => c.role === role && c.userId === userId && c.date === today);
  if (existing) return { already: true, ...existing };
  const time = timeStr();
  const rec = { role, userId, date: today, time, late: time > CHECKIN_CUTOFF, selfie: !!selfie };
  db.checkins.push(rec);
  return { already: false, ...rec };
}

// Last 30 days of self check-in history for a student / teacher / staff member.
function myAttendance(db, role, userId) {
  const today = dateStr();
  const map = new Map(
    db.checkins.filter((c) => c.role === role && c.userId === userId).map((c) => [c.date, c])
  );
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = addDays(today, -i);
    const day = dayName(date);
    const c = map.get(date);
    let status;
    if (c) status = c.late ? 'late' : 'present';
    else if (day === 'Sunday') status = 'holiday';
    else if (date === today) status = 'pending';
    else status = 'absent';
    days.push({ date, day, status, time: c ? c.time : null });
  }
  const present = days.filter((d) => d.status === 'present').length;
  const late = days.filter((d) => d.status === 'late').length;
  const absent = days.filter((d) => d.status === 'absent').length;
  const working = present + late + absent;
  return {
    days,
    summary: { present, late, absent, workingDays: working, pct: working ? round1(((present + late) / working) * 100) : null },
    today: map.get(today) || null,
    cutoff: CHECKIN_CUTOFF,
  };
}

module.exports = {
  deptByCourse, deptByCode, classSubjects, teacherSubjects, publicProfile,
  studentAttendance, academics, studentDetail, studentRows, performCheckin, myAttendance,
};

  };

  sources["routes/auth.js"] = function (module, exports, require, process) {
const express = require('express');
const db = require('../lib/db');
const { COLLEGE, MIN_ATTENDANCE, CHECKIN_CUTOFF } = require('../config');
const { STAFF_SECTIONS } = require('../lib/structure');
const { verifyPassword, signToken, tooManyAttempts, recordFailure, clearFailures } = require('../lib/auth');
const { validPhoto, clean } = require('../lib/util');
const { publicProfile, performCheckin } = require('../lib/records');

const router = express.Router();
const COLLECTION = { student: 'students', teacher: 'teachers', staff: 'staff' };

// Public info used to build the "select your course / department / section" pickers.
router.get('/meta', (req, res) => {
  const d = db.get();
  res.json({
    college: COLLEGE,
    minAttendance: MIN_ATTENDANCE,
    checkinCutoff: CHECKIN_CUTOFF,
    courses: d.departments.map((x) => ({ code: x.course, name: x.courseName, department: x.name })),
    departments: d.departments.map((x) => ({ code: x.code, name: x.name, course: x.course })),
    staffSections: STAFF_SECTIONS,
  });
});

router.post('/auth/:role/login', (req, res) => {
  const { role } = req.params;
  if (!COLLECTION[role]) return res.status(404).json({ error: 'Unknown login type.' });

  const id = clean(req.body.id, 40).toUpperCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const group = clean(req.body.group, 60);
  const photo = req.body.photo;

  const groupLabel = { student: 'course', teacher: 'department', staff: 'section' }[role];
  if (!group) return res.status(400).json({ error: `Please select your ${groupLabel} first.` });
  if (!id || !password) return res.status(400).json({ error: 'Enter your ID and password.' });
  if (photo && !validPhoto(photo)) return res.status(400).json({ error: 'That photo could not be used. Please retake it.' });

  const key = `${req.ip}|${role}|${id}`;
  if (tooManyAttempts(key)) {
    return res.status(429).json({ error: 'Too many failed attempts. Please wait a few minutes and try again.' });
  }

  const d = db.get();
  const user = d[COLLECTION[role]].find((u) => u.id === id);
  if (!user || !verifyPassword(password, user.password)) {
    recordFailure(key);
    return res.status(401).json({ error: 'Incorrect ID or password.' });
  }

  // The selected course / department / section must match the account.
  const actual = { student: user.course, teacher: user.department, staff: user.section }[role];
  if (actual !== group) {
    const dept = role === 'teacher' ? d.departments.find((x) => x.code === user.department).name : actual;
    return res.status(403).json({ error: `This ID belongs to ${dept}. Select ${dept} and try again.` });
  }

  clearFailures(key);
  let checkin = null;
  if (photo) {
    user.photo = photo;                      // login photo becomes the ID-card photo
    checkin = performCheckin(d, role, user.id, true);   // ...and marks today's attendance
  }
  db.save();

  res.json({
    token: signToken({ role, id: user.id }),
    role,
    user: publicProfile(d, role, user),
    checkin,
  });
});

module.exports = router;

  };

  sources["routes/common.js"] = function (module, exports, require, process) {
const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { PERIODS, DAYS } = require('../lib/structure');
const { MIN_ATTENDANCE, CHECKIN_CUTOFF } = require('../config');
const { validPhoto, dateStr, dayName } = require('../lib/util');
const { publicProfile, performCheckin, myAttendance, deptByCourse, deptByCode } = require('../lib/records');

const router = express.Router();
const auth = requireAuth();

const COLLECTION = { student: 'students', teacher: 'teachers', staff: 'staff' };
const currentUser = (d, auth) => d[COLLECTION[auth.role]].find((u) => u.id === auth.id);

router.get('/me', auth, (req, res) => {
  const d = db.get();
  const user = currentUser(d, req.auth);
  if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' });
  const att = myAttendance(d, req.auth.role, user.id);
  res.json({
    role: req.auth.role,
    profile: publicProfile(d, req.auth.role, user),
    today: att.today,
    minAttendance: MIN_ATTENDANCE,
    checkinCutoff: CHECKIN_CUTOFF,
  });
});

// Update the ID-card photo without marking attendance.
router.post('/me/photo', auth, (req, res) => {
  if (!validPhoto(req.body.photo)) return res.status(400).json({ error: 'That photo could not be used. Please retake it.' });
  const d = db.get();
  const user = currentUser(d, req.auth);
  user.photo = req.body.photo;
  db.save();
  res.json({ ok: true, photo: user.photo });
});

// Self attendance marker for students, teachers and staff.
router.post('/attendance/checkin', auth, (req, res) => {
  const d = db.get();
  const user = currentUser(d, req.auth);
  const photo = req.body.photo;
  if (photo && !validPhoto(photo)) return res.status(400).json({ error: 'That photo could not be used. Please retake it.' });
  if (photo) user.photo = photo;
  const checkin = performCheckin(d, req.auth.role, user.id, !!photo);
  db.save();
  res.json({ checkin, photo: user.photo });
});

router.get('/attendance/my', auth, (req, res) => {
  res.json(myAttendance(db.get(), req.auth.role, req.auth.id));
});

router.get('/timetable', auth, (req, res) => {
  const d = db.get();
  let dept;
  if (req.auth.role === 'student') {
    dept = deptByCourse(d, currentUser(d, req.auth).course);
  } else if (req.auth.role === 'teacher') {
    dept = deptByCode(d, currentUser(d, req.auth).department);
  } else {
    dept = deptByCode(d, String(req.query.department || '')) || d.departments[0];
  }
  const teacherName = (id) => { const t = d.teachers.find((x) => x.id === id); return t ? { id: t.id, name: t.name } : null; };

  const days = DAYS.map((day) => ({
    day,
    slots: d.timetable[dept.code][day].map((s) => {
      const p = PERIODS.find((x) => x.no === s.period);
      const teacherId = s.type === 'class' ? dept.subjectTeachers[s.subject] : null;
      return {
        period: s.period, start: p.start, end: p.end, type: s.type, subject: s.subject, room: s.room,
        teacher: teacherId ? teacherName(teacherId) : null,
        mine: req.auth.role === 'teacher' && teacherId === req.auth.id,
      };
    }),
  }));
  res.json({
    department: { code: dept.code, name: dept.name, course: dept.course, courseName: dept.courseName },
    today: dayName(dateStr()), days,
  });
});

module.exports = router;

  };

  sources["routes/student.js"] = function (module, exports, require, process) {
const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { studentAttendance, academics } = require('../lib/records');

const router = express.Router();
router.use(requireAuth(['student']));

const me = (req) => db.get().students.find((s) => s.id === req.auth.id);

router.get('/attendance', (req, res) => res.json(studentAttendance(db.get(), me(req))));
router.get('/academics', (req, res) => res.json(academics(db.get(), me(req))));

module.exports = router;

  };

  sources["routes/teacher.js"] = function (module, exports, require, process) {
const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { PERIODS } = require('../lib/structure');
const { MIN_ATTENDANCE } = require('../config');
const { dateStr, dayName, isValidDate, addDays, round1 } = require('../lib/util');
const { deptByCode, teacherSubjects, studentRows, studentAttendance, studentDetail, academics } = require('../lib/records');

const router = express.Router();
router.use(requireAuth(['teacher']));

// Loads the signed-in teacher, their department and that department's students.
router.use((req, res, next) => {
  const d = db.get();
  const teacher = d.teachers.find((t) => t.id === req.auth.id);
  if (!teacher) return res.status(401).json({ error: 'Account not found. Please log in again.' });
  const dept = deptByCode(d, teacher.department);
  req.ctx = {
    d, teacher, dept,
    cohort: d.students.filter((s) => s.course === dept.course),
    subjects: teacherSubjects(dept, teacher.id),
  };
  next();
});

router.get('/summary', (req, res) => {
  const { d, teacher, dept, cohort, subjects } = req.ctx;
  const rows = studentRows(d, cohort);
  const withData = rows.filter((r) => r.pct !== null);
  const avg = withData.length ? round1(withData.reduce((a, r) => a + r.pct, 0) / withData.length) : null;
  const today = dateStr();
  const classesToday = (d.timetable[dept.code][dayName(today)] || [])
    .filter((s) => s.type === 'class' && dept.subjectTeachers[s.subject] === teacher.id)
    .map((s) => { const p = PERIODS.find((x) => x.no === s.period); return { period: s.period, start: p.start, end: p.end, subject: s.subject, room: s.room }; });
  res.json({
    department: { code: dept.code, name: dept.name, course: dept.course },
    students: cohort.length, avgAttendance: avg,
    belowMin: withData.filter((r) => r.pct < MIN_ATTENDANCE).length, min: MIN_ATTENDANCE,
    classesTaken: d.classAttendance.filter((r) => r.markedBy === teacher.id).length,
    classesToday, subjects,
    markedToday: d.classAttendance.filter((r) => r.markedBy === teacher.id && r.date === today).map((r) => r.subject),
  });
});

function validateSlot(req, date, subject) {
  const { subjects } = req.ctx;
  if (!isValidDate(date)) return 'Choose a valid date.';
  const today = dateStr();
  if (date > today) return 'You cannot mark attendance for a future date.';
  if (date < addDays(today, -90)) return 'Attendance can only be edited for the last 90 days.';
  if (!subjects.includes(subject)) return 'You can only mark attendance for the subjects you teach.';
  return null;
}

router.get('/sheet', (req, res) => {
  const { d, dept, cohort } = req.ctx;
  const date = String(req.query.date || '');
  const subject = String(req.query.subject || '');
  const err = validateSlot(req, date, subject);
  if (err) return res.status(400).json({ error: err });

  const existing = d.classAttendance.find((r) => r.date === date && r.department === dept.code && r.subject === subject);
  res.json({
    date, subject, day: dayName(date),
    alreadyMarked: !!existing, markedAt: existing ? existing.markedAt : null,
    scheduled: (d.timetable[dept.code][dayName(date)] || []).some((s) => s.subject === subject),
    students: cohort.map((s) => ({
      id: s.id, name: s.name, rollNo: s.rollNo,
      status: existing ? existing.records[s.id] || 'P' : 'P',
      pct: studentAttendance(d, s).pct,
    })),
  });
});

router.post('/attendance', (req, res) => {
  const { d, teacher, dept, cohort } = req.ctx;
  const { date, subject, records } = req.body || {};
  const err = validateSlot(req, date, subject);
  if (err) return res.status(400).json({ error: err });
  if (!records || typeof records !== 'object') return res.status(400).json({ error: 'No attendance was sent.' });

  const final = {};
  for (const s of cohort) {
    const v = records[s.id];
    if (v !== 'P' && v !== 'A') return res.status(400).json({ error: `Mark ${s.name} as present or absent.` });
    final[s.id] = v;
  }
  const entry = { date, department: dept.code, subject, markedBy: teacher.id, markedAt: new Date().toISOString(), records: final };
  const i = d.classAttendance.findIndex((r) => r.date === date && r.department === dept.code && r.subject === subject);
  if (i >= 0) d.classAttendance[i] = entry; else d.classAttendance.push(entry);
  db.save();
  const present = Object.values(final).filter((v) => v === 'P').length;
  res.json({ ok: true, present, absent: cohort.length - present, total: cohort.length, updated: i >= 0 });
});

router.get('/students', (req, res) => {
  const { d, cohort } = req.ctx;
  res.json({ min: MIN_ATTENDANCE, students: studentRows(d, cohort) });
});

router.get('/student/:id', (req, res) => {
  const { d, teacher, cohort } = req.ctx;
  const st = cohort.find((s) => s.id === req.params.id);
  if (!st) return res.status(404).json({ error: 'Student not found in your department.' });
  res.json(studentDetail(d, st, teacher.id));
});

// Teachers can enter/update marks for the subjects they teach.
router.put('/marks', (req, res) => {
  const { d, teacher, dept, cohort } = req.ctx;
  const { studentId, subject } = req.body || {};
  const semester = Number(req.body.semester);
  const st = cohort.find((s) => s.id === studentId);
  if (!st) return res.status(404).json({ error: 'Student not found in your department.' });
  if (!Number.isInteger(semester) || semester < 1 || semester > dept.currentSemester || !(dept.subjects[semester] || []).includes(subject)) {
    return res.status(400).json({ error: 'That subject is not part of this semester.' });
  }
  if (dept.subjectTeachers[subject] !== teacher.id) {
    return res.status(403).json({ error: 'You can only update marks for the subjects you teach.' });
  }
  const parse = (v, max, label) => {
    if (v === null || v === '' || v === undefined) return { value: null };
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > max) return { error: `${label} marks must be a whole number from 0 to ${max}.` };
    return { value: n };
  };
  const internal = parse(req.body.internal, 30, 'Internal');
  const external = parse(req.body.external, 70, 'External');
  if (internal.error || external.error) return res.status(400).json({ error: internal.error || external.error });

  const m = d.marks.find((x) => x.studentId === st.id && x.semester === semester && x.subject === subject);
  if (m) { m.internal = internal.value; m.external = external.value; }
  else d.marks.push({ studentId: st.id, semester, subject, internal: internal.value, external: external.value });
  db.save();
  res.json({ ok: true, academics: academics(d, st, teacher.id) });
});

module.exports = router;

  };

  sources["routes/staff.js"] = function (module, exports, require, process) {
const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { MIN_ATTENDANCE } = require('../config');
const { dateStr, round1 } = require('../lib/util');
const { studentRows, studentDetail, myAttendance } = require('../lib/records');

const router = express.Router();
router.use(requireAuth(['staff']));

const avg = (rows) => {
  const v = rows.filter((r) => r.pct !== null);
  return v.length ? round1(v.reduce((a, r) => a + r.pct, 0) / v.length) : null;
};

router.get('/overview', (req, res) => {
  const d = db.get();
  const today = dateStr();
  const inToday = (role) => d.checkins.filter((c) => c.role === role && c.date === today);
  const teachersIn = new Set(inToday('teacher').map((c) => c.userId));
  const all = studentRows(d, d.students);

  res.json({
    min: MIN_ATTENDANCE,
    totals: { students: d.students.length, teachers: d.teachers.length, staff: d.staff.length },
    today: { students: inToday('student').length, teachers: teachersIn.size, staff: inToday('staff').length },
    avgAttendance: avg(all),
    belowMin: all.filter((r) => r.pct !== null && r.pct < MIN_ATTENDANCE).length,
    departments: d.departments.map((dep) => {
      const rows = all.filter((r) => r.course === dep.course);
      const teachers = d.teachers.filter((t) => t.department === dep.code);
      return {
        code: dep.code, name: dep.name, course: dep.course, students: rows.length,
        avgAttendance: avg(rows), belowMin: rows.filter((r) => r.pct !== null && r.pct < MIN_ATTENDANCE).length,
        teachers: teachers.length, teachersPresent: teachers.filter((t) => teachersIn.has(t.id)).length,
      };
    }),
  });
});

router.get('/students', (req, res) => {
  const d = db.get();
  const course = String(req.query.course || '');
  const q = String(req.query.q || '').trim().toLowerCase();
  let list = d.students;
  if (course) list = list.filter((s) => s.course === course);
  if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  res.json({ min: MIN_ATTENDANCE, students: studentRows(d, list) });
});

router.get('/student/:id', (req, res) => {
  const d = db.get();
  const st = d.students.find((s) => s.id === req.params.id);
  if (!st) return res.status(404).json({ error: 'Student not found.' });
  res.json(studentDetail(d, st));
});

router.get('/teachers', (req, res) => {
  const d = db.get();
  res.json({
    teachers: d.teachers.map((t) => {
      const a = myAttendance(d, 'teacher', t.id);
      const dep = d.departments.find((x) => x.code === t.department);
      return {
        id: t.id, name: t.name, designation: t.designation, department: dep.name,
        today: a.today ? { time: a.today.time, late: a.today.late } : null,
        pct: a.summary.pct,
      };
    }),
  });
});

module.exports = router;

  };

  sources["lib/auth.js"] = function (module, exports, require, process) {
// Browser version of lib/auth.js (no Node crypto). Fine for a local demo; a real deployment should use the server version.
const { SECRET, TOKEN_TTL_HOURS } = require('../config');

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed; let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function hashPassword(pw) {
  const salt = Math.random().toString(16).slice(2, 10);
  return `${salt}:${cyrb53(salt + String(pw))}`;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  return cyrb53(salt + String(pw)) === hash;
}

function signToken(payload) {
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_HOURS * 3600 * 1000 }));
  return `${body}.${cyrb53(body + SECRET)}`;
}
function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i);
  if (cyrb53(body + SECRET) !== token.slice(i + 1)) return null;
  try {
    const payload = JSON.parse(atob(body));
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

function requireAuth(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const payload = token && verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    if (roles && !roles.includes(payload.role)) {
      return res.status(403).json({ error: 'You do not have access to this section.' });
    }
    req.auth = payload;
    next();
  };
}

const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
function tooManyAttempts(key) {
  const now = Date.now();
  const list = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  attempts.set(key, list);
  return list.length >= MAX_ATTEMPTS;
}
function recordFailure(key) { const l = attempts.get(key) || []; l.push(Date.now()); attempts.set(key, l); }
function clearFailures(key) { attempts.delete(key); }

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, requireAuth, tooManyAttempts, recordFailure, clearFailures };

  };

  sources["lib/db.js"] = function (module, exports, require, process) {
// Browser version of lib/db.js: the whole "database" lives in localStorage.
const KEY = 'edutrack_localdb_v1';
const REFRESH_AFTER_DAYS = 14;   // demo history is regenerated so "last 30 days" never looks empty
let data = null;

const daysSince = (s) => Math.floor((Date.now() - new Date(`${s}T00:00:00`).getTime()) / 86400000);

function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { saved = null; }
  if (!saved || !saved.meta || daysSince(saved.meta.seededOn) > REFRESH_AFTER_DAYS) {
    const fresh = require('../seed').build();
    if (saved) {   // keep everyone's photos when refreshing
      for (const c of ['students', 'teachers', 'staff']) {
        (saved[c] || []).forEach((old) => { const n = fresh[c].find((x) => x.id === old.id); if (n && old.photo) n.photo = old.photo; });
      }
    }
    saved = fresh;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { console.warn('EDU-Track: could not save demo data', e); }
  }
  data = saved;
  return data;
}

function get() { return data || load(); }
function flush() {
  if (!data) return;
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.warn('EDU-Track: storage is full. Try removing some photos.', e); }
}
function save() { flush(); }
function reset() { localStorage.removeItem(KEY); data = null; }

module.exports = { get, save, flush, reset };

  };

  sources["express.js"] = function (module, exports, require, process) {
// Minimal stand-in for express.Router() so the real route files run unchanged in the browser.
function Router() {
  const stack = [];
  const r = { stack };
  const add = (method) => (path, ...handlers) => { stack.push({ method, path, handlers: handlers.flat() }); return r; };
  r.get = add('GET'); r.post = add('POST'); r.put = add('PUT');
  r.use = (...handlers) => { stack.push({ method: null, path: null, handlers: handlers.flat() }); return r; };
  return r;
}
module.exports = { Router };

  };

  sources["server.js"] = function (module, exports, require, process) {
// Browser "server": takes the same requests the frontend used to send over HTTP and runs the real route code.
const db = require('./lib/db');

const mounts = [
  ['/api', require('./routes/auth')],
  ['/api', require('./routes/common')],
  ['/api/student', require('./routes/student')],
  ['/api/teacher', require('./routes/teacher')],
  ['/api/staff', require('./routes/staff')],
  ['/api', { stack: [{ method: null, path: null, handlers: [(req, res) => res.status(404).json({ error: 'That API endpoint does not exist.' })] }] }],
];

function compile(path) {
  const keys = [];
  const re = new RegExp('^' + path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  return { re, keys };
}

// Runs one router's layers in order. Calls done(false) if the router handled the request, done(true) to fall through.
function runRouter(router, req, res, rel, done) {
  let i = 0;
  const nextLayer = () => {
    if (res.sent) return;
    if (i >= router.stack.length) return done(true);
    const layer = router.stack[i++];
    let params = {};
    if (layer.method) {
      if (layer.method !== req.method) return nextLayer();
      const { re, keys } = compile(layer.path);
      const m = re.exec(rel);
      if (!m) return nextLayer();
      keys.forEach((k, idx) => { params[k] = decodeURIComponent(m[idx + 1]); });
    }
    req.params = params;
    let h = 0;
    const nextHandler = () => {
      if (res.sent) return;
      if (h >= layer.handlers.length) return nextLayer();
      const fn = layer.handlers[h++];
      try { fn(req, res, nextHandler); }
      catch (e) { console.error(e); res.status(500).json({ error: 'Something went wrong.' }); }
    };
    nextHandler();
  };
  nextLayer();
}

function handle(method, fullPath, body, authHeader) {
  return new Promise((resolve) => {
    const [pathname, qs] = fullPath.split('?');
    const req = {
      method: method.toUpperCase(), path: pathname, ip: 'browser',
      query: Object.fromEntries(new URLSearchParams(qs || '')),
      body: body ? JSON.parse(JSON.stringify(body)) : {},
      headers: { authorization: authHeader || '' }, params: {},
    };
    const res = {
      statusCode: 200, sent: false,
      status(c) { this.statusCode = c; return this; },
      json(o) {
        if (this.sent) return this;
        this.sent = true;
        resolve({ status: this.statusCode, data: JSON.parse(JSON.stringify(o)) });   // copy, like a real network response
        return this;
      },
    };
    let idx = 0;
    const nextMount = () => {
      if (res.sent) return;
      if (idx >= mounts.length) return res.status(404).json({ error: 'That API endpoint does not exist.' });
      const [prefix, router] = mounts[idx++];
      if (pathname !== prefix && !pathname.startsWith(prefix + '/')) return nextMount();
      runRouter(router, req, res, pathname.slice(prefix.length) || '/', (fell) => { if (fell) nextMount(); });
    };
    db.get();
    nextMount();
  });
}

module.exports = { handle, reset: db.reset };

  };

  const cache = {};
  function resolve(from, req) {
    if (req === 'express') return 'express.js';
    if (!req.startsWith('.')) throw new Error('Unsupported module in browser: ' + req);
    const out = [];
    from.split('/').slice(0, -1).concat(req.split('/')).forEach((p) => { if (p === '' || p === '.') return; if (p === '..') out.pop(); else out.push(p); });
    let id = out.join('/');
    if (!id.endsWith('.js')) id += '.js';
    return id;
  }
  function load(id) {
    if (cache[id]) return cache[id].exports;
    const fn = sources[id];
    if (!fn) throw new Error('Module not found: ' + id);
    const module = { exports: {} };
    cache[id] = module;
    fn(module, module.exports, (r) => load(resolve(id, r)), { env: {} });
    return module.exports;
  }
  const server = load('server.js');
  window.LocalServer = { handle: server.handle, reset: server.reset };
})();
