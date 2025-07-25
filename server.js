const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());
app.use(express.static('public'));

// 🔐 Handle profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 📁 JSON paths
const usersFile = path.join(__dirname, 'data', 'users.json');
const studentsFile = path.join(__dirname, 'data', 'students.json');
const noticesFile = path.join(__dirname, 'data', 'notices.json');
const leavesFile = path.join(__dirname, 'data', 'leaves.json');
const resultsFile = path.join(__dirname, 'data', 'results.json');

// 🧠 JSON Helpers
const readJSON = (file) => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

/* ---------------------------- AUTH ROUTES ---------------------------- */

// Register
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

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON(usersFile);
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ message: 'Login successful', role: user.role, email: user.email });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

/* ---------------------------- STUDENT ROUTES ---------------------------- */

// Save or update profile with photo
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
    photo: photoUrl
  };

  if (idx !== -1) {
    students[idx] = updated;
  } else {
    students.push(updated);
  }

  writeJSON(studentsFile, students);
  res.json({ message: 'Profile saved', photo: photoUrl });
});

// Get profile
app.get('/api/student/:id/profile', (req, res) => {
  const students = readJSON(studentsFile);
  const student = students.find(s => s.id === req.params.id || s.email === req.params.id);
  student ? res.json(student) : res.status(404).json({ message: 'Student not found' });
});
// Dummy attendance
app.get('/api/student/:id/attendance', (req, res) => {
  res.json({ attendance: '87%', daysPresent: 67, totalDays: 77 });
});

// Dummy timetable
app.get('/api/student/:id/timetable', (req, res) => {
  res.json({
    timetable: [
      { day: "Monday", slots: ["Math", "Physics", "Free", "English"] },
      { day: "Tuesday", slots: ["Chemistry", "Biology", "Math", "Free"] },
    ]
  });
});

// Dummy fee details
app.get('/api/student/:id/fees', (req, res) => {
  res.json({ total: 25000, paid: 20000, pending: 5000 });
});

// Submit assignment (optional storage, placeholder)
app.post('/api/student/:id/assignment', (req, res) => {
  res.json({ message: "Assignment submitted (not stored)" });
});

// Submit leave
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

// Save/update result
app.put('/api/student/:id/results', (req, res) => {
  const studentId = req.params.id;
  const newMarks = req.body;
  const results = readJSON(resultsFile);
  const existing = results.find(r => r.studentId === studentId);

  if (existing) {
    existing.marks = { ...existing.marks, ...newMarks };
  } else {
    results.push({ studentId, marks: newMarks });
  }

  writeJSON(resultsFile, results);
  res.json({ message: "Marks saved successfully" });
});

// Get student result
app.get('/api/student/:id/results', (req, res) => {
  const results = readJSON(resultsFile);
  const studentResult = results.find(r => r.studentId === req.params.id);
  studentResult ? res.json(studentResult) : res.status(404).json({ message: 'No results found' });
});

// Get notices
app.get('/api/notices', (req, res) => {
  const notices = readJSON(noticesFile);
  res.json(notices);
});

/* ---------------------------- ADMIN ROUTES ---------------------------- */

// Get all students
app.get('/api/admin/students', (req, res) => {
  const students = readJSON(studentsFile);
  res.json(students);
});

// Add student
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

// Admin - view all results
app.get('/api/admin/results', (req, res) => {
  const results = readJSON(resultsFile);
  res.json(results);
});

// Admin - update student result
app.put('/api/admin/results/:id', (req, res) => {
  const results = readJSON(resultsFile);
  const idx = results.findIndex(r => r.studentId === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Result not found' });
  results[idx] = { ...results[idx], ...req.body };
  writeJSON(resultsFile, results);
  res.json({ message: 'Result updated' });
});

// Admin - leave requests
app.get('/api/admin/leaves', (req, res) => {
  const leaves = readJSON(leavesFile);
  res.json(leaves);
});

// Admin - approve/reject leave
app.put('/api/admin/leaves/:id', (req, res) => {
  const leaves = readJSON(leavesFile);
  const idx = leaves.findIndex(l => l.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ message: "Leave not found" });

  leaves[idx].status = req.body.status;
  writeJSON(leavesFile, leaves);
  res.json({ message: "Leave status updated" });
});

// Admin - student profiles grouped by year
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

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});