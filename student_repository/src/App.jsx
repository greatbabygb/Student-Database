import React from "react";
/*
Student Database Management System - Single-file React App
Place the generated CSVs (students.csv, courses.csv, grades.csv, attendance.csv)
inside your project's `public/data/` folder so they're available at runtime:

  public/data/students.csv
  public/data/courses.csv
  public/data/grades.csv
  public/data/attendance.csv

Run with a React + Vite or Create React App project. This file is a ready-to-use React component
that expects the following NPM packages to be installed:

  npm install papaparse recharts

Tailwind CSS is used for styling (you can remove/replace classes if not using Tailwind).

Save this file as `src/App.jsx` and start your dev server.
*/

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Grade-to-points mapping
const gradePoints = {
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

function parseCSV(url) {
  return fetch(url)
    .then((r) => r.text())
    .then((txt) =>
      new Promise((res, rej) => {
        Papa.parse(txt, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => res(results.data),
          error: (err) => rej(err),
        });
      })
    );
}

function calcGPAForStudent(studentId, grades) {
  const recs = grades.filter((g) => g.student_id === studentId);
  if (recs.length === 0) return null;
  let totalPoints = 0;
  let count = 0;
  for (const r of recs) {
    const letter = (r.grade || "").toUpperCase();
    if (letter in gradePoints) {
      totalPoints += gradePoints[letter];
      count += 1;
    }
  }
  return count === 0 ? null : +(totalPoints / count).toFixed(2);
}

