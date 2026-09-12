const db = require('../data/db');

/**
 * Service to manage loan durations, due dates, and fine calculations.
 * Implements PRD Sections 6.6 and 6.7.
 */
class FineService {
  /**
   * Calculate due date from an issue date.
   * @param {Date|string} issueDate
   * @param {number} [customLoanDays]
   * @returns {string} ISO Date string
   */
  calculateDueDate(issueDate, customLoanDays = null) {
    const settings = db.getSettings();
    const loanDays = customLoanDays ?? settings.loanPeriodDays ?? 14;
    const date = new Date(issueDate);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid issue date');
    }
    date.setDate(date.getDate() + loanDays);
    return date.toISOString();
  }

  /**
   * Calculate late days and fine for an issue record.
   * @param {string|Date} dueDate
   * @param {string|Date} [effectiveReturnDate] - If not returned yet, defaults to now.
   * @param {number} [customFinePerDay]
   * @returns {{ overdueDays: number, fineAmount: number, isOverdue: boolean }}
   */
  calculateFine(dueDate, effectiveReturnDate = null, customFinePerDay = null) {
    const settings = db.getSettings();
    const fineRate = (customFinePerDay !== null && customFinePerDay !== undefined)
      ? customFinePerDay
      : (settings.finePerDay ?? 5);

    const due = new Date(dueDate);
    const targetDate = effectiveReturnDate ? new Date(effectiveReturnDate) : new Date();

    if (Number.isNaN(due.getTime()) || Number.isNaN(targetDate.getTime())) {
      throw new Error('Invalid due date or return date');
    }

    // Reset time components for clean day-difference comparison
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffMs = targetMidnight.getTime() - dueMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const overdueDays = Math.max(0, diffDays);
    const fineAmount = overdueDays * fineRate;

    return {
      overdueDays,
      fineAmount,
      fineRate,
      isOverdue: overdueDays > 0
    };
  }

  /**
   * Determine live status of an issue record.
   * @param {object} issue
   * @returns {'RETURNED' | 'OVERDUE' | 'DUE_TODAY' | 'ISSUED'}
   */
  determineStatus(issue) {
    if (issue.returnDate) return 'RETURNED';

    const now = new Date();
    const due = new Date(issue.dueDate);
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

    if (nowMidnight > dueMidnight) return 'OVERDUE';
    if (nowMidnight === dueMidnight) return 'DUE_TODAY';
    return 'ISSUED';
  }

  /**
   * Enrich issue record with real-time fine calculation and status.
   * @param {object} issue
   * @returns {object}
   */
  enrichIssue(issue) {
    const status = this.determineStatus(issue);
    let fineInfo;

    if (issue.returnDate) {
      // If already returned, use the finalized returnDate for fine
      fineInfo = this.calculateFine(issue.dueDate, issue.returnDate);
    } else {
      // If still active, compute real-time accrued fine
      fineInfo = this.calculateFine(issue.dueDate, new Date());
    }

    const effectiveFine = issue.returnDate
      ? (issue.fineAmount !== undefined ? issue.fineAmount : fineInfo.fineAmount)
      : fineInfo.fineAmount;

    return {
      ...issue,
      currentStatus: status,
      isOverdue: fineInfo.isOverdue,
      overdueDays: fineInfo.overdueDays,
      calculatedFine: effectiveFine,
      fineRateApplied: fineInfo.fineRate
    };
  }
}

module.exports = new FineService();
