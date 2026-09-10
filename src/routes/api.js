const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const booksController = require('../controllers/booksController');
const studentsController = require('../controllers/studentsController');
const issuesController = require('../controllers/issuesController');
const aiController = require('../controllers/aiController');
const statsController = require('../controllers/statsController');

// --- Authentication Routes ---
router.post('/auth/register', (req, res) => authController.register(req, res));
router.post('/auth/login', (req, res) => authController.login(req, res));
router.get('/auth/status', (req, res) => authController.getSystemStatus(req, res));

// --- Books Routes ---
router.get('/books', (req, res) => booksController.getAllBooks(req, res));
router.get('/books/categories', (req, res) => booksController.getCategories(req, res));
router.get('/books/:id', (req, res) => booksController.getBookById(req, res));
router.post('/books', (req, res) => booksController.createBook(req, res));
router.put('/books/:id', (req, res) => booksController.updateBook(req, res));
router.delete('/books/:id', (req, res) => booksController.deleteBook(req, res));

// --- Students Routes ---
router.get('/students', (req, res) => studentsController.getAllStudents(req, res));
router.get('/students/:id', (req, res) => studentsController.getStudentById(req, res));
router.post('/students', (req, res) => studentsController.createStudent(req, res));
router.put('/students/:id', (req, res) => studentsController.updateStudent(req, res));
router.delete('/students/:id', (req, res) => studentsController.deleteStudent(req, res));

// --- Issue & Return Routes ---
router.get('/issues', (req, res) => issuesController.getAllIssues(req, res));
router.get('/issues/:id', (req, res) => issuesController.getIssueById(req, res));
router.post('/issues', (req, res) => issuesController.issueBook(req, res));
router.post('/issues/:id/return', (req, res) => issuesController.returnBook(req, res));
router.patch('/issues/:id/fine', (req, res) => issuesController.updateFinePayment(req, res));

// --- AI Smart Search Routes ---
router.post('/ai/smart-search', (req, res) => aiController.search(req, res));
router.post('/ai/extract-intent', (req, res) => aiController.extractKeywords(req, res));
router.get('/ai/suggestions', (req, res) => aiController.getSuggestedQueries(req, res));

// --- Dashboard & Statistics Routes ---
router.get('/stats/librarian', (req, res) => statsController.getLibrarianStats(req, res));
router.get('/stats/student/:studentId', (req, res) => statsController.getStudentStats(req, res));
router.get('/settings', (req, res) => statsController.getSettings(req, res));
router.put('/settings', (req, res) => statsController.updateSettings(req, res));
router.post('/settings/reset', (req, res) => statsController.resetData(req, res));

module.exports = router;