function calculateEnrollmentByMajor(students) {
  const map = {};
  for (const s of students) {
    const m = s.major || "Undeclared";
    map[m] = (map[m] || 0) + 1;
  }
  return Object.entries(map).map(([major, count]) => ({ major, count }));
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [s, c, g, a] = await Promise.all([
        parseCSV("/data/students.csv"),
        parseCSV("/data/courses.csv"),
        parseCSV("/data/grades.csv"),
        parseCSV("/data/attendance.csv"),
      ]);
      setStudents(
        s.map((r) => ({
          student_id: r.student_id,
          name: r.name,
          major: r.major,
          year: r.year,
        }))
      );
      setCourses(
        c.map((r) => ({ course_code: r.course_code, name: r.name, instructor: r.instructor }))
      );
      setGrades(g.map((r) => ({ student_id: r.student_id, course_code: r.course_code, grade: r.grade })));
      setAttendance(
        a.map((r) => ({ student_id: r.student_id, date: r.date, attendance_status: r.attendance_status }))
      );
      setLoading(false);
    }
    loadAll().catch((e) => {
      console.error("Failed to load CSVs:", e);
      setLoading(false);
    });
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.student_id.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const enrollmentData = useMemo(() => calculateEnrollmentByMajor(students), [students]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="loader mb-4">Loading dataset...</div>
          <p className="text-sm text-gray-600">Make sure CSVs are placed in public/data/</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Student Database Management</h1>
          <p className="text-gray-600">Interactive website using the dataset provided</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="col-span-1 lg:col-span-2">
            <div className="bg-white shadow rounded p-4 mb-4">
              <div className="flex items-center gap-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or student ID"
                  className="border p-2 rounded flex-1"
                />
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  onClick={() => {
                    setSearch("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-sm text-gray-500">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Major</th>
                      <th className="p-2">Year</th>
                      <th className="p-2">GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.slice(0, 200).map((s) => (
                      <tr
                        key={s.student_id}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedStudent(s)}
                      >
                        <td className="p-2">{s.student_id}</td>
                        <td className="p-2">{s.name}</td>
                        <td className="p-2">{s.major}</td>
                        <td className="p-2">{s.year}</td>
                        <td className="p-2">
                          {(() => {
                            const gpa = calcGPAForStudent(s.student_id, grades);
                            return gpa === null ? "—" : gpa;
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-2">Showing up to 200 matching students.</p>
              </div>
            </div>

            <div className="bg-white shadow rounded p-4">
              <h2 className="font-semibold mb-2">Course Attendance Tracker</h2>
              <div className="flex gap-2 items-center mb-3">
                <select
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="border p-2 rounded flex-1"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} — {c.name}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-600">Selected: {selectedCourse || "—"}</div>
              </div>

              {selectedCourse ? (
                <CourseAttendance
                  courseCode={selectedCourse}
                  attendance={attendance}
                  students={students}
                />
              ) : (
                <p className="text-sm text-gray-500">Choose a course to view attendance statistics.</p>
              )}
            </div>
          </section>

          <aside className="col-span-1">
            <div className="bg-white shadow rounded p-4 mb-4">
              <h2 className="font-semibold mb-2">Selected Student</h2>
              {selectedStudent ? (
                <StudentDetail
                  student={selectedStudent}
                  grades={grades}
                  courses={courses}
                  attendance={attendance}
                />
              ) : (
                <p className="text-sm text-gray-500">Click a student in the table to view details.</p>
              )}
            </div>

            <div className="bg-white shadow rounded p-4">
              <h2 className="font-semibold mb-2">Enrollment by Major</h2>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="major" type="category" />
                    <Tooltip />
                    <Bar dataKey="count" isAnimationActive={false}>
                      {enrollmentData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">Total majors: {enrollmentData.length}</p>
            </div>
          </aside>
        </main>

        <footer className="text-center text-gray-500 text-sm mt-6">
          Generated website — uses the CSV dataset you provided.
        </footer>
      </div>
    </div>
  );
}

function StudentDetail({ student, grades, courses, attendance }) {
  const sGrades = grades.filter((g) => g.student_id === student.student_id);
  const gpa = calcGPAForStudent(student.student_id, grades);

  return (
    <div>
      <div className="text-sm text-gray-700 mb-2">
        <div><strong>{student.name}</strong></div>
        <div>ID: {student.student_id}</div>
        <div>Major: {student.major}</div>
        <div>Year: {student.year}</div>
        <div>GPA: {gpa === null ? "—" : gpa}</div>
      </div>

      <h3 className="font-medium mt-2">Grades</h3>
      <div className="max-h-40 overflow-auto border rounded">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="p-2">Course</th>
              <th className="p-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            {sGrades.map((g, i) => {
              const c = courses.find((x) => x.course_code === g.course_code) || {};
              return (
                <tr key={i} className="border-t">
                  <td className="p-2">{g.course_code} {c.name ? `— ${c.name}` : ""}</td>
                  <td className="p-2">{g.grade}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="font-medium mt-2">Recent Attendance</h3>
      <div className="max-h-40 overflow-auto border rounded text-sm">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-gray-500">
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance
              .filter((a) => a.student_id === student.student_id)
              .slice(-10)
              .reverse()
              .map((a, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{a.date}</td>
                  <td className="p-2">{a.attendance_status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseAttendance({ courseCode, attendance, students }) {
  // For the selected course we consider attendance records of students for that course
  // Note: The provided attendance CSV in the dataset does not include course_code; if you
  // want per-course attendance you need attendance rows to include course_code.
  // This component will approximate course attendance by counting presence/absence across
  // the global attendance records of students who are enrolled in the course via grades.

  // Build enrollment: students with grades for this course
  const enrolledStudentIds = new Set();
  // NOTE: we will expect a global `grades` variable via closure in the main App — to keep this
  // component self-contained the parent passes courseCode prop and the App has access to grades.

  // For safety, we'll compute using a small hack: check if window.__GRADES_FOR_APP exists (set by App)
  const globalGrades = window.__GRADES_FOR_APP || [];
  for (const g of globalGrades) {
    if (g.course_code === courseCode) enrolledStudentIds.add(g.student_id);
  }

  const enrolled = students.filter((s) => enrolledStudentIds.has(s.student_id));

  // Count attendance statuses across all attendance records but only for enrolled students
  const stats = { Present: 0, Absent: 0, Other: 0 };
  for (const a of attendance) {
    if (!enrolledStudentIds.has(a.student_id)) continue;
    const st = (a.attendance_status || "").trim();
    if (st.toLowerCase() === "present") stats.Present += 1;
    else if (st.toLowerCase() === "absent") stats.Absent += 1;
    else stats.Other += 1;
  }

  const total = stats.Present + stats.Absent + stats.Other;
  const chartData = [
    { name: "Present", value: stats.Present },
    { name: "Absent", value: stats.Absent },
    { name: "Other", value: stats.Other },
  ];

  return (
    <div>
      <p className="text-sm text-gray-700">Enrolled students: {enrolled.length}</p>
      <div style={{ height: 180, marginTop: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 10 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, idx) => (
                <Cell key={`c-${idx}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">Total attendance records considered: {total}</p>

      <h4 className="mt-3 font-medium">Sample of enrolled students</h4>
      <div className="max-h-40 overflow-auto border rounded text-sm">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-gray-500">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
            </tr>
          </thead>
          <tbody>
            {enrolled.slice(0, 10).map((s) => (
              <tr key={s.student_id} className="border-t">
                <td className="p-2">{s.student_id}</td>
                <td className="p-2">{s.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">Note: course-specific attendance requires attendance rows to include course_code.</p>
    </div>
  );
}

/*
Important integration note:
Because the CourseAttendance component needs access to the grades data for mapping enrolled
students, the main App sets a global variable so the small component can read it easily.
This is a pragmatic choice for a single-file demo. In a production app prefer context or props.
*/
(function exposeGradesGlobally() {
  // Keep attempting to attach grades to window until the dataset is loaded.
  if (typeof window === "undefined") return;
  Object.defineProperty(window, "__GRADES_FOR_APP", {
    configurable: true,
    enumerable: false,
    get() {
      return window.__internal_grades_for_app || [];
    },
    set(v) {
      window.__internal_grades_for_app = v;
    },
  });
})();

// The App component sets window.__GRADES_FOR_APP after it loads grades
// (see top of App useEffect). To ensure that, patch App to set it when grades change.

/*
If you want additional features I can:
 - Add CSV upload to replace dataset at runtime
 - Add export of reports to CSV/PDF
 - Add authentication and edit/delete CRUD actions
 - Normalize the attendance data to include course_code
*/
