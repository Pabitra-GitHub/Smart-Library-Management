const db = require('../data/db');

/**
 * Authentication and User Registration Controller
 * Implements role-based access with passcode-protected librarian creation.
 */
class AuthController {
  register(req, res) {
    try {
      const {
        role,
        name,
        email,
        username,
        password,
        securityPasscode,
        department,
        semester,
        enrollmentNo,
        designation
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, password, and account role are required'
        });
      }

      const users = db.get('users');
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = (username ? username.trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''));

      // Duplicate check
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.'
        });
      }

      if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken. Please choose another username.'
        });
      }

      // Password protection for Librarian Account
      if (role === 'librarian') {
        const settings = db.getSettings();
        const masterKey = settings.librarianPasscode || 'admin123';

        if (!securityPasscode || securityPasscode !== masterKey) {
          return res.status(403).json({
            success: false,
            message: 'Invalid Librarian Master Passcode. Authorized librarian key required to create administrator accounts.'
          });
        }
      }

      let studentId = null;
      // If registering as student, generate student registry record
      if (role === 'student') {
        const students = db.get('students');
        const year = new Date().getFullYear();
        const num = String(students.length + 1).padStart(3, '0');
        studentId = `STU-${year}-${num}`;

        const newStudent = {
          id: studentId,
          name: name.trim(),
          email: cleanEmail,
          phone: req.body.phone ? req.body.phone.trim() : '',
          department: department ? department.trim() : 'CSE',
          semester: semester ? semester.trim() : '1st Semester',
          enrollmentNo: enrollmentNo ? enrollmentNo.trim() : `0801${(department || 'CS').substring(0, 2).toUpperCase()}${year % 100}${num}`,
          status: 'active',
          createdAt: new Date().toISOString()
        };

        db.insert('students', newStudent);
      }

      const userId = `USR-${role.toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const newUser = {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        password, // In a production system, hashed with bcrypt
        name: name.trim(),
        role: role === 'librarian' ? 'librarian' : 'student',
        studentId,
        department: department || (role === 'librarian' ? 'Library Administration' : 'CSE'),
        semester: semester || null,
        designation: designation || (role === 'librarian' ? 'Librarian' : 'Student'),
        createdAt: new Date().toISOString()
      };

      db.insert('users', newUser);
      db.logAudit('REGISTER', `New ${role} account created for ${name.trim()} (${newUser.id})`, name.trim());

      // Return safe user profile
      const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        studentId: newUser.studentId,
        department: newUser.department,
        semester: newUser.semester,
        designation: newUser.designation
      };

      return res.status(201).json({
        success: true,
        message: `Account created successfully! Welcome, ${newUser.name}.`,
        user: safeUser
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during registration' });
    }
  }

  login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Email/Username and password are required' });
      }

      const users = db.get('users');
      const cleanIdent = identifier.trim().toLowerCase();
      const user = users.find(u =>
        (u.email.toLowerCase() === cleanIdent || u.username.toLowerCase() === cleanIdent) &&
        u.password === password
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email/username or password' });
      }

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId || null,
        department: user.department || null,
        semester: user.semester || null,
        designation: user.designation || null
      };

      db.logAudit('LOGIN', `User ${user.name} (${user.role}) logged in`, user.name);

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: safeUser
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  }

  getSystemStatus(req, res) {
    try {
      const users = db.get('users');
      return res.json({
        success: true,
        hasUsers: users.length > 0,
        totalUsers: users.length
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
