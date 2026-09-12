/**
 * Student Personal Portal View
 * Implements PRD Section 4.2 (Student capabilities) & 6.10 (Student Dashboard)
 * Styled with authentic Apple-grade glassmorphic architecture and command bars
 */

const StudentPortalView = {
  async render(container) {
    const student = state.currentUser;
    if (!student || !student.studentId) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3.5rem;">
          <p style="color: var(--text-muted);">Please log in as a student to access the student portal.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <!-- Apple-Style Glass Student Welcome Bar -->
      <div class="glass-toolbar" style="margin-bottom: 2rem;">
        <div class="glass-toolbar-row">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.25rem;">
              <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em; margin: 0;">Welcome, ${student.name}</h1>
              <span class="badge badge-primary" style="font-size: 0.72rem; padding: 0.22rem 0.65rem;">Student Portal</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.90rem; margin: 0;">
              ${student.department} • ${student.semester || '7th Semester'} • Student ID: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${student.studentId}</strong>
            </p>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-primary" onclick="state.setTab('smart-search')" style="padding: 0.55rem 1.15rem;">
              <span>✨</span> AI Smart Search
            </button>
            <button class="btn btn-secondary" onclick="state.setTab('books')" style="padding: 0.55rem 1.15rem;">
              Browse Books
            </button>
          </div>
        </div>
      </div>

      <!-- Student KPI Cards -->
      <div id="student-kpis-grid" class="stats-grid stats-grid-4">
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
      </div>

      <!-- Overdue / Due Soon Alert Section -->
      <div id="student-alerts-banner" style="margin-bottom: 2rem;"></div>

      <!-- Currently Borrowed Books Section -->
      <div style="margin-bottom: 2.5rem;">
        <div class="card-header">
          <h2 class="card-title">📖 My Currently Borrowed Books</h2>
          <span id="student-borrowed-count-badge" class="badge badge-category">0 of 4 quota used</span>
        </div>
        <div id="student-active-books-container">
          <div class="skeleton" style="height: 180px;"></div>
        </div>
      </div>

      <!-- Past Borrowing History Table -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📜 My Borrowing History</h2>
        </div>
        <div id="student-history-container">
          <div class="skeleton" style="height: 200px;"></div>
        </div>
      </div>
    `;

    try {
      const data = await API.getStudentStats(student.studentId);
      this.renderKPIs(data.stats);
      this.renderAlerts(data.overdueLoans, data.dueSoonLoans);
      this.renderActiveBooks(data.activeLoans);
      this.renderHistory(data.history);
    } catch (err) {
      Toast.error('Could not load student information: ' + err.message);
    }
  },

  renderKPIs(stats) {
    const grid = document.getElementById('student-kpis-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="stat-card" style="border-left: 3.5px solid var(--primary);">
        <div class="stat-icon primary">📖</div>
        <div class="stat-info">
          <span class="stat-label">Active Borrowed</span>
          <span class="stat-value">${stats.activeLoansCount} <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: 600;">/ 4</span></span>
          <span class="stat-subtext">Books currently in possession</span>
        </div>
      </div>

      <div class="stat-card" style="border-left: 3.5px solid var(--warning);">
        <div class="stat-icon warning">⏳</div>
        <div class="stat-info">
          <span class="stat-label">Due Soon</span>
          <span class="stat-value">${stats.dueSoonCount}</span>
          <span class="stat-subtext">Due within 3 calendar days</span>
        </div>
      </div>

      <div class="stat-card" style="border-left: 3.5px solid var(--danger);">
        <div class="stat-icon danger" style="position: relative;">
          <span>⏰</span>
          ${stats.overdueLoansCount > 0 ? '<span class="pulse-dot" style="position: absolute; top: 6px; right: 6px;"></span>' : ''}
        </div>
        <div class="stat-info">
          <span class="stat-label">Overdue</span>
          <span class="stat-value" style="color: var(--danger);">${stats.overdueLoansCount}</span>
          <span class="stat-subtext">Requires return at circulation desk</span>
        </div>
      </div>

      <div class="stat-card" style="border-left: 3.5px solid var(--accent);">
        <div class="stat-icon accent">₹</div>
        <div class="stat-info">
          <span class="stat-label">Outstanding Fine</span>
          <span class="stat-value" style="color: ${stats.totalPendingFine > 0 ? 'var(--danger)' : 'var(--success)'}">
            ₹${stats.totalPendingFine}
          </span>
          <span class="stat-subtext">${stats.totalPendingFine > 0 ? 'Payable at circulation counter' : 'No pending dues'}</span>
        </div>
      </div>
    `;

    const badge = document.getElementById('student-borrowed-count-badge');
    if (badge) {
      badge.innerText = `${stats.activeLoansCount} of 4 quota used`;
    }
  },

  renderAlerts(overdueLoans, dueSoonLoans) {
    const banner = document.getElementById('student-alerts-banner');
    if (!banner) return;

    if (overdueLoans.length > 0) {
      banner.innerHTML = `
        <div class="card" style="border: 1px solid var(--danger-border); border-left: 5px solid var(--danger); background: rgba(239, 68, 68, 0.08); padding: 1.35rem; box-shadow: 0 8px 30px rgba(239, 68, 68, 0.15);">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <span class="pulse-dot"></span>
            <div>
              <strong style="color: var(--danger); font-size: 1.05rem;">Overdue Book Alert!</strong>
              <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.25rem;">
                You have ${overdueLoans.length} book(s) past their 14-day borrowing duration. Automated late fines are accumulating at ₹5 per day. Please return them to the library desk.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (dueSoonLoans.length > 0) {
      banner.innerHTML = `
        <div class="card" style="border: 1px solid var(--warning-border); border-left: 5px solid var(--warning); background: rgba(245, 158, 11, 0.08); padding: 1.35rem;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <span style="font-size: 1.35rem;">⏳</span>
            <div>
              <strong style="color: var(--warning); font-size: 1.05rem;">Upcoming Due Date Notice</strong>
              <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 0.25rem;">
                You have book(s) due within the next 3 days. Return or renew them on time to avoid fines.
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      banner.innerHTML = '';
    }
  },

  renderActiveBooks(activeLoans) {
    const container = document.getElementById('student-active-books-container');
    if (!container) return;

    if (activeLoans.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="font-size: 2.25rem; margin-bottom: 0.6rem;">📚</div>
          <h4 style="font-size: 1.1rem; font-weight: 700;">No books currently borrowed</h4>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.25rem;">
            You have full borrowing quota available (up to 4 books).
          </p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1.15rem;" onclick="state.setTab('books')">
            Explore Book Catalog
          </button>
        </div>
      `;
      return;
    }

    const now = new Date();

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
        ${activeLoans.map(i => {
          const due = new Date(i.dueDate);
          const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

          let countdownBadge;
          if (i.isOverdue) {
            countdownBadge = `<span class="badge badge-danger">Overdue by ${i.overdueDays} days (₹${i.calculatedFine} fine)</span>`;
          } else if (diffDays === 0) {
            countdownBadge = `<span class="badge badge-warning">Due Today!</span>`;
          } else if (diffDays <= 3) {
            countdownBadge = `<span class="badge badge-warning">Due in ${diffDays} days</span>`;
          } else {
            countdownBadge = `<span class="badge badge-success">Due in ${diffDays} days</span>`;
          }

          return `
            <div class="card" style="border: 1px solid ${i.isOverdue ? 'var(--danger-border)' : 'var(--border-color)'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <span class="book-id-badge">${i.bookId}</span>
                ${countdownBadge}
              </div>

              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem; letter-spacing: -0.01em;">${i.bookTitle}</h3>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">Transaction: <span style="font-family: var(--font-mono);">${i.id}</span></p>

              <div class="book-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Issued On</span>
                  <span class="meta-val">${new Date(i.issueDate).toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Due Date</span>
                  <span class="meta-val" style="color: ${i.isOverdue ? 'var(--danger)' : 'inherit'};">
                    ${due.toLocaleDateString()}
                  </span>
                </div>
              </div>

              ${i.isOverdue ? `
                <div style="margin-top: 1rem; padding: 0.75rem 0.95rem; background: rgba(239, 68, 68, 0.12); border-radius: var(--radius-md); font-size: 0.84rem; color: var(--danger); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--danger-border);">
                  <span>Accrued Fine:</span>
                  <strong>₹${i.calculatedFine}</strong>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderHistory(history) {
    const container = document.getElementById('student-history-container');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `<p style="padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted);">No past borrowing history recorded yet.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="border: none; background: transparent; box-shadow: none;">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Status</th>
              <th>Fine Paid</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(h => `
              <tr>
                <td>
                  <span class="table-cell-title">${h.bookTitle}</span>
                  <span class="table-cell-sub">${h.bookId} • ${h.id}</span>
                </td>
                <td>${new Date(h.issueDate).toLocaleDateString()}</td>
                <td>${new Date(h.dueDate).toLocaleDateString()}</td>
                <td>${h.returnDate ? new Date(h.returnDate).toLocaleDateString() : '<em>Still Active</em>'}</td>
                <td>
                  ${h.returnDate
                    ? `<span class="badge badge-success">Returned</span>`
                    : (h.isOverdue ? `<span class="badge badge-danger">Overdue</span>` : `<span class="badge badge-info">Active</span>`)}
                </td>
                <td>
                  ${(h.calculatedFine > 0 || h.fineAmount > 0)
                    ? `<strong style="color: ${h.finePaid ? 'var(--success)' : 'var(--danger)'}">₹${h.fineAmount || h.calculatedFine} (${h.finePaid ? 'Paid' : 'Unpaid'})</strong>`
                    : `<span style="color: var(--text-muted);">₹0</span>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};
