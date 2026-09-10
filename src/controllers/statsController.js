const db = require('../data/db');
const fineService = require('../services/fineService');

/**
 * Statistics and Dashboard Controller
 * Implements PRD Section 6.10 (Librarian & Student Dashboards)
 */
class StatsController {
  getLibrarianStats(req, res) {
    try {
      const books = db.get('books');
      const students = db.get('students');
      const rawIssues = db.get('issues');
      const settings = db.getSettings();

      const issues = rawIssues.map(i => fineService.enrichIssue(i));

      // 1. Books calculation
      const totalBookTitles = books.length;
      const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
      const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
      const issuedCopies = totalCopies - availableCopies;

      // 2. Active loans & overdues
      const activeIssues = issues.filter(i => !i.returnDate);
      const overdueIssues = activeIssues.filter(i => i.isOverdue);

      // 3. Fines
      let totalFinesAccrued = 0;
      let totalFinesCollected = 0;
      let totalFinesPending = 0;

      for (const i of issues) {
        const fine = i.calculatedFine || i.fineAmount || 0;
        totalFinesAccrued += fine;
        if (i.finePaid) {
          totalFinesCollected += fine;
        } else {
          totalFinesPending += fine;
        }
      }

      // 4. Category breakdown
      const categoryMap = {};
      for (const b of books) {
        const cat = b.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + (b.totalCopies || 1);
      }
      const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
        category,
        count
      }));

      // 5. Recent 8 transactions
      const recentTransactions = issues
        .slice()
        .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
        .slice(0, 8);

      return res.json({
        success: true,
        stats: {
          totalBookTitles,
          totalCopies,
          availableCopies,
          issuedCopies,
          totalStudents: students.length,
          activeLoansCount: activeIssues.length,
          overdueLoansCount: overdueIssues.length,
          totalFinesAccrued,
          totalFinesCollected,
          totalFinesPending,
          settings: {
            loanPeriodDays: settings.loanPeriodDays || 14,
            finePerDay: settings.finePerDay || 5,
            currencySymbol: settings.currencySymbol || '₹'
          }
        },
        categoryDistribution,
        recentTransactions,
        overdueAlerts: overdueIssues
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getStudentStats(req, res) {
    try {
      const { studentId } = req.params;
      const student = db.getById('students', studentId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const allIssues = db.get('issues');
      const studentIssues = allIssues
        .filter(i => i.studentId === studentId)
        .map(i => fineService.enrichIssue(i));

      const activeLoans = studentIssues.filter(i => !i.returnDate);
      const overdueLoans = activeLoans.filter(i => i.isOverdue);
      const returnedHistory = studentIssues.filter(i => !!i.returnDate);

      const totalPendingFine = activeLoans.reduce((sum, i) => sum + (i.calculatedFine || 0), 0) +
        returnedHistory.filter(i => !i.finePaid).reduce((sum, i) => sum + (i.fineAmount || 0), 0);

      // Due soon loans (due within next 3 days and not overdue)
      const now = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(now.getDate() + 3);

      const dueSoonLoans = activeLoans.filter(i => {
        const due = new Date(i.dueDate);
        return due >= now && due <= threeDaysLater;
      });

      return res.json({
        success: true,
        student,
        stats: {
          activeLoansCount: activeLoans.length,
          overdueLoansCount: overdueLoans.length,
          dueSoonCount: dueSoonLoans.length,
          totalBorrowedAllTime: studentIssues.length,
          totalPendingFine
        },
        activeLoans,
        dueSoonLoans,
        overdueLoans,
        history: studentIssues.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getSettings(req, res) {
    try {
      const settings = db.getSettings();
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  updateSettings(req, res) {
    try {
      const { loanPeriodDays, finePerDay, maxBooksPerStudent } = req.body;
      const updates = {};

      if (loanPeriodDays !== undefined) {
        const val = parseInt(loanPeriodDays, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, message: 'Loan period must be > 0' });
        updates.loanPeriodDays = val;
      }

      if (finePerDay !== undefined) {
        const val = parseInt(finePerDay, 10);
        if (isNaN(val) || val < 0) return res.status(400).json({ success: false, message: 'Fine per day must be >= 0' });
        updates.finePerDay = val;
      }

      if (maxBooksPerStudent !== undefined) {
        const val = parseInt(maxBooksPerStudent, 10);
        if (isNaN(val) || val <= 0) return res.status(400).json({ success: false, message: 'Max books per student must be > 0' });
        updates.maxBooksPerStudent = val;
      }

      const updated = db.updateSettings(updates);
      db.logAudit('UPDATE_SETTINGS', `Updated library configuration settings`, req.body.performedBy || 'Librarian');

      return res.json({ success: true, message: 'Settings updated successfully', settings: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  resetData(req, res) {
    try {
      db.resetToSeed();
      return res.json({
        success: true,
        message: 'System database successfully reset to clean demo state!'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new StatsController();
