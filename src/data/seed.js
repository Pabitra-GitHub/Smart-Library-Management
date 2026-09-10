/**
 * Clean Database Schema for AI Smart Library
 * Zero mock examples — ready for real collegiate use.
 */

const seedData = {
  settings: {
    loanPeriodDays: 14,
    finePerDay: 5,
    maxBooksPerStudent: 4,
    currencySymbol: '₹',
    librarianPasscode: 'admin123' // Master passcode required to create Librarian accounts
  },
  users: [],
  students: [],
  books: [],
  issues: [],
  auditLogs: [
    {
      id: 'LOG-INIT',
      action: 'SYSTEM_INIT',
      description: 'AI Smart Library initialized in clean mode.',
      timestamp: new Date().toISOString(),
      performedBy: 'System'
    }
  ]
};

module.exports = seedData;
