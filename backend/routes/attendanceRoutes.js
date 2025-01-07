const express = require('express');
const router = express.Router();
const { login, uploadStudents, markAttendance } = require('../controllers/attendanceController');

router.post('/login', login);
router.post('/upload-students', uploadStudents);
router.post('/mark-attendance', markAttendance);

module.exports = router;
