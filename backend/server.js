const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = 4000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json()); // To parse incoming JSON requests

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your DB username
  password: 'root', // Replace with your DB password
  database: 'attendance_system', // Replace with your DB name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  });
});

// Get attendance for a subject and specific date
app.get('/attendance/:subjectCode/:date', (req, res) => {
  const { subjectCode, date } = req.params;
  const query = `
    SELECT s.id, s.gr_no, s.roll_no, s.name, 
           COALESCE(ar.attendance, 0) AS attendance
    FROM students s
    JOIN student_subjects ss ON s.id = ss.student_id
    LEFT JOIN attendance_records ar ON ar.student_id = s.id AND ar.subject_code = ss.subject_code AND ar.date = ?
    WHERE ss.subject_code = ?
  `;
  
  db.query(query, [date, subjectCode], (err, results) => {
    if (err) {
      console.error('Error fetching attendance data:', err);
      return res.status(500).json({ success: false, message: 'Something went wrong.' });
    }
    res.json({ success: true, students: results });
  });
});

// Submit attendance data for a subject on a specific date
app.post('/attendance/:subjectCode/:date', (req, res) => {
  const { subjectCode, date } = req.params;
  const { students } = req.body;

  // Loop through each student and insert/update attendance record
  students.forEach(student => {
    const { id, attendance } = student;

    // Check if an attendance record already exists for this student on the given date
    const checkQuery = `
      SELECT * FROM attendance_records WHERE student_id = ? AND subject_code = ? AND date = ?
    `;
    
    db.query(checkQuery, [id, subjectCode, date], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error checking attendance record' });
      }

      if (results.length > 0) {
        // If record exists, update attendance (1 for present, 0 for absent)
        const updateQuery = `
          UPDATE attendance_records SET attendance = ? WHERE id = ?
        `;
        db.query(updateQuery, [attendance, results[0].id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error updating attendance' });
          }
        });
      } else {
        // Otherwise, insert new attendance record
        const insertQuery = `
          INSERT INTO attendance_records (student_id, subject_code, attendance, date) 
          VALUES (?, ?, ?, ?)
        `;
        db.query(insertQuery, [id, subjectCode, attendance, date], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Error inserting attendance' });
          }
        });
      }
    });
  });

  res.status(200).json({ success: true, message: 'Attendance updated successfully' });
});

// Using external attendance routes
app.use('/api', attendanceRoutes); // Assuming your attendance routes are defined in 'attendanceRoutes.js'

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
