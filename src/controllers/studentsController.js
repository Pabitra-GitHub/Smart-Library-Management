const db = require('../data/db');
const fineService = require('../services/fineService');

/**
 * Student Registry Management Controller
 * Implements PRD Section 6.3 (Student Management)
 */
class StudentsController {
  getAllStudents(req, res) {
    try {
      const { search, department, status } = req.query;
      let students = db.get('students');

      if (department && department !== 'All') {
        students = students.filter(s => s.department && s.department.toLowerCase() === department.toLowerCase());
      }

      if (status && status !== 'All') {
        students = students.filter(s => s.status === status);
      }

      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        students = students.filter(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.id && s.id.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))
        );
      }

      // Attach active loans count to each student
      const allIssues = db.get('issues');
      const enrichedStudents = students.map(stu => {
        const activeLoans = allIssues.filter(i => i.studentId === stu.id && !i.returnDate);
        return {
          ...stu,
          activeLoansCount: activeLoans.length
        };
      });

      return res.json({
        success: true,
        count: enrichedStudents.length,
        students: enrichedStudents
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getStudentById(req, res) {
    try {
      const { id } = req.params;
      const student = db.getById('students', id);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Find all borrowing history for this student
      const allIssues = db.get('issues');
      const studentHistory = allIssues
        .filter(i => i.studentId === id)
        .map(i => fineService.enrichIssue(i));

      const activeLoans = studentHistory.filter(i => !i.returnDate);
      const totalFineAccrued = studentHistory.reduce((sum, i) => sum + (i.calculatedFine || 0), 0);
      const pendingFines = studentHistory
        .filter(i => !i.finePaid && (i.calculatedFine > 0 || i.fineAmount > 0))
        .reduce((sum, i) => sum + (i.calculatedFine || i.fineAmount || 0), 0);

      return res.json({
        success: true,
        student: {
          ...student,
          activeLoansCount: activeLoans.length,
          totalLoansCount: studentHistory.length,
          totalFineAccrued,
          pendingFines
        },
        activeLoans,
        history: studentHistory
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  createStudent(req, res) {
    try {
      const { name, email, phone, department, semester, enrollmentNo } = req.body;

      if (!name || !email || !department || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, department, and semester are required'
        });
      }

      const existingStudents = db.get('students');
      if (existingStudents.some(s => s.email.toLowerCase() === email.trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'A student with this email address is already registered'
        });
      }

      const year = new Date().getFullYear();
      const num = String(existingStudents.length + 1).padStart(3, '0');
      const studentId = `STU-${year}-${num}`;

      const newStudent = {
        id: studentId,
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '',
        department: department.trim(),
        semester: semester.trim(),
        enrollmentNo: enrollmentNo ? enrollmentNo.trim() : `0801${department.substring(0, 2).toUpperCase()}${year % 100}${num}`,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      db.insert('students', newStudent);

      // Also create login account for this student
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || `stu${num}`;
      const newUser = {
        id: `USR-${studentId}`,
        username,
        email: newStudent.email,
        password: 'student123', // Default student password
        name: newStudent.name,
        role: 'student',
        studentId: newStudent.id,
        department: newStudent.department,
        semester: newStudent.semester,
        createdAt: new Date().toISOString()
      };
      db.insert('users', newUser);

      db.logAudit('REGISTER_STUDENT', `Registered student ${newStudent.name} (${newStudent.id})`, req.body.performedBy || 'Librarian');

      return res.status(201).json({
        success: true,
        message: `Student "${newStudent.name}" registered successfully!`,
        student: newStudent,
        defaultLogin: {
          username: newUser.username,
          password: 'student123'
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  updateStudent(req, res) {
    try {
      const { id } = req.params;
      const student = db.getById('students', id);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const { name, email, phone, department, semester, enrollmentNo, status } = req.body;
      const updates = {};

      if (name) updates.name = name.trim();
      if (email) updates.email = email.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (department) updates.department = department.trim();
      if (semester) updates.semester = semester.trim();
      if (enrollmentNo) updates.enrollmentNo = enrollmentNo.trim();
      if (status) updates.status = status;

      const updated = db.update('students', id, updates);

      // Sync name / department in user account
      const user = db.findOne('users', u => u.studentId === id);
      if (user) {
        db.update('users', user.id, {
          name: updated.name,
          email: updated.email,
          department: updated.department,
          semester: updated.semester
        });
      }

      db.logAudit('UPDATE_STUDENT', `Updated details for student ${updated.name} (${id})`, req.body.performedBy || 'Librarian');

      return res.json({
        success: true,
        message: 'Student record updated successfully',
        student: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  deleteStudent(req, res) {
    try {
      const { id } = req.params;
      const student = db.getById('students', id);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Guard: Cannot delete student with active unreturned books
      const activeLoans = db.find('issues', i => i.studentId === id && !i.returnDate);
      if (activeLoans.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete student. They currently have ${activeLoans.length} active unreturned book(s).`
        });
      }

      db.delete('students', id);

      // Delete associated user account
      const user = db.findOne('users', u => u.studentId === id);
      if (user) db.delete('users', user.id);

      db.logAudit('DELETE_STUDENT', `Deleted student record for ${student.name} (${id})`, req.query.performedBy || 'Librarian');

      return res.json({
        success: true,
        message: `Student "${student.name}" was removed from the registry`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new StudentsController();
