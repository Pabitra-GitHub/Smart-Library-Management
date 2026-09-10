/**
 * Librarian Dashboard View
 * Implements PRD Section 6.10 (Librarian Dashboard)
 */

const LibrarianView = {
  async render(container) {
    container.innerHTML = `
      <!-- Spacious Header Row -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1.25rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
            <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; margin: 0;">Librarian Control Center</h1>
            <span class="badge badge-primary" style="font-size: 0.72rem; padding: 0.2rem 0.6rem;">Admin Core</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 0;">Collegiate Library Inventory, 14-Day Loan Tracking & Real-Time Analytics</p>
        </div>
        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: center;">
          <button id="btn-quick-issue" class="btn btn-primary" style="padding: 0.5rem 1rem;">
            <span>+</span> Issue Book
          </button>
          <button id="btn-quick-add-book" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
            <span>+</span> Add Book
          </button>
          <button id="btn-open-settings" class="btn btn-secondary" style="padding: 0.5rem 0.85rem;" title="Configure loan period and fine rate">
            <span>⚙</span> Settings
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div id="librarian-stats-grid" class="stats-grid">
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
        <div class="card skeleton" style="height: 110px;"></div>
      </div>

      <!-- Overdue Books Alert Banner (if any) -->
      <div id="overdue-alerts-section" style="margin-bottom: 2rem;"></div>

      <!-- Main Columns: Recent Activity & Category Breakdown -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="dashboard-split-grid">
        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Borrowing Activity</h2>
            <button class="btn btn-secondary btn-sm" onclick="state.setTab('issues')">View All Issues →</button>
          </div>
          <div id="recent-issues-table-container">
            <div class="skeleton" style="height: 200px;"></div>
          </div>
        </div>

        <!-- Category Distribution & System Status -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Catalog by Category</h2>
          </div>
          <div id="category-distribution-container">
            <div class="skeleton" style="height: 180px;"></div>
          </div>
        </div>
      </div>

      <!-- Lower Dashboard Operational Highlights (Balances screen space) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        <div class="card" style="padding: 1.35rem; border-left: 4px solid var(--primary);">
          <div style="font-size: 1.35rem; margin-bottom: 0.4rem;">🔄</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Automated 14-Day Loans</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0;">
            Every issue automatically calculates a 14-day due date and tracks ₹5/day late fees with instant receipt generation.
          </p>
        </div>

        <div class="card" style="padding: 1.35rem; border-left: 4px solid var(--accent);">
          <div style="font-size: 1.35rem; margin-bottom: 0.4rem;">✨</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Natural Language AI Search</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0;">
            Students can search intuitively (e.g. <em>"beginner python book"</em>) using intent and keyword extraction.
          </p>
        </div>

        <div class="card" style="padding: 1.35rem; border-left: 4px solid var(--success);">
          <div style="font-size: 1.35rem; margin-bottom: 0.4rem;">🛡️</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Quota & Security Guard</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0;">
            Enforces maximum 4 books per student, duplicate issue protection, and passcode-gated librarian registration.
          </p>
        </div>
      </div>
    `;

    // Load data
    try {
      const data = await API.getLibrarianStats();
      this.renderStats(data.stats);
      this.renderOverdueAlerts(data.overdueAlerts);
      this.renderRecentTransactions(data.recentTransactions);
      this.renderCategoryDistribution(data.categoryDistribution, data.stats.totalCopies);
    } catch (err) {
      Toast.error('Failed to load dashboard metrics: ' + err.message);
    }

    // Attach button events
    document.getElementById('btn-quick-issue').addEventListener('click', () => {
      state.setTab('issues');
      setTimeout(() => IssuesView.openIssueModal(), 100);
    });

    document.getElementById('btn-quick-add-book').addEventListener('click', () => {
      state.setTab('books');
      setTimeout(() => BooksView.openAddBookModal(), 100);
    });

    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.openSettingsModal();
    });
  },

  renderStats(stats) {
    const grid = document.getElementById('librarian-stats-grid');
    if (!grid) return;

    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon primary">📚</div>
        <div class="stat-info">
          <span class="stat-label">Total Titles</span>
          <span class="stat-value">${stats.totalBookTitles}</span>
          <span class="stat-subtext">${stats.totalCopies} total copies in library</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon success">✓</div>
        <div class="stat-info">
          <span class="stat-label">Available Copies</span>
          <span class="stat-value">${stats.availableCopies}</span>
          <span class="stat-subtext">${Math.round((stats.availableCopies / (stats.totalCopies || 1)) * 100)}% on shelves</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon warning">📖</div>
        <div class="stat-info">
          <span class="stat-label">Currently Issued</span>
          <span class="stat-value">${stats.issuedCopies}</span>
          <span class="stat-subtext">${stats.activeLoansCount} active loans</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon danger">
          <span class="pulse-dot" style="margin-right: 2px;"></span> ⏰
        </div>
        <div class="stat-info">
          <span class="stat-label">Overdue Books</span>
          <span class="stat-value" style="color: var(--danger);">${stats.overdueLoansCount}</span>
          <span class="stat-subtext">Requires return / fee collection</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon accent">₹</div>
        <div class="stat-info">
          <span class="stat-label">Fines Accrued</span>
          <span class="stat-value">₹${stats.totalFinesAccrued}</span>
          <span class="stat-subtext">₹${stats.totalFinesCollected} collected • ₹${stats.totalFinesPending} pending</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon primary">👥</div>
        <div class="stat-info">
          <span class="stat-label">Registered Students</span>
          <span class="stat-value">${stats.totalStudents}</span>
          <span class="stat-subtext">Across engineering departments</span>
        </div>
      </div>
    `;
  },

  renderOverdueAlerts(overdues) {
    const section = document.getElementById('overdue-alerts-section');
    if (!section) return;

    if (!overdues || overdues.length === 0) {
      section.innerHTML = '';
      return;
    }

    section.innerHTML = `
      <div class="card" style="border-left: 4px solid var(--danger); background: rgba(239, 68, 68, 0.05);">
        <div class="card-header" style="margin-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="pulse-dot"></span>
            <strong style="color: var(--danger); font-size: 1.05rem;">Overdue Action Required (${overdues.length} Book${overdues.length > 1 ? 's' : ''})</strong>
          </div>
          <span class="badge badge-danger">Fine Rate: ₹5 / day</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          The following issued books have exceeded the 14-day borrowing duration. Automated late fees are accumulating:
        </p>
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Book Details</th>
                <th>Student</th>
                <th>Due Date</th>
                <th>Late By</th>
                <th>Accumulated Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${overdues.map(i => `
                <tr>
                  <td>
                    <span class="table-cell-title">${i.bookTitle}</span>
                    <span class="table-cell-sub">ID: ${i.bookId}</span>
                  </td>
                  <td>
                    <span class="table-cell-title">${i.studentName}</span>
                    <span class="table-cell-sub">${i.studentId} • ${i.studentEmail}</span>
                  </td>
                  <td>${new Date(i.dueDate).toLocaleDateString()}</td>
                  <td><span class="badge badge-danger">${i.overdueDays} Days</span></td>
                  <td><strong style="color: var(--danger); font-size: 1rem;">₹${i.calculatedFine}</strong></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="IssuesView.openReturnModal('${i.id}')">
                      Process Return
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderRecentTransactions(transactions) {
    const container = document.getElementById('recent-issues-table-container');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.75rem 1.5rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); background: rgba(0, 0, 0, 0.12);">
          <div style="font-size: 2.25rem; margin-bottom: 0.6rem;">🔄</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">No Circulation Activity Recorded</h4>
          <p style="color: var(--text-muted); font-size: 0.86rem; margin: 0.35rem auto 1.25rem; max-width: 380px;">
            Issue books to registered students to track live loans, automated 14-day due dates, and fee calculations.
          </p>
          <button class="btn btn-primary btn-sm" onclick="state.setTab('issues'); setTimeout(() => IssuesView.openIssueModal(), 100);">
            + Issue a Book to Student
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="border: none;">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Student</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => {
              const statusBadge = t.returnDate
                ? `<span class="badge badge-success">RETURNED</span>`
                : (t.isOverdue
                  ? `<span class="badge badge-danger">OVERDUE</span>`
                  : `<span class="badge badge-info">ISSUED</span>`);

              const fineDisplay = (t.calculatedFine > 0 || t.fineAmount > 0)
                ? `<strong style="color:${t.finePaid ? 'var(--success)' : 'var(--danger)'}">₹${t.fineAmount || t.calculatedFine} (${t.finePaid ? 'Paid' : 'Pending'})</strong>`
                : `<span style="color: var(--text-muted);">₹0</span>`;

              return `
                <tr>
                  <td>
                    <span class="table-cell-title">${t.bookTitle}</span>
                    <span class="table-cell-sub">${t.id}</span>
                  </td>
                  <td>
                    <span class="table-cell-title">${t.studentName}</span>
                    <span class="table-cell-sub">${t.studentId}</span>
                  </td>
                  <td>${new Date(t.issueDate).toLocaleDateString()}</td>
                  <td>${new Date(t.dueDate).toLocaleDateString()}</td>
                  <td>${statusBadge}</td>
                  <td>${fineDisplay}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderCategoryDistribution(categories, totalCopies) {
    const container = document.getElementById('category-distribution-container');
    if (!container) return;

    if (!categories || categories.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.75rem 1.25rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); background: rgba(0, 0, 0, 0.12);">
          <div style="font-size: 2.25rem; margin-bottom: 0.6rem;">📊</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">Catalog Awaiting Books</h4>
          <p style="color: var(--text-muted); font-size: 0.86rem; margin: 0.35rem auto 1.25rem; max-width: 280px;">
            Add books across departments to populate real-time shelf analytics.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="state.setTab('books'); setTimeout(() => BooksView.openAddBookModal(), 100);">
            + Add First Book
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${categories.map(cat => {
          const percentage = Math.round((cat.count / (totalCopies || 1)) * 100);
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
                <span>${cat.category}</span>
                <span style="color: var(--text-muted);">${cat.count} copies (${percentage}%)</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async openSettingsModal() {
    let settings = { loanPeriodDays: 14, finePerDay: 5, maxBooksPerStudent: 4 };
    try {
      const res = await API.getSettings();
      if (res.settings) settings = res.settings;
    } catch (e) {}

    const modal = document.getElementById('settings-dialog');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">⚙ Library Rules & Configuration</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('settings-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="settings-form">
          <div class="form-group">
            <label class="form-label">Standard Loan Period (Days)</label>
            <input type="number" id="setting-loan-period" class="form-control" value="${settings.loanPeriodDays}" min="1" max="90" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Standard borrowing duration before an issue becomes overdue. (Default: 14 days)</span>
          </div>

          <div class="form-group">
            <label class="form-label">Daily Fine Rate (₹ per day)</label>
            <input type="number" id="setting-fine-rate" class="form-control" value="${settings.finePerDay}" min="0" max="100" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Fine calculated automatically per late day. (Default: ₹5/day)</span>
          </div>

          <div class="form-group">
            <label class="form-label">Max Active Books Allowed per Student</label>
            <input type="number" id="setting-max-books" class="form-control" value="${settings.maxBooksPerStudent}" min="1" max="10" required />
            <span style="font-size: 0.75rem; color: var(--text-muted);">Prevents student from borrowing more than this limit. (Default: 4 books)</span>
          </div>

          <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color);">
            <label class="form-label" style="color: var(--warning);">Reset Demo Dataset</label>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              Restore all books, students, and sample issue records to initial demo state.
            </p>
            <button type="button" id="btn-reset-demo" class="btn btn-danger btn-sm">
              🔄 Reset to Clean Demo State
            </button>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('settings-dialog')">Cancel</button>
        <button type="button" id="btn-save-settings" class="btn btn-primary">Save Settings</button>
      </div>
    `;

    Modal.open('settings-dialog');

    document.getElementById('btn-save-settings').addEventListener('click', async () => {
      const loanPeriodDays = document.getElementById('setting-loan-period').value;
      const finePerDay = document.getElementById('setting-fine-rate').value;
      const maxBooksPerStudent = document.getElementById('setting-max-books').value;

      try {
        await API.updateSettings({ loanPeriodDays, finePerDay, maxBooksPerStudent });
        Toast.success('Library settings updated successfully');
        Modal.close('settings-dialog');
        LibrarianView.render(document.getElementById('view-container'));
      } catch (err) {
        Toast.error(err.message);
      }
    });

    document.getElementById('btn-reset-demo').addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset the database to sample demo data? Any unsaved changes will be replaced with the original B.Tech sample dataset.')) {
        try {
          await API.resetDemoData();
          Toast.success('Database reset to clean demo state!');
          Modal.close('settings-dialog');
          LibrarianView.render(document.getElementById('view-container'));
        } catch (err) {
          Toast.error(err.message);
        }
      }
    });
  }
};
