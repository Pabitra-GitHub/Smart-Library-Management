/**
 * Librarian Dashboard View
 * Implements PRD Section 6.10 (Librarian Dashboard)
 * Styled with authentic Apple-grade glassmorphic architecture and interactive bar-style chart structures
 */

const LibrarianView = {
  currentStats: null,
  allBooksCache: null,
  allIssuesCache: null,

  async render(container) {
    container.innerHTML = `
      <!-- Apple-Style Glass Command Header Bar -->
      <div class="glass-toolbar" style="margin-bottom: 2rem;">
        <div class="glass-toolbar-row">
          <div>
            <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.25rem;">
              <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em; margin: 0;">Librarian Control Center</h1>
              <span class="badge badge-primary" style="font-size: 0.72rem; padding: 0.22rem 0.65rem;">Admin Core</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.90rem; margin: 0;">Collegiate Technical Inventory, 14-Day Automated Circulation & Real-Time Analytics</p>
          </div>
          <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: center;">
            <button id="btn-quick-issue" class="btn btn-primary" style="padding: 0.55rem 1.15rem;">
              <span>+</span> Issue Book
            </button>
            <button id="btn-quick-add-book" class="btn btn-secondary" style="padding: 0.55rem 1.15rem;">
              <span>+</span> Add Book
            </button>
            <button id="btn-open-settings" class="btn btn-secondary" style="padding: 0.55rem 0.95rem;" title="Configure borrowing period and fine rate">
              <span>⚙</span> Settings
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Metric Strips Grid (Interactive Bars) -->
      <div id="librarian-stats-grid" class="stats-grid stats-grid-6">
        <div class="card skeleton" style="height: 118px;"></div>
        <div class="card skeleton" style="height: 118px;"></div>
        <div class="card skeleton" style="height: 118px;"></div>
        <div class="card skeleton" style="height: 118px;"></div>
        <div class="card skeleton" style="height: 118px;"></div>
        <div class="card skeleton" style="height: 118px;"></div>
      </div>

      <!-- Dedicated Interactive Circulation & Shelf Inventory Chart -->
      <div id="circulation-chart-section">
        <div class="card skeleton" style="height: 240px; margin-bottom: 2rem;"></div>
      </div>

      <!-- Overdue Books Alert Banner (if any) -->
      <div id="overdue-alerts-section" style="margin-bottom: 2rem;"></div>

      <!-- Main Columns: Recent Activity & Category Breakdown -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="dashboard-split-grid">
        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Borrowing Activity</h2>
            <button class="btn btn-secondary btn-sm" onclick="state.setTab('issues')">View All Circulation →</button>
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

      <!-- Lower Dashboard Operational Highlights (Apple Frosted Glass Strips) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
        <div class="card" style="padding: 1.45rem; border-left: 4px solid var(--primary);">
          <div style="font-size: 1.4rem; margin-bottom: 0.45rem;">🔄</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Automated 14-Day Borrowing</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
            Every issue automatically calculates a 14-day due date and tracks ₹5/day late fees with instant digital transaction receipts.
          </p>
        </div>

        <div class="card" style="padding: 1.45rem; border-left: 4px solid var(--accent);">
          <div style="font-size: 1.4rem; margin-bottom: 0.45rem;">✨</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Natural Language AI Search</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
            Students can search intuitively (e.g. <em>"beginner python book"</em>) using intent identification and multi-token keyword extraction.
          </p>
        </div>

        <div class="card" style="padding: 1.45rem; border-left: 4px solid var(--success);">
          <div style="font-size: 1.4rem; margin-bottom: 0.45rem;">🛡️</div>
          <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">Quota & Security Guard</h3>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
            Enforces maximum 4 books per student, duplicate issue protection, and passcode-gated librarian registration.
          </p>
        </div>
      </div>
    `;

    // Load data
    try {
      const data = await API.getLibrarianStats();
      this.currentStats = data.stats;
      this.renderStats(data.stats);
      this.renderCirculationChart(data.stats);
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

    const availablePct = Math.round((stats.availableCopies / (stats.totalCopies || 1)) * 100);
    const issuedPct = Math.round((stats.issuedCopies / (stats.totalCopies || 1)) * 100);
    const overduePct = Math.min(100, Math.round((stats.overdueLoansCount / (stats.totalCopies || 1)) * 100));

    grid.innerHTML = `
      <!-- Total Titles Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-total-titles" style="border-left: 3.5px solid var(--primary);" role="button" tabindex="0" title="Click to view full catalog">
        <span class="stat-card-badge">Details ↗</span>
        <div class="stat-icon primary">📚</div>
        <div class="stat-info">
          <span class="stat-label">Total Titles</span>
          <span class="stat-value">${stats.totalBookTitles}</span>
          <span class="stat-subtext">${stats.totalCopies} total copies in library</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: 100%; background: var(--primary);"></div>
          </div>
        </div>
      </div>

      <!-- Available Copies Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-available" style="border-left: 3.5px solid var(--success);" role="button" tabindex="0" title="Click to view available books">
        <span class="stat-card-badge">Details ↗</span>
        <div class="stat-icon success">✓</div>
        <div class="stat-info">
          <span class="stat-label">Available Copies</span>
          <span class="stat-value">${stats.availableCopies}</span>
          <span class="stat-subtext">${availablePct}% on shelves</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: ${availablePct}%; background: var(--success);"></div>
          </div>
        </div>
      </div>

      <!-- Currently Issued / Borrowed Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-issued" style="border-left: 3.5px solid var(--warning);" role="button" tabindex="0" title="Click to view currently borrowed books">
        <span class="stat-card-badge">Details ↗</span>
        <div class="stat-icon warning">📖</div>
        <div class="stat-info">
          <span class="stat-label">Currently Issued</span>
          <span class="stat-value">${stats.issuedCopies}</span>
          <span class="stat-subtext">${stats.activeLoansCount} active borrowed</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: ${issuedPct}%; background: var(--warning);"></div>
          </div>
        </div>
      </div>

      <!-- Overdue Books Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-overdue" style="border-left: 3.5px solid var(--danger);" role="button" tabindex="0" title="Click to view overdue books">
        <span class="stat-card-badge" style="color: var(--danger); background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.3);">Details ↗</span>
        <div class="stat-icon danger" style="position: relative;">
          <span>⏰</span>
          ${stats.overdueLoansCount > 0 ? '<span class="pulse-dot" style="position: absolute; top: 6px; right: 6px;"></span>' : ''}
        </div>
        <div class="stat-info">
          <span class="stat-label">Overdue Books</span>
          <span class="stat-value" style="color: ${stats.overdueLoansCount > 0 ? 'var(--danger)' : 'var(--text-primary)'};">${stats.overdueLoansCount}</span>
          <span class="stat-subtext">Requires return / fee collection</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: ${overduePct > 0 ? overduePct : (stats.overdueLoansCount > 0 ? 100 : 0)}%; background: var(--danger);"></div>
          </div>
        </div>
      </div>

      <!-- Fines Accrued Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-fines" style="border-left: 3.5px solid var(--accent);" role="button" tabindex="0" title="Click to view fines & penalties">
        <span class="stat-card-badge" style="color: var(--accent); background: rgba(6, 182, 212, 0.14); border-color: rgba(6, 182, 212, 0.3);">Details ↗</span>
        <div class="stat-icon accent">₹</div>
        <div class="stat-info">
          <span class="stat-label">Fines Accrued</span>
          <span class="stat-value">₹${stats.totalFinesAccrued}</span>
          <span class="stat-subtext">₹${stats.totalFinesCollected} collected • ₹${stats.totalFinesPending} pending</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: ${stats.totalFinesAccrued > 0 ? '100' : '0'}%; background: var(--accent);"></div>
          </div>
        </div>
      </div>

      <!-- Registered Students Bar Card -->
      <div class="stat-card interactive-bar" id="stat-card-students" style="border-left: 3.5px solid var(--primary);" role="button" tabindex="0" title="Click to view registered students">
        <span class="stat-card-badge">Details ↗</span>
        <div class="stat-icon primary">👥</div>
        <div class="stat-info">
          <span class="stat-label">Registered Students</span>
          <span class="stat-value">${stats.totalStudents}</span>
          <span class="stat-subtext">Across engineering departments</span>
          <div class="stat-mini-bar">
            <div class="stat-mini-bar-fill" style="width: 100%; background: var(--primary);"></div>
          </div>
        </div>
      </div>
    `;

    // Attach click handlers to stat cards
    document.getElementById('stat-card-total-titles')?.addEventListener('click', () => this.handleBarClick('total'));
    document.getElementById('stat-card-available')?.addEventListener('click', () => this.handleBarClick('available'));
    document.getElementById('stat-card-issued')?.addEventListener('click', () => this.handleBarClick('borrowed'));
    document.getElementById('stat-card-overdue')?.addEventListener('click', () => this.handleBarClick('overdue'));
    document.getElementById('stat-card-fines')?.addEventListener('click', () => this.handleBarClick('fines'));
    document.getElementById('stat-card-students')?.addEventListener('click', () => this.handleBarClick('students'));
  },

  renderCirculationChart(stats) {
    const container = document.getElementById('circulation-chart-section');
    if (!container) return;

    const total = stats.totalCopies || 1;
    const availablePct = Math.round((stats.availableCopies / total) * 100);
    const borrowedPct = Math.round((stats.issuedCopies / total) * 100);
    const overduePct = Math.min(100, Math.round((stats.overdueLoansCount / total) * 100));

    container.innerHTML = `
      <div class="status-chart-card">
        <div class="status-chart-header">
          <div class="status-chart-title-group">
            <h2 class="status-chart-title">
              <span>📊</span> Circulation & Shelf Inventory Chart
            </h2>
            <span class="badge badge-primary" style="font-size: 0.72rem;">Live Interactive Bars</span>
          </div>
          <div class="status-chart-hint">
            <span>💡</span> Click any bar to prompt confirmation & view that category's detailed list
          </div>
        </div>

        <div class="chart-bar-group" id="circulation-chart-bars">
          <!-- Available Books Bar -->
          <div class="chart-bar-row" id="chart-bar-available" role="button" tabindex="0" title="Click to view available books">
            <div class="chart-bar-header">
              <div class="chart-bar-label-group">
                <span class="chart-bar-icon">✓</span>
                <span class="chart-bar-label">Available Books on Shelves</span>
              </div>
              <div class="chart-bar-meta">
                <span class="chart-bar-count">${stats.availableCopies} of ${stats.totalCopies} Copies</span>
                <span class="chart-bar-badge badge-success">${availablePct}%</span>
              </div>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill success" style="width: ${availablePct}%;"></div>
            </div>
            <div class="chart-bar-footer">
              <span>Ready for immediate checkout to students</span>
              <span class="chart-bar-action-prompt">Click bar to view details →</span>
            </div>
          </div>

          <!-- Currently Borrowed Bar -->
          <div class="chart-bar-row" id="chart-bar-borrowed" role="button" tabindex="0" title="Click to view currently borrowed books">
            <div class="chart-bar-header">
              <div class="chart-bar-label-group">
                <span class="chart-bar-icon">📖</span>
                <span class="chart-bar-label">Currently Borrowed</span>
              </div>
              <div class="chart-bar-meta">
                <span class="chart-bar-count">${stats.issuedCopies} of ${stats.totalCopies} Copies</span>
                <span class="chart-bar-badge badge-warning">${borrowedPct}%</span>
              </div>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill warning" style="width: ${borrowedPct}%;"></div>
            </div>
            <div class="chart-bar-footer">
              <span>${stats.activeLoansCount} active student borrowing record(s)</span>
              <span class="chart-bar-action-prompt">Click bar to view details →</span>
            </div>
          </div>

          <!-- Overdue Books Bar -->
          <div class="chart-bar-row" id="chart-bar-overdue" role="button" tabindex="0" title="Click to view overdue books">
            <div class="chart-bar-header">
              <div class="chart-bar-label-group">
                <span class="chart-bar-icon">⏰</span>
                <span class="chart-bar-label" style="display: flex; align-items: center; gap: 0.4rem;">
                  Overdue Books
                  ${stats.overdueLoansCount > 0 ? '<span class="pulse-dot"></span>' : ''}
                </span>
              </div>
              <div class="chart-bar-meta">
                <span class="chart-bar-count" style="color: ${stats.overdueLoansCount > 0 ? 'var(--danger)' : 'var(--text-primary)'};">${stats.overdueLoansCount} Books</span>
                <span class="chart-bar-badge ${stats.overdueLoansCount > 0 ? 'badge-danger' : 'badge-neutral'}">${overduePct}%</span>
              </div>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill danger" style="width: ${overduePct > 0 ? overduePct : (stats.overdueLoansCount > 0 ? 100 : 0)}%;"></div>
            </div>
            <div class="chart-bar-footer">
              <span>${stats.overdueLoansCount > 0 ? 'Accumulating ₹5/day fine • Requires immediate return' : 'All borrowed books within allowed duration'}</span>
              <span class="chart-bar-action-prompt">Click bar to view details →</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach click events to the chart bars
    document.getElementById('chart-bar-available')?.addEventListener('click', () => this.handleBarClick('available'));
    document.getElementById('chart-bar-borrowed')?.addEventListener('click', () => this.handleBarClick('borrowed'));
    document.getElementById('chart-bar-overdue')?.addEventListener('click', () => this.handleBarClick('overdue'));
  },

  /**
   * Confirmation Prompt before displaying details for any clicked bar
   */
  handleBarClick(type, param = null) {
    const configs = {
      'available': {
        title: 'View Available Books?',
        message: 'Do you want to proceed and view the detailed list of all books currently available on the library shelves?',
        icon: '✓',
        confirmText: 'Proceed to View Available'
      },
      'overdue': {
        title: 'View Overdue Books?',
        message: 'Do you want to proceed and inspect the list of overdue books requiring return and fine processing?',
        icon: '⏰',
        confirmText: 'Proceed to View Overdue'
      },
      'borrowed': {
        title: 'View Currently Borrowed Books?',
        message: 'Do you want to proceed and view all books currently issued to students?',
        icon: '📖',
        confirmText: 'Proceed to View Borrowed'
      },
      'total': {
        title: 'View Full Catalog?',
        message: 'Do you want to proceed and view all titles registered in the technical catalog?',
        icon: '📚',
        confirmText: 'Proceed to View Catalog'
      },
      'students': {
        title: 'View Registered Students?',
        message: 'Do you want to proceed and view the directory of registered engineering students?',
        icon: '👥',
        confirmText: 'Proceed to View Students'
      },
      'fines': {
        title: 'View Fines & Penalties?',
        message: 'Do you want to proceed and view the breakdown of collected and pending late fees?',
        icon: '₹',
        confirmText: 'Proceed to View Fines'
      },
      'category': {
        title: `View ${param} Books?`,
        message: `Do you want to proceed and view the list of library books under the "${param}" category?`,
        icon: '📂',
        confirmText: `Proceed to View ${param}`
      }
    };

    const config = configs[type] || configs['available'];

    Modal.confirm({
      title: config.title,
      message: config.message,
      icon: config.icon,
      confirmText: config.confirmText,
      cancelText: 'Cancel',
      onConfirm: () => {
        this.showChartDetails(type, param);
      }
    });
  },

  /**
   * Dynamic Display of Details in #chart-details-dialog
   */
  async showChartDetails(type, param = null) {
    const dialog = document.getElementById('chart-details-dialog');
    if (!dialog) return;

    const titles = {
      'available': { title: 'Available Books on Shelves', icon: '✓', badgeClass: 'badge-success' },
      'overdue': { title: 'Overdue Books (Action Required)', icon: '⏰', badgeClass: 'badge-danger' },
      'borrowed': { title: 'Currently Borrowed Books', icon: '📖', badgeClass: 'badge-warning' },
      'total': { title: 'Full Technical Library Catalog', icon: '📚', badgeClass: 'badge-primary' },
      'students': { title: 'Registered Students Directory', icon: '👥', badgeClass: 'badge-primary' },
      'fines': { title: 'Accrued Fines & Penalties', icon: '₹', badgeClass: 'badge-accent' },
      'category': { title: `Category: ${param}`, icon: '📂', badgeClass: 'badge-category' }
    };

    const headerConfig = titles[type] || titles['available'];

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="font-size: 1.35rem;">${headerConfig.icon}</span>
          <span>${headerConfig.title}</span>
        </h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('chart-details-dialog')">✕</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="chart-details-filter-bar">
          <div class="search-bar-wrapper" style="max-width: 380px; flex: 1;">
            <span class="search-icon">🔍</span>
            <input type="text" id="chart-details-search" class="form-control search-input" placeholder="Search within these records..." />
          </div>
          <div id="chart-details-count-pill" class="chart-details-stats-pill">
            <span>Loading details...</span>
          </div>
        </div>

        <div id="chart-details-content">
          <div class="skeleton" style="height: 240px;"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('chart-details-dialog')">Close</button>
        <button type="button" id="chart-details-primary-action" class="btn btn-primary">Open in Full View →</button>
      </div>
    `;

    Modal.open('chart-details-dialog');

    try {
      if (type === 'available') {
        const res = await API.getBooks();
        const availableBooks = (res.books || []).filter(b => b.availableCopies > 0);
        this.renderAvailableBooksInDialog(availableBooks);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('books');
        };
      } else if (type === 'overdue') {
        const res = await API.getIssues({ status: 'OVERDUE' });
        const overdues = res.issues || [];
        this.renderOverdueIssuesInDialog(overdues);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('issues');
          setTimeout(() => {
            const overdueChip = document.querySelector('#issue-status-chips [data-status="OVERDUE"]');
            if (overdueChip) overdueChip.click();
          }, 150);
        };
      } else if (type === 'borrowed') {
        const res = await API.getIssues({ status: 'ACTIVE' });
        const borrowed = res.issues || [];
        this.renderBorrowedIssuesInDialog(borrowed);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('issues');
        };
      } else if (type === 'total') {
        const res = await API.getBooks();
        const books = res.books || [];
        this.renderAvailableBooksInDialog(books, true);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('books');
        };
      } else if (type === 'students') {
        const res = await API.getStudents();
        const students = res.students || [];
        this.renderStudentsInDialog(students);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('students');
        };
      } else if (type === 'fines') {
        const res = await API.getIssues();
        const withFines = (res.issues || []).filter(i => (i.calculatedFine > 0 || i.fineAmount > 0));
        this.renderFinesInDialog(withFines);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('issues');
        };
      } else if (type === 'category') {
        const res = await API.getBooks({ category: param });
        const books = res.books || [];
        this.renderCategoryBooksInDialog(books, param);

        document.getElementById('chart-details-primary-action').onclick = () => {
          Modal.close('chart-details-dialog');
          state.setTab('books');
          setTimeout(() => {
            const catSelect = document.getElementById('books-category-select');
            if (catSelect) {
              catSelect.value = param;
              catSelect.dispatchEvent(new Event('change'));
            }
          }, 150);
        };
      }
    } catch (err) {
      document.getElementById('chart-details-content').innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--danger);">
          <p>Failed to load records: ${err.message}</p>
        </div>
      `;
    }
  },

  renderAvailableBooksInDialog(books, isAll = false) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    const searchInput = document.getElementById('chart-details-search');

    const updateView = (filtered) => {
      countPill.innerHTML = `<span><strong>${filtered.length}</strong> ${isAll ? 'total titles' : 'available titles'}</span>`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📚</div>
            <p>No books match your search criteria.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container" style="border: 1px solid var(--border-color); max-height: 420px; overflow-y: auto;">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Title & Author</th>
                <th>Category</th>
                <th>Shelf</th>
                <th>Copies Available</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(b => `
                <tr>
                  <td>
                    <span class="table-cell-title">${b.title}</span>
                    <span class="table-cell-sub">By ${b.author} • ISBN: ${b.isbn}</span>
                  </td>
                  <td><span class="badge badge-category">${b.category}</span></td>
                  <td><span style="font-family: var(--font-mono); font-size: 0.85rem;">Shelf ${b.shelfNumber || 'N/A'}</span></td>
                  <td>
                    <strong style="color: ${b.availableCopies > 0 ? 'var(--success)' : 'var(--danger)'};">
                      ${b.availableCopies} / ${b.totalCopies}
                    </strong>
                    <span style="font-size: 0.76rem; color: var(--text-muted); display: block;">${Math.round((b.availableCopies / (b.totalCopies || 1)) * 100)}% on shelf</span>
                  </td>
                  <td>
                    ${b.availableCopies > 0 ? `
                      <button class="btn btn-primary btn-sm" onclick="Modal.close('chart-details-dialog'); state.setTab('issues'); setTimeout(() => IssuesView.openIssueModal('${b.id}'), 150);">
                        Issue Book
                      </button>
                    ` : `
                      <span class="badge badge-neutral">All Borrowed</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    updateView(books);

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = books.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.category.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
      updateView(filtered);
    });
  },

  renderOverdueIssuesInDialog(overdues) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    const searchInput = document.getElementById('chart-details-search');

    const updateView = (filtered) => {
      countPill.innerHTML = `<span><strong style="color: var(--danger);">${filtered.length}</strong> overdue records</span>`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--success);">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
            <h4 style="font-weight: 700; color: var(--text-primary);">Zero Overdue Books!</h4>
            <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 0.25rem;">
              All active book circulation records are currently within their standard 14-day borrowing duration.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container" style="border: 1px solid var(--border-color); max-height: 420px; overflow-y: auto;">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Book Details</th>
                <th>Student</th>
                <th>Due Date</th>
                <th>Late Duration</th>
                <th>Accrued Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(i => `
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
                  <td><span class="badge badge-danger">${i.overdueDays} Days Late</span></td>
                  <td><strong style="color: var(--danger); font-size: 1.05rem;">₹${i.calculatedFine}</strong></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="Modal.close('chart-details-dialog'); IssuesView.openReturnModal('${i.id}')">
                      Process Return
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    updateView(overdues);

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = overdues.filter(i => 
        i.bookTitle.toLowerCase().includes(q) || 
        i.studentName.toLowerCase().includes(q) || 
        i.studentId.toLowerCase().includes(q)
      );
      updateView(filtered);
    });
  },

  renderBorrowedIssuesInDialog(borrowed) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    const searchInput = document.getElementById('chart-details-search');

    const updateView = (filtered) => {
      countPill.innerHTML = `<span><strong>${filtered.length}</strong> active borrowed records</span>`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📖</div>
            <p>No active borrowed records found.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container" style="border: 1px solid var(--border-color); max-height: 420px; overflow-y: auto;">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Student</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(i => {
                const badge = i.isOverdue 
                  ? `<span class="badge badge-danger">OVERDUE</span>` 
                  : `<span class="badge badge-info">ISSUED</span>`;

                return `
                  <tr>
                    <td>
                      <span class="table-cell-title">${i.bookTitle}</span>
                      <span class="table-cell-sub">Issue ID: ${i.id}</span>
                    </td>
                    <td>
                      <span class="table-cell-title">${i.studentName}</span>
                      <span class="table-cell-sub">${i.studentId}</span>
                    </td>
                    <td>${new Date(i.issueDate).toLocaleDateString()}</td>
                    <td>${new Date(i.dueDate).toLocaleDateString()}</td>
                    <td>${badge}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="Modal.close('chart-details-dialog'); IssuesView.openReturnModal('${i.id}')">
                        Return
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    updateView(borrowed);

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = borrowed.filter(i => 
        i.bookTitle.toLowerCase().includes(q) || 
        i.studentName.toLowerCase().includes(q) || 
        i.studentId.toLowerCase().includes(q)
      );
      updateView(filtered);
    });
  },

  renderCategoryBooksInDialog(books, categoryName) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    countPill.innerHTML = `<span><strong>${books.length}</strong> titles in ${categoryName}</span>`;

    this.renderAvailableBooksInDialog(books, true);
  },

  renderStudentsInDialog(students) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    const searchInput = document.getElementById('chart-details-search');

    const updateView = (filtered) => {
      countPill.innerHTML = `<span><strong>${filtered.length}</strong> students</span>`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">👥</div>
            <p>No registered students match your search.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container" style="border: 1px solid var(--border-color); max-height: 420px; overflow-y: auto;">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Borrowed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(s => `
                <tr>
                  <td><strong style="font-family: var(--font-mono);">${s.id}</strong></td>
                  <td>
                    <span class="table-cell-title">${s.name}</span>
                    <span class="table-cell-sub">${s.email}</span>
                  </td>
                  <td><span class="badge badge-category">${s.department}</span></td>
                  <td><span class="badge ${s.activeLoansCount > 0 ? 'badge-warning' : 'badge-neutral'}">${s.activeLoansCount || 0} / 4</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="Modal.close('chart-details-dialog'); state.setTab('students'); setTimeout(() => StudentsView.viewStudentHistory('${s.id}'), 150);">
                      View History
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    updateView(students);

    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.id.toLowerCase().includes(q) || 
        s.department.toLowerCase().includes(q)
      );
      updateView(filtered);
    });
  },

  renderFinesInDialog(fineRecords) {
    const container = document.getElementById('chart-details-content');
    const countPill = document.getElementById('chart-details-count-pill');
    countPill.innerHTML = `<span><strong>${fineRecords.length}</strong> penalty records</span>`;

    if (fineRecords.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--success);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
          <h4 style="font-weight: 700; color: var(--text-primary);">Zero Pending Fines!</h4>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-top: 0.25rem;">
            All library late fines are fully settled and cleared.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="border: 1px solid var(--border-color); max-height: 420px; overflow-y: auto;">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Student</th>
              <th>Due Date</th>
              <th>Fine Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${fineRecords.map(f => `
              <tr>
                <td><span class="table-cell-title">${f.bookTitle}</span></td>
                <td><span class="table-cell-title">${f.studentName} (${f.studentId})</span></td>
                <td>${new Date(f.dueDate).toLocaleDateString()}</td>
                <td><strong style="color: var(--danger);">₹${f.fineAmount || f.calculatedFine}</strong></td>
                <td>
                  <span class="badge ${f.finePaid ? 'badge-success' : 'badge-danger'}">
                    ${f.finePaid ? 'PAID' : 'PENDING'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
      <div class="card" style="border: 1px solid var(--danger-border); border-left: 5px solid var(--danger); background: rgba(239, 68, 68, 0.07); box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);">
        <div class="card-header" style="margin-bottom: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="pulse-dot"></span>
            <strong style="color: var(--danger); font-size: 1.1rem; letter-spacing: -0.01em;">Overdue Action Required (${overdues.length} Book${overdues.length > 1 ? 's' : ''})</strong>
          </div>
          <span class="badge badge-danger">Fine Rate: ₹5 / day</span>
        </div>
        <p style="font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 1.15rem;">
          The following issued books have exceeded the 14-day borrowing duration. Automated late fees are accumulating daily:
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
                  <td><strong style="color: var(--danger); font-size: 1.05rem;">₹${i.calculatedFine}</strong></td>
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
            Issue books to registered students to track live borrowed books, automated 14-day due dates, and fee calculations.
          </p>
          <button class="btn btn-primary btn-sm" onclick="state.setTab('issues'); setTimeout(() => IssuesView.openIssueModal(), 100);">
            + Issue a Book to Student
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container" style="border: none; background: transparent; box-shadow: none;">
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
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${categories.map(cat => {
          const percentage = Math.round((cat.count / (totalCopies || 1)) * 100);
          return `
            <div class="category-bar-row" data-category="${cat.category}" role="button" tabindex="0" title="Click to view ${cat.category} books">
              <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 0.86rem; font-weight: 600; margin-bottom: 0.35rem;">
                <span style="color: var(--text-primary);">${cat.category}</span>
                <span style="color: var(--text-muted); font-size: 0.80rem;">${cat.count} copies (${percentage}%)</span>
              </div>
              <div class="progress-bar-container" style="height: 8px;">
                <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
                <span class="chart-bar-action-prompt" style="font-size: 0.74rem;">Inspect category →</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach click events to category rows
    container.querySelectorAll('.category-bar-row').forEach(row => {
      row.addEventListener('click', () => {
        const cat = row.dataset.category;
        this.handleBarClick('category', cat);
      });
    });
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
            <label class="form-label">Standard Borrowing Period (Days)</label>
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
