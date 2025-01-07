const db = require('../models/db');
const Papa = require('papaparse');
const fs = require('fs');

// User login
const login = (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful' });
  });
};

// Upload students from CSV
const uploadStudents = (req, res) => {
  const csvFilePath = './D6ADB.csv';
  const file = fs.readFileSync(csvFilePath, 'utf8');
  const { data } = Papa.parse(file, { header: true });

  const insertQuery = 'INSERT INTO students (gr_no, roll_no, name) VALUES ?';
  const values = data.map((row, index) => [
    `AIDS2023${String(index + 1).padStart(2, '0')}`,
    row.RollNo,
    row.Name,
  ]);

  db.query(insertQuery, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Students uploaded successfully.' });
  });
};

// Mark attendance
const markAttendance = (req, res) => {
  const { attendanceData } = req.body;

  const insertQuery = `
    INSERT INTO attendance (student_id, date, subject_code, status)
    VALUES ?
  `;
  const values = attendanceData.map((record) => [
    record.student_id,
    record.date,
    record.subject_code,
    record.status,
  ]);

  db.query(insertQuery, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Attendance marked successfully.' });
  });
};

module.exports = { login, uploadStudents, markAttendance };
