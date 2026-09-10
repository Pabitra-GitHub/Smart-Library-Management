/**
 * Library System Configuration & Constants
 */
module.exports = {
  // Standard loan period in days (PRD Section 6.6)
  defaultLoanPeriodDays: 14,

  // Fine rate per late day in Rupees (PRD Section 6.7)
  defaultFinePerDay: 5,

  // Maximum active books allowed per student
  maxBooksPerStudent: 4,

  // Port for Express server
  port: process.env.PORT || 3000,

  // Library branding
  libraryName: 'AI Smart Library',
  institution: 'Department of Computer Science & Engineering'
};
