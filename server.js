const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔐 File Upload (Photo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 📁 JSON File Paths
const usersFile = path.join(__dirname, 'data', 'users.json');
const studentsFile = path.join(__dirname, 'data', 'students.json');
const noticesFile = path.join(__dirname, 'data', 'notices.json');
const leavesFile = path.join(__dirname, 'data', 'leaves.json');
const resultsFile = path.join(__dirname, 'data', 'results.json');
const calendarFile = path.join(__dirname, 'data', 'exam_calendar.json');

// 🧠 JSON Helpers
const readJSON = (file) => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

/* ------------------------- AUTH ROUTES ------------------------- */

app.post('/api/register', (req, res) => {
  const users = readJSON(usersFile);
  const newUser = req.body;
  if (users.find(u => u.email === newUser.email)) {
    return res.status(400).json({ message: 'Email already exists' });
  }
  users.push(newUser);
  writeJSON(usersFile, users);
  res.json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(usersFile);
  const user = users.find(u => u.email === email && u.password === password);
  user
    ? res.json({ message: 'Login successful', role: user.role, email: user.email })
    : res.status(401).json({ message: 'Invalid credentials' });
});

/* ------------------------ STUDENT ROUTES ------------------------ */

app.post('/api/student/:id/profile', upload.single('photo'), (req, res) => {
  const id = req.params.id;
  const students = readJSON(studentsFile);
  const idx = students.findIndex(s => s.id === id || s.email === id);
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : (students[idx]?.photo || null);

  const updated = {
    id,
    fullName: req.body.fullName,
    phone: req.body.phone,
    dob: req.body.dob,
    gender: req.body.gender,
    department: req.body.department,
    course: req.body.course,
    nationality: req.body.nationality,
    bloodGroup: req.body.bloodGroup,
    emergencyContact: req.body.emergencyContact,
    address: req.body.address,
    email: req.body.email,
    photo: photoUrl,
    profileApproved: false,
    feeApproved: false
  };

  if (idx !== -1) students[idx] = updated;
  else students.push(updated);

  writeJSON(studentsFile, students);
  res.json({ message: 'Profile saved', photo: photoUrl });
});

app.get('/api/student/:id/profile', (req, res) => {
  const students = readJSON(studentsFile);
  const student = students.find(s => s.id === req.params.id || s.email === req.params.id);
  student ? res.json(student) : res.status(404).json({ message: 'Student not found' });
});

app.get('/api/student/:id/attendance', (req, res) => {
  res.json({ attendance: '87%', daysPresent: 67, totalDays: 77 });
});

app.get('/api/student/:id/timetable', (req, res) => {
  res.json({
    timetable: [
      { day: "Monday", slots: ["Math", "Physics", "Free", "English"] },
      { day: "Tuesday", slots: ["Chemistry", "Biology", "Math", "Free"] }
    ]
  });
});

app.get('/api/student/:id/fees', (req, res) => {
  res.json({ total: 25000, paid: 20000, pending: 5000 });
});

app.post('/api/student/:id/assignment', (req, res) => {
  res.json({ message: "Assignment submitted (not stored)" });
});

app.post('/api/student/:id/leave', (req, res) => {
  const leaves = readJSON(leavesFile);
  const newLeave = {
    id: leaves.length + 1,
    studentId: req.params.id,
    name: req.body.name,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
    reason: req.body.reason,
    status: "Pending"
  };
  leaves.push(newLeave);
  writeJSON(leavesFile, leaves);
  res.json({ message: 'Leave submitted' });
});

app.put('/api/student/:id/results', (req, res) => {
  const studentId = req.params.id;
  const newMarks = req.body;
  const results = readJSON(resultsFile);
  const existing = results.find(r => r.studentId === studentId);

  if (existing) existing.marks = { ...existing.marks, ...newMarks };
  else results.push({ studentId, marks: newMarks });

  writeJSON(resultsFile, results);
  res.json({ message: "Marks saved successfully" });
});

app.get('/api/student/:id/results', (req, res) => {
  const results = readJSON(resultsFile);
  const studentResult = results.find(r => r.studentId === req.params.id);
  studentResult ? res.json(studentResult) : res.status(404).json({ message: 'No results found' });
});

app.get('/api/notices', (req, res) => {
  const notices = readJSON(noticesFile);
  res.json(notices);
});
/* --------------------------- ADMIN ROUTES --------------------------- */

// Get all students
app.get('/api/admin/students', (req, res) => {
  const students = readJSON(studentsFile);
  res.json(students);
});

// Add new student
app.post('/api/admin/students', (req, res) => {
  const students = readJSON(studentsFile);
  const newStudent = { ...req.body, id: 'S' + (students.length + 1) };
  students.push(newStudent);
  writeJSON(studentsFile, students);
  res.json({ message: 'Student added' });
});

// Update student
app.put('/api/admin/students/:id', (req, res) => {
  const students = readJSON(studentsFile);
  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Student not found' });
  students[idx] = { ...students[idx], ...req.body };
  writeJSON(studentsFile, students);
  res.json({ message: 'Student updated' });
});

// Delete student
app.delete('/api/admin/students/:id', (req, res) => {
  let students = readJSON(studentsFile);
  students = students.filter(s => s.id !== req.params.id);
  writeJSON(studentsFile, students);
  res.json({ message: 'Student deleted' });
});

// View all results
app.get('/api/admin/results', (req, res) => {
  const results = readJSON(resultsFile);
  res.json(results);
});

// Update result
app.put('/api/admin/results/:id', (req, res) => {
  const results = readJSON(resultsFile);
  const idx = results.findIndex(r => r.studentId === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Result not found' });
  results[idx] = { ...results[idx], ...req.body };
  writeJSON(resultsFile, results);
  res.json({ message: 'Result updated' });
});

// View leaves
app.get('/api/admin/leaves', (req, res) => {
  const leaves = readJSON(leavesFile);
  res.json(leaves);
});

// Approve/reject leave
app.put('/api/admin/leaves/:id', (req, res) => {
  const leaves = readJSON(leavesFile);
  const idx = leaves.findIndex(l => l.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Leave not found" });

  leaves[idx].status = req.body.status;
  writeJSON(leavesFile, leaves);
  res.json({ message: "Leave status updated" });
});

// Grouped profiles by year
app.get('/api/admin/student-profiles', (req, res) => {
  const students = readJSON(studentsFile);
  const grouped = {};

  students.forEach(s => {
    const year = s.dob ? new Date(s.dob).getFullYear().toString() : "Unknown";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(s);
  });

  res.json(grouped);
});

/* ------------------------- PDF Download Routes ------------------------- */

// Download student profile as PDF
app.get('/api/admin/download-profile/:id', (req, res) => {
  const students = readJSON(studentsFile);
  const s = students.find(std => std.id === req.params.id || std.email === req.params.id);
  if (!s) return res.status(404).send('Student not found');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${s.fullName}-profile.pdf`);
  doc.pipe(res);
  doc.fontSize(18).text("Student Profile", { align: 'center' });
  doc.moveDown();
  for (let key in s) {
    if (key !== 'photo') doc.text(`${key}: ${s[key]}`);
  }
  doc.end();
});

// Download student marks as PDF
app.get('/api/admin/download-result/:id', (req, res) => {
  const results = readJSON(resultsFile);
  const studentResult = results.find(r => r.studentId === req.params.id);
  if (!studentResult) return res.status(404).send("Result not found");

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${studentResult.studentId}-marks.pdf`);
  doc.pipe(res);
  doc.fontSize(18).text("Student Marks", { align: 'center' });
  doc.moveDown();
  for (let sub in studentResult.marks) {
    doc.text(`${sub}: ${studentResult.marks[sub]}`);
  }
  doc.end();
});

/* ------------------------- Exam Calendar Routes ------------------------- */

// Get all calendar events
app.get('/api/admin/exam-calendar', (req, res) => {
  const events = fs.existsSync(calendarFile) ? readJSON(calendarFile) : [];
  res.json(events);
});

// Add new calendar event
app.post('/api/admin/exam-calendar', (req, res) => {
  const events = fs.existsSync(calendarFile) ? readJSON(calendarFile) : [];
  events.push({ ...req.body, id: events.length + 1 });
  writeJSON(calendarFile, events);
  res.json({ message: "Event added" });
});

/* ------------------- Profile & Fee Approval Routes ------------------- */

// Approve profile
app.put('/api/admin/approve-profile/:id', (req, res) => {
  const students = readJSON(studentsFile);
  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Student not found' });

  students[idx].profileApproved = true;
  writeJSON(studentsFile, students);
  res.json({ message: 'Profile approved' });
});

// Approve fee
app.put('/api/admin/approve-fee/:id', (req, res) => {
  const students = readJSON(studentsFile);
  const idx = students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Student not found' });

  students[idx].feeApproved = true;
  writeJSON(studentsFile, students);
  res.json({ message: 'Fee approved' });
});

/* -------------------- Optional AI Chatbot Route -------------------- */

app.post('/api/chatbot', (req, res) => {
  const message = req.body.message || "";
  res.json({ reply: `🤖 Echo from AI: "${message}"` });
});

/* ---------------------------- Server Start ---------------------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
