const db = require('../data/db');
const fineService = require('../services/fineService');

/**
 * Book Issue & Return Controller
 * Implements PRD Section 6.4 (Issue), 6.5 (Return), 6.6 (Due Date), 6.7 (Fine Calculation)
 */
class IssuesController {
  getAllIssues(req, res) {
    try {
      const { status, studentId, bookId, search } = req.query;
      let issues = db.get('issues');

      // Enrich all issues with live status and fine calculation
      let enriched = issues.map(i => fineService.enrichIssue(i));

      if (status && status !== 'All') {
        if (status === 'ACTIVE') {
          enriched = enriched.filter(i => !i.returnDate);
        } else if (status === 'OVERDUE') {
          enriched = enriched.filter(i => !i.returnDate && i.isOverdue);
        } else if (status === 'RETURNED') {
          enriched = enriched.filter(i => !!i.returnDate);
        }
      }

      if (studentId) {
        enriched = enriched.filter(i => i.studentId === studentId);
      }

      if (bookId) {
        enriched = enriched.filter(i => i.bookId === bookId);
      }

      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        enriched = enriched.filter(i =>
          (i.bookTitle && i.bookTitle.toLowerCase().includes(q)) ||
          (i.studentName && i.studentName.toLowerCase().includes(q)) ||
          (i.studentId && i.studentId.toLowerCase().includes(q)) ||
          (i.id && i.id.toLowerCase().includes(q))
        );
      }

      // Sort newest issueDate first
      enriched.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

      return res.json({
        success: true,
        count: enriched.length,
        issues: enriched
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getIssueById(req, res) {
    try {
      const { id } = req.params;
      const issue = db.getById('issues', id);

      if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue record not found' });
      }

      const enriched = fineService.enrichIssue(issue);
      return res.json({ success: true, issue: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  issueBook(req, res) {
    try {
      const { studentId, bookId, customLoanDays, notes, performedBy } = req.body;

      if (!studentId || !bookId) {
        return res.status(400).json({
          success: false,
          message: 'Both Student ID and Book ID are required to issue a book'
        });
      }

      let loanDays = null;
      if (customLoanDays !== undefined && customLoanDays !== null && customLoanDays !== '') {
        loanDays = parseInt(customLoanDays, 10);
        if (Number.isNaN(loanDays) || loanDays <= 0) {
          return res.status(400).json({ success: false, message: 'Custom loan days must be a positive whole number' });
        }
      }

      // 1. Verify Student exists & is active
      const student = db.getById('students', studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: `Student ${studentId} not found` });
      }
      if (student.status !== 'active') {
        return res.status(400).json({ success: false, message: `Cannot issue book. Student status is "${student.status}"` });
      }

      // 2. Verify Book exists & has available copies
      const book = db.getById('books', bookId);
      if (!book) {
        return res.status(404).json({ success: false, message: `Book ${bookId} not found` });
      }
      if (book.availableCopies <= 0) {
        return res.status(400).json({
          success: false,
          message: `All copies of "${book.title}" are currently issued. None available right now.`
        });
      }

      // 3. Guard: Prevent student from holding duplicate active copy of same book
      const existingStudentLoans = db.find('issues', i => i.studentId === studentId && !i.returnDate);
      const alreadyHasThisBook = existingStudentLoans.some(i => i.bookId === bookId);
      if (alreadyHasThisBook) {
        return res.status(400).json({
          success: false,
          message: `Student ${student.name} already has an active copy of "${book.title}". Duplicate issues are not allowed.`
        });
      }

      // 4. Guard: Check maximum active books quota
      const settings = db.getSettings();
      const maxAllowed = settings.maxBooksPerStudent || 4;
      if (existingStudentLoans.length >= maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Student ${student.name} has reached the maximum borrowing limit of ${maxAllowed} books.`
        });
      }

      // 5. Create Issue Record
      const issueDate = new Date();
      const dueDate = fineService.calculateDueDate(issueDate, loanDays);

      const allIssues = db.get('issues');
      const year = issueDate.getFullYear();
      const issuePrefix = `ISS-${year}-`;
      const nextIssueNum = allIssues
        .filter(i => typeof i.id === 'string' && i.id.startsWith(issuePrefix))
        .map(i => parseInt(i.id.slice(issuePrefix.length), 10))
        .filter(Number.isFinite)
        .reduce((max, num) => Math.max(max, num), 0) + 1;
      const issueId = `${issuePrefix}${String(nextIssueNum).padStart(3, '0')}`;

      const newIssue = {
        id: issueId,
        bookId: book.id,
        bookTitle: book.title,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        issueDate: issueDate.toISOString(),
        dueDate,
        returnDate: null,
        status: 'ISSUED',
        fineAmount: 0,
        finePaid: false,
        notes: notes ? notes.trim() : ''
      };

      // 6. Insert issue record first, then decrement book copies.
      // Order matters: if a crash occurs, a phantom issue is easier to fix
      // than an inconsistent copy count with no matching issue record.
      db.insert('issues', newIssue);
      db.update('books', book.id, {
        availableCopies: book.availableCopies - 1
      });

      db.logAudit('ISSUE_BOOK', `Issued "${book.title}" to ${student.name} (${student.id})`, performedBy || 'Librarian');

      return res.status(201).json({
        success: true,
        message: `Book "${book.title}" successfully issued to ${student.name}. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        issue: fineService.enrichIssue(newIssue)
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  returnBook(req, res) {
    try {
      const { id } = req.params;
      const { returnDateOverride, fineCollected, notes, performedBy } = req.body;

      const issue = db.getById('issues', id);
      if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue record not found' });
      }

      if (issue.returnDate) {
        return res.status(400).json({
          success: false,
          message: `This book was already returned on ${new Date(issue.returnDate).toLocaleDateString()}`
        });
      }

      // Determine return date (allows override for demo/testing fine calculation)
      const returnDate = returnDateOverride ? new Date(returnDateOverride) : new Date();
      if (Number.isNaN(returnDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Return date must be a valid date' });
      }

      // Calculate fines according to PRD
      const fineResult = fineService.calculateFine(issue.dueDate, returnDate);

      // Increase book available copies
      const book = db.getById('books', issue.bookId);
      if (book) {
        db.update('books', book.id, {
          availableCopies: Math.min(book.totalCopies, book.availableCopies + 1)
        });
      }

      const updatedIssue = db.update('issues', id, {
        returnDate: returnDate.toISOString(),
        status: 'RETURNED',
        fineAmount: fineResult.fineAmount,
        finePaid: fineResult.fineAmount === 0 ? true : (fineCollected === true || fineCollected === 'true'),
        notes: notes ? `${issue.notes ? issue.notes + ' | ' : ''}${notes.trim()}` : issue.notes
      });

      const auditMsg = fineResult.fineAmount > 0
        ? `Returned "${issue.bookTitle}" by ${issue.studentName}. Late by ${fineResult.overdueDays} day(s). Fine: ₹${fineResult.fineAmount} (${updatedIssue.finePaid ? 'Paid' : 'Pending'})`
        : `Returned "${issue.bookTitle}" by ${issue.studentName} on time.`;

      db.logAudit('RETURN_BOOK', auditMsg, performedBy || 'Librarian');

      return res.json({
        success: true,
        message: fineResult.fineAmount > 0
          ? `Book returned. Overdue by ${fineResult.overdueDays} days. Fine calculated: ₹${fineResult.fineAmount}`
          : 'Book returned on time. No fine incurred.',
        issue: fineService.enrichIssue(updatedIssue),
        fineDetails: fineResult
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  updateFinePayment(req, res) {
    try {
      const { id } = req.params;
      const { finePaid, performedBy } = req.body;

      if (![true, false, 'true', 'false'].includes(finePaid)) {
        return res.status(400).json({ success: false, message: 'finePaid must be true or false' });
      }
      const parsedFinePaid = finePaid === true || finePaid === 'true';

      const issue = db.getById('issues', id);
      if (!issue) {
        return res.status(404).json({ success: false, message: 'Issue record not found' });
      }

      const updated = db.update('issues', id, {
        finePaid: parsedFinePaid
      });

      db.logAudit('FINE_PAYMENT', `Fine payment status updated for transaction ${id} (Paid: ${parsedFinePaid})`, performedBy || 'Librarian');

      return res.json({
        success: true,
        message: `Fine status updated to ${parsedFinePaid ? 'PAID' : 'PENDING'}`,
        issue: fineService.enrichIssue(updated)
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new IssuesController();
